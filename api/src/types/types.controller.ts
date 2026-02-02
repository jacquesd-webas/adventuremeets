import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { MeetsService } from "../meets/meets.service";

@ApiTags("Types")
@Controller("types")
export class TypesController {
  constructor(private readonly meetsService: MeetsService) {}

  @Get("meetStatuses")
  async listMeetStatuses() {
    const { statuses } = await this.meetsService.listStatuses();
    return { meetStatuses: statuses };
  }
}
