import { Body, Controller, ForbiddenException, Get, Param, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { OrganizationsService } from "./organizations.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

@ApiTags("Organizations")
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  private assertMembership(user: UserProfile & { organizationIds?: string[] | null } | undefined, orgId: string) {
    if (!user?.organizationIds || !user.organizationIds.includes(orgId)) {
      throw new ForbiddenException("Not part of this organization");
    }
  }

  @Get(":id")
  async findOne(@User() user: UserProfile & { organizationIds?: string[] | null }, @Param("id") id: string) {
    this.assertMembership(user, id);
    const organization = await this.organizationsService.findById(id);
    return { organization };
  }

  @Patch(":id")
  async update(
    @User() user: UserProfile & { organizationIds?: string[] | null },
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationDto
  ) {
    this.assertMembership(user, id);
    const organization = await this.organizationsService.update(id, dto);
    return { organization };
  }
}
