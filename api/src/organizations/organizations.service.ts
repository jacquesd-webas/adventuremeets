import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { DatabaseService } from "../database/database.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationDto } from "./dto/organization.dto";
import { OrganizationMinimalDto } from "./dto/organization-minimal.dto";
import { CreateInviteLinkDto } from "./dto/create-invite-link.dto";
import { InviteLinkDto } from "./dto/invite-link.dto";
import { EmailService } from "../email/email.service";
import { renderEmailTemplate } from "../email/email.templates";
import { MinioService } from "../storage/minio.service";
import sharp = require("sharp");
import { v4 as uuid } from "uuid";

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly emailService: EmailService,
    private readonly minio: MinioService,
  ) {}

  private static readonly inviteCodeChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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

  private generateInviteCode(length = 12) {
    const bytes = randomBytes(length);
    let value = "";
    for (let i = 0; i < length; i += 1) {
      value +=
        OrganizationsService.inviteCodeChars[
          bytes[i] % OrganizationsService.inviteCodeChars.length
        ];
    }
    return value;
  }

  async findById(id: string) {
    const org = await this.database
      .getClient()("organizations as o")
      .leftJoin(
        "user_organization_memberships as uom",
        "uom.organization_id",
        "o.id",
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

  async findByIdMinimal(id: string) {
    const org = await this.database
      .getClient()("organizations")
      .where("id", id)
      .select("theme", "is_private")
      .first();
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return this.toMinimalOrganizationDto(org);
  }

  async findAllByIds(ids: string[]) {
    const rows = await this.database
      .getClient()("organizations as o")
      .leftJoin(
        "user_organization_memberships as uom",
        "uom.organization_id",
        "o.id",
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

  async findThemeById(id: string) {
    const row = await this.database
      .getClient()("organizations")
      .where({ id })
      .select("theme")
      .first();
    if (!row) {
      throw new NotFoundException("Organization not found");
    }
    return row.theme;
  }

  async findLogoUrlById(id: string) {
    const row = await this.database
      .getClient()("organizations")
      .where({ id })
      .select("logo_url")
      .first();

    if (!row) {
      throw new NotFoundException("Organization not found");
    }

    return row.logo_url ?? undefined;
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
        "uom.updated_at",
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
        "uom.updated_at",
      );

    return rows.map((row) => this.mapMember(row));
  }

  async updateMember(
    orgId: string,
    userId: string,
    payload: { role?: string; status?: string },
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
        "uom.updated_at",
      )
      .first();
    if (!memberRow) {
      throw new NotFoundException("Member not found");
    }
    return this.mapMember(memberRow);
  }

  async createPrivateOrganization(name: string, userId: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException("Organization name is required");
    }

    const now = new Date().toISOString();
    const trx = await this.database.getClient().transaction();

    try {
      const inserted = await trx("organizations")
        .insert({
          name: trimmedName,
          is_private: true,
          created_at: now,
          updated_at: now,
        })
        .returning("id");

      const organizationId = Array.isArray(inserted)
        ? (inserted[0] as any).id
        : (inserted as any).id;

      await trx("user_organization_memberships").insert({
        user_id: userId,
        organization_id: organizationId,
        role: "admin",
        role_id: 2,
        status: "active",
        created_at: now,
        updated_at: now,
      });

      await trx.commit();
      const row = await this.findById(organizationId);
      return this.toOrganizationDto(row);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async leaveOrganization(orgId: string, userId: string) {
    const client = this.database.getClient();
    const membership = await client("user_organization_memberships")
      .where({
        organization_id: orgId,
        user_id: userId,
        status: "active",
      })
      .first();

    if (!membership) {
      throw new NotFoundException("Membership not found");
    }

    const countRow = await client("user_organization_memberships")
      .where({
        user_id: userId,
        status: "active",
      })
      .count<{ count: string }>("organization_id as count")
      .first();
    const activeMembershipCount = Number(countRow?.count ?? 0);

    if (activeMembershipCount <= 1) {
      throw new BadRequestException(
        "You cannot leave your last active organization",
      );
    }

    await client("user_organization_memberships")
      .where({
        organization_id: orgId,
        user_id: userId,
        status: "active",
      })
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      });

    const orgMemberCountRow = await client("user_organization_memberships")
      .where({
        organization_id: orgId,
        status: "active",
      })
      .countDistinct<{ count: string }>("user_id as count")
      .first();
    const orgMemberCount = Number(orgMemberCountRow?.count ?? 0);

    const meetCountRow = await client("meets")
      .where({ organization_id: orgId })
      .count<{ count: string }>("id as count")
      .first();
    const meetCount = Number(meetCountRow?.count ?? 0);

    if (orgMemberCount === 0 && meetCount === 0) {
      await client("organizations").where({ id: orgId }).del();
    }
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
      indemnity: row.indemnity ?? undefined,
      approvedResponse: row.approved_response ?? undefined,
      rejectResponse: row.reject_response ?? undefined,
      waitlistResponse: row.waitlist_response ?? undefined,
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
        "md.config",
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
      indemnity: template.indemnity ?? undefined,
      approvedResponse: template.approved_response ?? undefined,
      rejectResponse: template.reject_response ?? undefined,
      waitlistResponse: template.waitlist_response ?? undefined,
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
      indemnity?: string;
      approvedResponse?: string;
      rejectResponse?: string;
      waitlistResponse?: string;
      metaDefinitions?: Array<{
        id?: string;
        fieldKey?: string;
        label: string;
        fieldType: string;
        required?: boolean;
        config?: Record<string, any>;
      }>;
    },
  ) {
    const now = new Date().toISOString();
    const trx = await this.database.getClient().transaction();
    try {
      const created = await trx("templates")
        .insert({
          organization_id: orgId,
          name: payload.name,
          description: payload.description ?? null,
          indemnity: payload.indemnity ?? null,
          approved_response: payload.approvedResponse ?? null,
          reject_response: payload.rejectResponse ?? null,
          waitlist_response: payload.waitlistResponse ?? null,
          created_at: now,
          updated_at: now,
        })
        .returning("*");
      const row = created[0];

      if (payload.metaDefinitions) {
        await this.syncTemplateMetaDefinitions(
          trx,
          row.id,
          payload.metaDefinitions,
        );
      }

      await trx.commit();
      return {
        id: row.id,
        organizationId: row.organization_id ?? row.organizationId,
        name: row.name,
        description: row.description ?? undefined,
        indemnity: row.indemnity ?? undefined,
        approvedResponse: row.approved_response ?? undefined,
        rejectResponse: row.reject_response ?? undefined,
        waitlistResponse: row.waitlist_response ?? undefined,
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
    }>,
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
      indemnity?: string;
      approvedResponse?: string;
      rejectResponse?: string;
      waitlistResponse?: string;
      metaDefinitions?: Array<{
        id?: string;
        fieldKey?: string;
        label: string;
        fieldType: string;
        required?: boolean;
        position?: number;
        config?: Record<string, any>;
      }>;
    },
  ) {
    const trx = await this.database.getClient().transaction();
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (payload.name !== undefined) updates.name = payload.name;
      if (payload.description !== undefined)
        updates.description = payload.description;
      if (payload.indemnity !== undefined)
        updates.indemnity = payload.indemnity;
      if (payload.approvedResponse !== undefined)
        updates.approved_response = payload.approvedResponse;
      if (payload.rejectResponse !== undefined)
        updates.reject_response = payload.rejectResponse;
      if (payload.waitlistResponse !== undefined)
        updates.waitlist_response = payload.waitlistResponse;
      await trx("templates")
        .where({ id: templateId, organization_id: orgId })
        .update(updates);

      if (payload.metaDefinitions) {
        await this.syncTemplateMetaDefinitions(
          trx,
          templateId,
          payload.metaDefinitions,
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
    if (dto.theme !== undefined) {
      updates.theme = dto.theme;
    }
    if (dto.canViewAllMeets !== undefined) {
      updates.can_view_all_meets = dto.canViewAllMeets;
    }
    if (dto.isPrivate !== undefined) {
      updates.is_private = dto.isPrivate;
    }
    if (dto.customField1Name !== undefined) {
      updates.custom_field1_name = dto.customField1Name.trim() || null;
    }
    if (dto.customField2Name !== undefined) {
      updates.custom_field2_name = dto.customField2Name.trim() || null;
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

  async uploadLogo(id: string, file: any) {
    const organization = await this.database
      .getClient()("organizations")
      .where({ id })
      .select("id", "name", "logo_object_key")
      .first();

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const normalized = await sharp(file.buffer)
      .rotate()
      .resize(512, 512, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    const objectKey = `logos/${id}/${uuid()}.webp`;
    const uploaded = await this.minio.upload(
      objectKey,
      normalized,
      "image/webp",
    );

    if (organization.logo_object_key) {
      await this.minio
        .remove(organization.logo_object_key)
        .catch(() => undefined);
    }

    await this.database.getClient()("organizations").where({ id }).update({
      logo_object_key: uploaded.objectKey,
      logo_url: uploaded.url,
      updated_at: new Date().toISOString(),
    });

    const row = await this.findById(id);
    return this.toOrganizationDto(row);
  }

  async createInviteLink(
    orgId: string,
    payload: CreateInviteLinkDto,
    createdBy: string,
  ): Promise<InviteLinkDto> {
    const client = this.database.getClient();
    const organization = await client("organizations")
      .where({ id: orgId })
      .select("id", "name", "logo_url")
      .first();
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const roleId = payload.roleId ?? 4;
    const role = await client("roles")
      .where({ id: roleId })
      .select("id", "name")
      .first();
    if (!role) {
      throw new BadRequestException("Invalid roleId");
    }

    const now = new Date();
    const expiresAtDate = payload.expiresAt
      ? new Date(payload.expiresAt)
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(expiresAtDate.getTime())) {
      throw new BadRequestException("Invalid expiresAt");
    }
    if (expiresAtDate.getTime() <= now.getTime()) {
      throw new BadRequestException("Invite expiry must be in the future");
    }

    const email = payload.email.trim().toLowerCase();
    const createdAt = now.toISOString();
    const expiresAt = expiresAtDate.toISOString();
    const frontendBase = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const token = this.generateInviteCode(12);
      try {
        const inserted = await client("invite_links")
          .insert({
            org_id: orgId,
            created_at: createdAt,
            expires_at: expiresAt,
            email,
            token,
            role_id: roleId,
            created_by: createdBy,
          })
          .returning("*");
        const row = inserted[0];
        const registerUrl = `${frontendBase}/register?invite=${encodeURIComponent(
          token,
        )}`;
        const emailTemplate = renderEmailTemplate("organization-invite", {
          organizationName: organization.name || "your organization",
          registerUrl,
          expiresAt,
          logoUrl: organization.logo_url ?? undefined,
        });
        try {
          await this.emailService.sendEmail({
            to: email,
            subject: emailTemplate.subject,
            text: emailTemplate.text,
            html: emailTemplate.html,
          });
        } catch (err: any) {
          await client("invite_links").where({ id: row.id }).del();
          this.logger.error(
            `Failed to send organization invite email to ${email}: ${
              err?.message || err
            }`,
          );
          throw new InternalServerErrorException("Unable to send invite email");
        }
        return {
          id: row.id,
          organizationId: row.org_id ?? row.organizationId,
          email: row.email,
          token: row.token,
          roleId: row.role_id ?? row.roleId,
          roleName: role.name,
          createdAt: row.created_at ?? row.createdAt,
          expiresAt: row.expires_at ?? row.expiresAt,
          acceptedAt: row.accepted_at ?? row.acceptedAt ?? null,
          declinedAt: row.declined_at ?? row.declinedAt ?? null,
          createdBy: row.created_by ?? row.createdBy,
          inviteUrl: token,
        };
      } catch (error: any) {
        if (error?.code === "23505") {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException("Unable to generate invite link");
  }

  async acceptInvite(
    inviteId: string,
    userId: string,
    userEmail: string,
  ): Promise<InviteLinkDto> {
    const trx = await this.database.getClient().transaction();
    try {
      const normalizedEmail = userEmail.trim().toLowerCase();
      const now = new Date().toISOString();

      const invite = await trx("invite_links as il")
        .leftJoin("roles as r", "r.id", "il.role_id")
        .where("il.id", inviteId)
        .select("il.*", "r.name as role_name")
        .first();
      if (!invite) {
        throw new NotFoundException("Invite not found");
      }

      if ((invite.email || "").toLowerCase() !== normalizedEmail) {
        throw new BadRequestException("Invite does not belong to this user");
      }

      if (invite.expires_at <= now) {
        throw new BadRequestException("Invite has expired");
      }
      if (invite.declined_at) {
        throw new BadRequestException("Invite has been declined");
      }

      const roleId = invite.role_id ?? 4;
      const roleName = invite.role_name ?? "member";

      const existingMembership = await trx("user_organization_memberships")
        .where({
          user_id: userId,
          organization_id: invite.org_id,
        })
        .first();

      if (!existingMembership) {
        await trx("user_organization_memberships").insert({
          user_id: userId,
          organization_id: invite.org_id,
          role: roleName,
          role_id: roleId,
          status: "active",
          created_at: now,
          updated_at: now,
        });
      } else if (existingMembership.status !== "active") {
        await trx("user_organization_memberships")
          .where({
            user_id: userId,
            organization_id: invite.org_id,
          })
          .update({
            role: roleName,
            role_id: roleId,
            status: "active",
            updated_at: now,
          });
      }

      if (!invite.accepted_at) {
        await trx("invite_links").where({ id: inviteId }).update({
          accepted_at: now,
        });
      }

      const updated = await trx("invite_links as il")
        .leftJoin("roles as r", "r.id", "il.role_id")
        .where("il.id", inviteId)
        .select("il.*", "r.name as role_name")
        .first();
      if (!updated) {
        throw new NotFoundException("Invite not found");
      }

      await trx.commit();
      return {
        id: updated.id,
        organizationId: updated.org_id ?? updated.organizationId,
        email: updated.email,
        token: updated.token,
        roleId: updated.role_id ?? updated.roleId,
        roleName: updated.role_name ?? updated.roleName,
        createdAt: updated.created_at ?? updated.createdAt,
        expiresAt: updated.expires_at ?? updated.expiresAt,
        acceptedAt: updated.accepted_at ?? updated.acceptedAt ?? null,
        declinedAt: updated.declined_at ?? updated.declinedAt ?? null,
        createdBy: updated.created_by ?? updated.createdBy,
        inviteUrl: updated.token,
      };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  async listInviteLinks(orgId: string): Promise<InviteLinkDto[]> {
    const client = this.database.getClient();
    const organization = await client("organizations")
      .where({ id: orgId })
      .select("id")
      .first();
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const now = new Date().toISOString();
    const rows = await client("invite_links as il")
      .leftJoin("roles as r", "r.id", "il.role_id")
      .where("il.org_id", orgId)
      .andWhere("il.expires_at", ">", now)
      .orderBy("il.created_at", "desc")
      .select("il.*", "r.name as role_name");

    return rows.map((row) => ({
      id: row.id,
      organizationId: row.org_id ?? row.organizationId,
      email: row.email,
      token: row.token,
      roleId: row.role_id ?? row.roleId,
      roleName: row.role_name ?? row.roleName,
      createdAt: row.created_at ?? row.createdAt,
      expiresAt: row.expires_at ?? row.expiresAt,
      acceptedAt: row.accepted_at ?? row.acceptedAt ?? null,
      declinedAt: row.declined_at ?? row.declinedAt ?? null,
      createdBy: row.created_by ?? row.createdBy,
      inviteUrl: row.token,
    }));
  }

  async declineInvite(
    inviteId: string,
    userEmail: string,
  ): Promise<InviteLinkDto> {
    const trx = await this.database.getClient().transaction();
    try {
      const normalizedEmail = userEmail.trim().toLowerCase();
      const now = new Date().toISOString();

      const invite = await trx("invite_links as il")
        .leftJoin("roles as r", "r.id", "il.role_id")
        .where("il.id", inviteId)
        .select("il.*", "r.name as role_name")
        .first();
      if (!invite) {
        throw new NotFoundException("Invite not found");
      }

      if ((invite.email || "").toLowerCase() !== normalizedEmail) {
        throw new BadRequestException("Invite does not belong to this user");
      }

      if (invite.accepted_at) {
        throw new BadRequestException("Invite has already been accepted");
      }

      if (!invite.declined_at) {
        await trx("invite_links").where({ id: inviteId }).update({
          declined_at: now,
        });
      }

      const updated = await trx("invite_links as il")
        .leftJoin("roles as r", "r.id", "il.role_id")
        .where("il.id", inviteId)
        .select("il.*", "r.name as role_name")
        .first();
      if (!updated) {
        throw new NotFoundException("Invite not found");
      }

      await trx.commit();
      return {
        id: updated.id,
        organizationId: updated.org_id ?? updated.organizationId,
        email: updated.email,
        token: updated.token,
        roleId: updated.role_id ?? updated.roleId,
        roleName: updated.role_name ?? updated.roleName,
        createdAt: updated.created_at ?? updated.createdAt,
        expiresAt: updated.expires_at ?? updated.expiresAt,
        acceptedAt: updated.accepted_at ?? updated.acceptedAt ?? null,
        declinedAt: updated.declined_at ?? updated.declinedAt ?? null,
        createdBy: updated.created_by ?? updated.createdBy,
        inviteUrl: updated.token,
      };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  async canOrganizationShareMeets(orgId: string) {
    const organization = await this.database
      .getClient()("organizations")
      .where({ id: orgId })
      .select("can_view_all_meets")
      .first();

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return Boolean(organization.can_view_all_meets);
  }

  private toMinimalOrganizationDto(row: any): OrganizationMinimalDto {
    return {
      theme: row.theme ?? undefined,
      isPrivate: row.is_private ?? undefined,
    };
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
      theme: row.theme ?? undefined,
      isPrivate: row.is_private ?? undefined,
      logoUrl: row.logo_url ?? undefined,
      customField1Name: row.custom_field1_name ?? undefined,
      customField2Name: row.custom_field2_name ?? undefined,
    };
  }
}
