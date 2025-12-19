import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { v4 as uuid } from "uuid";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async create(dto: CreateUserDto) {
    const id = uuid();
    const now = new Date().toISOString();
    const trx = await this.database.getClient().transaction();

    if (dto.password?.startsWith("$2a$")) {
      // do nothing, password is already hashed
      // or password is not provided (IDP user)
    } else if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    try {
      await trx("users").insert({
        id,
        email: dto.email,
        email_verified: false,
        first_name: dto.firstName || null,
        last_name: dto.lastName || null,
        phone: dto.phone || null,
        password_hash: dto.password || null,
        idp_provider: dto.idpProvider || null,
        idp_subject: dto.idpSubject || null,
        idp_profile: dto.idpProfile || null,
        created_at: now,
        updated_at: now
      });

      let organizationId = dto.organizationId;
      if (!organizationId) { 
        // create a new personal organization for this user
        const orgNameBase = (dto.firstName || dto.lastName)
          ? `${dto.firstName ?? ""} ${dto.lastName ?? ""}`.trim()
          : dto.email?.split("@")[0] || "Member";
        const orgName = `Private Organisation (${orgNameBase})`;
        const createdOrg = await trx("organizations")
          .insert({
            name: orgName,
            created_at: now,
            updated_at: now
          })
          .returning("id");
        const newOrgId = Array.isArray(createdOrg) ? (createdOrg[0] as any).id : (createdOrg as any).id;
        organizationId = newOrgId;
      }

      await trx("user_organization_memberships").insert({
        user_id: id,
        organization_id: organizationId,
        role: "member",
        role_id: 4,
        status: "active",
        created_at: now,
        updated_at: now
      });

      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
    
    return this.findById(id);
  }

  async findById(id: string) {
    const user = await this.database.getClient()("users").where({ id }).first();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.stripSensitive(user);
  }

  async findAll() {
    const rows = await this.database.getClient()("users").select("*");
    return rows.map((row) => this.stripSensitive(row));
  }

  async findAllByOrganizations(organizationIds: string[]) {
    const rows = await this.database
      .getClient()("users as u")
      .join("user_organization_memberships as uom", "uom.user_id", "u.id")
      .whereIn("uom.organization_id", organizationIds)
      .andWhere("uom.status", "active")
      .select("u.*");
    return rows.map((row) => this.stripSensitive(row));
  }

  async findByEmail(email: string) {
    return this.database.getClient()("users").where({ email }).first();
  }

  async findByIdp(provider: string, subject: string) {
    return this.database.getClient()("users").where({ idp_provider: provider, idp_subject: subject }).first();
  }

  async findOrganizationIds(userId: string) {
    const rows = await this.database
      .getClient()("user_organization_memberships")
      .where({ user_id: userId, status: "active" })
      .orderBy("created_at", "asc")
      .select("organization_id");
    return rows.map((row) => row.organization_id);
  }

  async update(id: string, dto: UpdateUserDto) {
    const updates: any = { updated_at: new Date().toISOString() };

    if (dto.password) {
      updates.password_hash = await bcrypt.hash(dto.password, 10);
    }
    delete updates.password;
    if (dto.firstName !== undefined) {
      updates.first_name = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      updates.last_name = dto.lastName;
    }
    if (dto.phone !== undefined) {
      updates.phone = dto.phone;
    }
    if (dto.email !== undefined) {
      updates.email = dto.email;
    }
    if (dto.idpProvider !== undefined) {
      updates.idp_provider = dto.idpProvider;
    }
    if (dto.idpSubject !== undefined) {
      updates.idp_subject = dto.idpSubject;
    }
    if (dto.idpProfile !== undefined) {
      updates.idp_profile = dto.idpProfile;
    }

    const updated = await this.database.getClient()("users").where({ id }).update(updates).returning("*");
    const user = updated[0];
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.stripSensitive(user);
  }

  async remove(id: string) {
    const deleted = await this.database.getClient()("users").where({ id }).del();
    if (!deleted) {
      throw new NotFoundException("User not found");
    }
    return { deleted: true };
  }

  private stripSensitive(user: any) {
    // omit password_hash for API responses
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, passwordHash, first_name, last_name, ...rest } = user;
    return {
      ...rest,
      firstName: first_name ?? rest.firstName,
      lastName: last_name ?? rest.lastName
    };
  }
}
