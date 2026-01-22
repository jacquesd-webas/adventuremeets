import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Delete } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { OrganizationsService } from "./organizations.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

@ApiTags("Organizations")
@ApiBearerAuth()
@Controller(["organizations", "organisations"])
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  private assertMembership(user: UserProfile & { organizationIds?: string[] | null } | undefined, orgId: string) {
    if (!user?.organizationIds || !user.organizationIds.includes(orgId)) {
      throw new ForbiddenException("Not part of this organization");
    }
  }

  @Get()
  async findAll(@User() user: UserProfile & { organizationIds?: string[] | null }) {
    if (!user?.organizationIds) {
      throw new ForbiddenException("No organization IDs found for user");
    }
    const organizations = await this.organizationsService.findAllByIds(
      user.organizationIds || []
    );
    return { organizations };
  }

  @Get(":id")
  async findOne(@User() user: UserProfile & { organizationIds?: string[] | null }, @Param("id") id: string) {
    this.assertMembership(user, id);
    const organization = await this.organizationsService.findById(id);
    return { organization };
  }

  @Get(":id/members")
  async findMembers(@User() user: UserProfile & { organizationIds?: string[] | null }, @Param("id") id: string) {
    this.assertMembership(user, id);
    const members = await this.organizationsService.findMembers(id);
    return { members };
  }

  @Get(":id/templates")
  async findTemplates(@User() user: UserProfile & { organizationIds?: string[] | null }, @Param("id") id: string) {
    this.assertMembership(user, id);
    const templates = await this.organizationsService.findTemplates(id);
    return { templates };
  }

  @Get(":id/templates/:templateId")
  async findTemplate(
    @User() user: UserProfile & { organizationIds?: string[] | null },
    @Param("id") id: string,
    @Param("templateId") templateId: string
  ) {
    this.assertMembership(user, id);
    const template = await this.organizationsService.findTemplateById(
      id,
      templateId
    );
    return { template };
  }

  @Post(":id/templates")
  async createTemplate(
    @User() user: UserProfile & { organizationIds?: string[] | null },
    @Param("id") id: string,
    @Body() body: CreateTemplateDto
  ) {
    this.assertMembership(user, id);
    const template = await this.organizationsService.createTemplate(id, body);
    return { template };
  }

  @Patch(":id/templates/:templateId")
  async updateTemplate(
    @User() user: UserProfile & { organizationIds?: string[] | null },
    @Param("id") id: string,
    @Param("templateId") templateId: string,
    @Body() body: UpdateTemplateDto
  ) {
    this.assertMembership(user, id);
    const template = await this.organizationsService.updateTemplate(
      id,
      templateId,
      body
    );
    return { template };
  }

  @Delete(":id/templates/:templateId")
  async deleteTemplate(
    @User() user: UserProfile & { organizationIds?: string[] | null },
    @Param("id") id: string,
    @Param("templateId") templateId: string
  ) {
    this.assertMembership(user, id);
    return this.organizationsService.deleteTemplate(id, templateId);
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
