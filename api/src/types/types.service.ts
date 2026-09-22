import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { MeetsService } from "../meets/meets.service";

@Injectable()
export class TypesService {
  constructor(
    private readonly meetsService: MeetsService,
    private readonly database: DatabaseService,
  ) {}

  async listMeetStatuses() {
    const { statuses } = await this.meetsService.listStatuses();
    return statuses;
  }

  async listRoles() {
    const rows = await this.database
      .getClient()("roles")
      .whereIn("name", ["admin", "organizer", "member"])
      .orderBy("id", "asc")
      .select("id", "name");
    return rows;
  }
}
