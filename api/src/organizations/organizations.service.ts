import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: string) {
    const org = await this.database.getClient()("organizations").where({ id }).first();
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const updates: any = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) {
      updates.name = dto.name;
    }

    const updated = await this.database.getClient()("organizations").where({ id }).update(updates).returning("*");
    const org = updated[0];
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return org;
  }
}
