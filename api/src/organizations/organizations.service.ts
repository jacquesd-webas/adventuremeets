import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationDto } from "./dto/organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly database: DatabaseService) {}

  private mapMember(row: any) {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name ?? row.firstName,
      lastName: row.last_name ?? row.lastName,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string) {
    const org = await this.database
      .getClient()("organizations as o")
      .leftJoin(
        "user_organization_memberships as uom",
        "uom.organization_id",
        "o.id"
      )
      .leftJoin("templates as t", function () {
        this.on("t.organization_id", "=", "o.id").andOnNull("t.deleted_at");
      })
      .where("o.id", id)
      .groupBy("o.id")
      .select("o.*")
      .countDistinct({
        user_count: "uom.user_id",
        template_count: "t.id",
      })
      .first();
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return {
      ...org,
      user_count: Number(org.user_count || 0),
      template_count: Number(org.template_count || 0),
    };
  }

  async findAllByIds(ids: string[]) {
    const rows = await this.database
      .getClient()("organizations as o")
      .leftJoin(
        "user_organization_memberships as uom",
        "uom.organization_id",
        "o.id"
      )
      .leftJoin("templates as t", function () {
        this.on("t.organization_id", "=", "o.id").andOnNull("t.deleted_at");
      })
      .whereIn("o.id", ids)
      .groupBy("o.id")
      .select("o.*")
      .countDistinct({
        user_count: "uom.user_id",
        template_count: "t.id",
      })
      .orderBy("o.name", "asc");
    return rows.map((row) => ({
      ...row,
      user_count: Number(row.user_count || 0),
      template_count: Number(row.template_count || 0),
    }));
  }

  async findMembers(orgId: string) {
    const rows = await this.database
      .getClient()("users as u")
      .join("user_organization_memberships as uom", "uom.user_id", "u.id")
      .where("uom.organization_id", orgId)
      .orderBy("u.last_name", "asc")
      .orderBy("u.first_name", "asc")
      .select(
        "u.id",
        "u.email",
        "u.first_name",
        "u.last_name",
        "uom.role",
        "uom.status",
        "uom.created_at",
        "uom.updated_at"
      );

    return rows.map((row) => this.mapMember(row));
  }

  async findOrganizers(orgId: string) {
    const rows = await this.database
      .getClient()("users as u")
      .join("user_organization_memberships as uom", "uom.user_id", "u.id")
      .where("uom.organization_id", orgId)
      .whereIn("uom.role", ["organizer", "admin"])
      .orderBy("u.last_name", "asc")
      .orderBy("u.first_name", "asc")
      .select(
        "u.id",
        "u.email",
        "u.first_name",
        "u.last_name",
        "uom.role",
        "uom.status",
        "uom.created_at",
        "uom.updated_at"
      );

    return rows.map((row) => this.mapMember(row));
  }

  async updateMember(
    orgId: string,
    userId: string,
    payload: { role?: string; status?: string }
  ) {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.role) {
      const roleIdMap: Record<string, number> = {
        superuser: 1,
        admin: 2,
        organizer: 3,
        member: 4,
      };
      updates.role = payload.role;
      updates.role_id = roleIdMap[payload.role] ?? 4;
    }
    if (payload.status) {
      updates.status = payload.status;
    }

    if (Object.keys(updates).length === 1) {
      throw new BadRequestException("No member updates provided");
    }

    const updated = await this.database
      .getClient()("user_organization_memberships")
      .where({ organization_id: orgId, user_id: userId })
      .update(updates)
      .returning("*");

    const updatedRow = Array.isArray(updated) ? updated[0] : updated;
    if (!updatedRow) {
      throw new NotFoundException("Member not found");
    }

    const memberRow = await this.database
      .getClient()("users as u")
      .join("user_organization_memberships as uom", "uom.user_id", "u.id")
      .where("uom.organization_id", orgId)
      .andWhere("uom.user_id", userId)
      .select(
        "u.id",
        "u.email",
        "u.first_name",
        "u.last_name",
        "uom.role",
        "uom.status",
        "uom.created_at",
        "uom.updated_at"
      )
      .first();
    if (!memberRow) {
      throw new NotFoundException("Member not found");
    }
    return this.mapMember(memberRow);
  }

  async findTemplates(orgId: string) {
    const rows = await this.database
      .getClient()("templates")
      .where({ organization_id: orgId })
      .whereNull("deleted_at")
      .orderBy("name", "asc")
      .select("*");
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id ?? row.organizationId,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
      deletedAt: row.deleted_at ?? undefined,
    }));
  }

  async listMetaDefinitions(orgId: string) {
    const rows = await this.database
      .getClient()("organization_meta_definitions as md")
      .join("templates as t", "t.id", "md.template_id")
      .where("t.organization_id", orgId)
      .whereNull("t.deleted_at")
      .select(
        "md.field_key",
        "md.label",
        "md.field_type",
        "md.required",
        "md.config"
      );
    const unique = new Map<
      string,
      {
        fieldKey: string;
        label: string;
        fieldType: string;
        required?: boolean;
        config?: Record<string, any>;
      }
    >();
    rows.forEach((row) => {
      const key = row.field_key;
      if (!key || unique.has(key)) return;
      unique.set(key, {
        fieldKey: key,
        label: row.label,
        fieldType: row.field_type,
        required: row.required,
        config: row.config ?? {},
      });
    });
    return Array.from(unique.values());
  }

  async findTemplateById(orgId: string, templateId: string) {
    const template = await this.database
      .getClient()("templates")
      .where({ id: templateId, organization_id: orgId })
      .whereNull("deleted_at")
      .first();
    if (!template) {
      throw new NotFoundException("Template not found");
    }
    const metaDefinitions = await this.database
      .getClient()("organization_meta_definitions")
      .where({ template_id: templateId })
      .orderBy("position", "asc");
    return {
      id: template.id,
      organizationId: template.organization_id ?? template.organizationId,
      name: template.name,
      description: template.description ?? undefined,
      createdAt: template.created_at ?? undefined,
      updatedAt: template.updated_at ?? undefined,
      deletedAt: template.deleted_at ?? undefined,
      metaDefinitions: metaDefinitions.map((definition) => ({
        id: definition.id,
        fieldKey: definition.field_key,
        label: definition.label,
        fieldType: definition.field_type,
        required: definition.required,
        position: definition.position,
        config: definition.config,
      })),
    };
  }

  async createTemplate(
    orgId: string,
    payload: {
      name: string;
      description?: string;
      metaDefinitions?: Array<{
        id?: string;
        fieldKey?: string;
        label: string;
        fieldType: string;
        required?: boolean;
        config?: Record<string, any>;
      }>;
    }
  ) {
    const now = new Date().toISOString();
    const trx = await this.database.getClient().transaction();
    try {
      const created = await trx("templates")
        .insert({
          organization_id: orgId,
          name: payload.name,
          description: payload.description ?? null,
          created_at: now,
          updated_at: now,
        })
        .returning("*");
      const row = created[0];

      if (payload.metaDefinitions) {
        await this.syncTemplateMetaDefinitions(
          trx,
          row.id,
          payload.metaDefinitions
        );
      }

      await trx.commit();
      return {
        id: row.id,
        organizationId: row.organization_id ?? row.organizationId,
        name: row.name,
        description: row.description ?? undefined,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
        deletedAt: row.deleted_at ?? undefined,
      };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  private async syncTemplateMetaDefinitions(
    trx: any,
    templateId: string,
    metaDefinitions: Array<{
      id?: string;
      fieldKey?: string;
      label: string;
      fieldType: string;
      required?: boolean;
      position?: number;
      config?: Record<string, any>;
    }>
  ) {
    const cleaned = metaDefinitions
      .map((definition, index) => ({
        id: definition.id,
        template_id: templateId,
        field_key: definition.fieldKey || `field_${index + 1}`,
        label: definition.label,
        field_type: definition.fieldType,
        required: Boolean(definition.required),
        position: definition.position ?? index,
        config: definition.config ?? {},
      }))
      .filter((definition) => definition.label);
    await trx("organization_meta_definitions")
      .where({ template_id: templateId })
      .del();
    if (cleaned.length > 0) {
      await trx("organization_meta_definitions").insert(cleaned);
    }
  }

  async updateTemplate(
    orgId: string,
    templateId: string,
    payload: {
      name?: string;
      description?: string;
      metaDefinitions?: Array<{
        id?: string;
        fieldKey?: string;
        label: string;
        fieldType: string;
        required?: boolean;
        position?: number;
        config?: Record<string, any>;
      }>;
    }
  ) {
    const trx = await this.database.getClient().transaction();
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (payload.name !== undefined) updates.name = payload.name;
      if (payload.description !== undefined)
        updates.description = payload.description;
      await trx("templates")
        .where({ id: templateId, organization_id: orgId })
        .update(updates);

      if (payload.metaDefinitions) {
        await this.syncTemplateMetaDefinitions(
          trx,
          templateId,
          payload.metaDefinitions
        );
      }
      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
    // TODO: DTO
    return this.findTemplateById(orgId, templateId);
  }

  async deleteTemplate(orgId: string, templateId: string) {
    const updated = await this.database
      .getClient()("templates")
      .where({ id: templateId, organization_id: orgId })
      .update({ deleted_at: new Date().toISOString() })
      .returning("*");
    if (!updated[0]) {
      throw new NotFoundException("Template not found");
    }
    return { deleted: true };
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const updates: any = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) {
      updates.name = dto.name;
    }

    const updated = await this.database
      .getClient()("organizations")
      .where({ id })
      .update(updates)
      .returning("*");
    if (!updated[0]) {
      throw new NotFoundException("Organization not found");
    }
    const row = await this.findById(id);
    return this.toOrganizationDto(row);
  }

  private toOrganizationDto(row: any): OrganizationDto {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      templateCount:
        typeof row.template_count === "number"
          ? row.template_count
          : row.template_count != null
          ? Number(row.template_count)
          : undefined,
      userCount:
        typeof row.user_count === "number"
          ? row.user_count
          : row.user_count != null
          ? Number(row.user_count)
          : undefined,
      canViewAllMeets: row.can_view_all_meets ?? undefined,
    };
  }
}
