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
        first_name: dto.firstName || null,
        last_name: dto.lastName || null,
        phone: dto.phone || null,
        ice_phone: dto.icePhone || null,
        ice_name: dto.iceName || null,
        ice_medical_aid: dto.iceMedicalAid || null,
        ice_medical_aid_number: dto.iceMedicalAidNumber || null,
        ice_dob: dto.iceDob || null,
        password_hash: dto.password || null,
        idp_provider: dto.idpProvider || null,
        idp_subject: dto.idpSubject || null,
        idp_profile: dto.idpProfile || null,
        created_at: now,
        updated_at: now,
      });

      let organizationId = dto.organizationId;
      let createdPrivateOrganization = false;
      if (!organizationId) {
        // create a new personal organization for this user
        const orgNameBase =
          dto.firstName || dto.lastName
            ? `${dto.firstName ?? ""} ${dto.lastName ?? ""}`.trim()
            : dto.email?.split("@")[0] || "Member";
        const orgName = `Private Organisation (${orgNameBase})`;
        const createdOrg = await trx("organizations")
          .insert({
            name: orgName,
            is_private: true,
            created_at: now,
            updated_at: now,
          })
          .returning("id");
        const newOrgId = Array.isArray(createdOrg)
          ? (createdOrg[0] as any).id
          : (createdOrg as any).id;
        organizationId = newOrgId;
        createdPrivateOrganization = true;
      }

      await trx("user_organization_memberships").insert({
        user_id: id,
        organization_id: organizationId,
        role: createdPrivateOrganization ? "admin" : "member",
        role_id: createdPrivateOrganization ? 2 : 4,
        status: "active",
        created_at: now,
        updated_at: now,
      });

      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }

    return this.findById(id);
  }

  async findById(id: string) {
    // TODO: join on organization memberships { organizationId, role }
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

  async getEmailVerificationInfo(userId: string) {
    return this.database
      .getClient()("users")
      .where({ id: userId })
      .select(
        "id",
        "email",
        "email_verified_at",
        "email_verification_token",
        "email_verification_expires_at",
        "email_verification_attempts",
        "email_verification_locked_until",
      )
      .first();
  }

  async isOrganizationPrivate(organizationId: string): Promise<boolean | null> {
    const org = await this.database
      .getClient()("organizations")
      .where({ id: organizationId })
      .select("is_private")
      .first();
    if (!org) return null;
    return Boolean(org.is_private);
  }

  async findByPasswordResetToken(tokenHash: string) {
    return this.database
      .getClient()("users")
      .where({ password_reset_token: tokenHash })
      .first();
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: string,
  ) {
    await this.database.getClient()("users").where({ id: userId }).update({
      password_reset_token: tokenHash,
      password_reset_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
  }

  async setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: string,
  ) {
    await this.database.getClient()("users").where({ id: userId }).update({
      email_verification_token: tokenHash,
      email_verification_expires_at: expiresAt,
      email_verification_attempts: 0,
      email_verification_locked_until: null,
      updated_at: new Date().toISOString(),
    });
  }

  async clearEmailVerificationToken(userId: string) {
    await this.database.getClient()("users").where({ id: userId }).update({
      email_verification_token: null,
      email_verification_expires_at: null,
      email_verification_attempts: 0,
      email_verification_locked_until: null,
      updated_at: new Date().toISOString(),
    });
  }

  async incrementEmailVerificationAttempts(userId: string) {
    await this.database
      .getClient()("users")
      .where({ id: userId })
      .update({
        email_verification_attempts: this.database
          .getClient()
          .raw("COALESCE(email_verification_attempts, 0) + 1"),
        updated_at: new Date().toISOString(),
      });
  }

  async lockEmailVerification(userId: string, lockedUntil: string) {
    await this.database.getClient()("users").where({ id: userId }).update({
      email_verification_locked_until: lockedUntil,
      updated_at: new Date().toISOString(),
    });
  }

  async markEmailVerified(userId: string) {
    await this.database.getClient()("users").where({ id: userId }).update({
      email_verified_at: new Date().toISOString(),
      email_verification_token: null,
      email_verification_expires_at: null,
      updated_at: new Date().toISOString(),
    });
  }

  async updatePasswordFromReset(userId: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    await this.database.getClient()("users").where({ id: userId }).update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires_at: null,
      updated_at: new Date().toISOString(),
    });
  }

  async isValidAttendee(attendeeId: string) {
    const row = await this.database
      .getClient()("meet_attendees")
      .where({ id: attendeeId })
      .first();
    return Boolean(row);
  }

  async findByIdp(provider: string, subject: string) {
    return this.database
      .getClient()("users")
      .where({ idp_provider: provider, idp_subject: subject })
      .first();
  }

  async findOrganizationIds(userId: string) {
    const rows = await this.database
      .getClient()("user_organization_memberships")
      .where({ user_id: userId, status: "active" })
      .orderBy("created_at", "asc")
      .select("organization_id");
    return rows.map((row) => row.organization_id);
  }

  async findOrganizationRoles(userId: string) {
    const rows = await this.database
      .getClient()("user_organization_memberships")
      .where({ user_id: userId, status: "active" })
      .orderBy("created_at", "asc")
      .select("organization_id", "role");
    return rows.map((row) => ({
      organizationId: row.organization_id,
      role: row.role,
    }));
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
    if (dto.icePhone !== undefined) {
      updates.ice_phone = dto.icePhone;
    }
    if (dto.iceName !== undefined) {
      updates.ice_name = dto.iceName;
    }
    if (dto.iceMedicalAid !== undefined) {
      updates.ice_medical_aid = dto.iceMedicalAid;
    }
    if (dto.iceMedicalAidNumber !== undefined) {
      updates.ice_medical_aid_number = dto.iceMedicalAidNumber;
    }
    if (dto.iceDob !== undefined) {
      updates.ice_dob = dto.iceDob;
    }
    if (dto.email !== undefined) {
      updates.email = dto.email;
      updates.email_verified_at = null;
      updates.email_verification_token = null;
      updates.email_verification_expires_at = null;
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

    const updated = await this.database
      .getClient()("users")
      .where({ id })
      .update(updates)
      .returning("*");
    const user = updated[0];
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.stripSensitive(user);
  }

  async remove(id: string) {
    const deleted = await this.database
      .getClient()("users")
      .where({ id })
      .del();
    if (!deleted) {
      throw new NotFoundException("User not found");
    }
    return { deleted: true };
  }

  async listUserMetaValues(userId: string, organizationId: string) {
    return this.database
      .getClient()("user_meta_values")
      .where({ user_id: userId, organization_id: organizationId })
      .orderBy("key", "asc")
      .select("key", "value");
  }

  async saveUserMetaValues(
    userId: string,
    organizationId: string,
    values: Array<{ key: string; value?: string | null }>,
  ) {
    const trx = await this.database.getClient().transaction();
    try {
      const keys = values.map((item) => item.key);
      if (keys.length) {
        await trx("user_meta_values")
          .where({ user_id: userId, organization_id: organizationId })
          .whereIn("key", keys)
          .del();
      }
      if (values.length) {
        await trx("user_meta_values").insert(
          values.map((item) => ({
            user_id: userId,
            organization_id: organizationId,
            key: item.key,
            value: item.value ?? null,
          })),
        );
      }
      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
    return this.listUserMetaValues(userId, organizationId);
  }

  async updateLogin(userId: string, options: { isSuccess: boolean }) {
    const updates: any = { updated_at: new Date().toISOString() };
    if (options.isSuccess) {
      updates.last_login_at = new Date().toISOString();
    }
    updates.last_login_attempt_at = new Date().toISOString();

    await this.database
      .getClient()("users")
      .where({ id: userId })
      .update({
        ...updates,
        ...(options.isSuccess
          ? { login_attempts: 0 }
          : {
              login_attempts: this.database
                .getClient()
                .raw("login_attempts + 1"),
            }),
      });
  }

  async linkByEmail(email: string, userId: string) {
    await this.database
      .getClient()("meet_attendees")
      .where({ email })
      .update({ user_id: userId });
  }

  private stripSensitive(row: any) {
    // We only pass some non-sensitive fields back to the user. Sensitive fields like
    // password and medical info are removed and require a separate method to access.
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      lastLogin: row.last_login,
      emailVerified: row.email_verified_at ? true : false,
      emailVerifiedAt: row.email_verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
