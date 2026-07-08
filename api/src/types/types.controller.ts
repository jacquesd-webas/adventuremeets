import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TypesService } from "./types.service";

@ApiTags("Types")
@Controller("types")
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @Get("meetStatuses")
  async listMeetStatuses() {
    const statuses = await this.typesService.listMeetStatuses();
    return { meetStatuses: statuses };
  }

  @Get("roles")
  async listRoles() {
    const roles = await this.typesService.listRoles();
    return { roles };
  }
}
