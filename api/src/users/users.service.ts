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

    if (dto.password?.startsWith("$2a$")) {
      // do nothing, password is already hashed
      // or password is not provided (IDP user)
    } else if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    await this.database.getClient()("users").insert({
      id,
      email: dto.email,
      email_verified: false,
      password_hash: dto.password || null,
      idp_provider: dto.idpProvider || null,
      idp_subject: dto.idpSubject || null,
      created_at: now,
      updated_at: now
    });
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

  async findByEmail(email: string) {
    return this.database.getClient()("users").where({ email }).first();
  }

  async update(id: string, dto: UpdateUserDto) {
    const updates: any = { ...dto, updated_at: new Date().toISOString() };

    if (dto.password) {
      updates.password_hash = await bcrypt.hash(dto.password, 10);
    }
    delete updates.password;

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
    const { password_hash, passwordHash, ...rest } = user;
    return rest;
  }
}
