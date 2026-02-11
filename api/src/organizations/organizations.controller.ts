import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { OrganizationsService } from "./organizations.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { Public } from "src/auth/decorators/public.decorator";
import { UseGuards } from "@nestjs/common";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";

@ApiTags("Organizations")
@ApiBearerAuth()
@Controller(["organizations", "organisations"])
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async findAll(@User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    const organizationIds = this.authService.getUserOrganizationIds(user);
    if (!organizationIds.length) {
      return [];
    }
    const organizations =
      await this.organizationsService.findAllByIds(organizationIds);
    return { organizations };
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(":id")
  async findOne(@Param("id") id: string, @User() user?: UserProfile) {
    // If we are not logged in we can see no iformation except the theme
    // so that we can render nice background for signups/logins. (and also)
    // know whether the organization if public or not to allow registration)
    if (!user)
      return {
        organization: await this.organizationsService.findByIdMinimal(id),
      };

    if (!this.authService.hasRole(user, id, "member")) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    const organization = await this.organizationsService.findById(id);
    return { organization };
  }

  @Get(":id/members")
  async findMembers(@Param("id") id: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }

    const members = await this.organizationsService.findMembers(id);
    return { members };
  }

  @Patch(":id/members/:userId")
  async updateMember(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() body: UpdateMemberDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }

    const member = await this.organizationsService.updateMember(
      id,
      userId,
      body,
    );
    return { member };
  }

  @Get(":id/organizers")
  async findOrganizers(@Param("id") id: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer for this organization",
      );
    }

    const organizers = await this.organizationsService.findOrganizers(id);
    return { organizers };
  }

  @Get(":id/templates")
  async findTemplates(@Param("id") id: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer for this organization",
      );
    }
    const templates = await this.organizationsService.findTemplates(id);
    return { templates };
  }

  @Get(":id/meta-definitions")
  async listMetaDefinitions(
    @Param("id") id: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "member")) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    const metaDefinitions =
      await this.organizationsService.listMetaDefinitions(id);
    return { metaDefinitions };
  }

  @Get(":id/templates/:templateId")
  async findTemplate(
    @Param("id") id: string,
    @Param("templateId") templateId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }

    const template = await this.organizationsService.findTemplateById(
      id,
      templateId,
    );
    return { template };
  }

  @Post(":id/templates")
  async createTemplate(
    @Param("id") id: string,
    @Body() body: CreateTemplateDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }

    const template = await this.organizationsService.createTemplate(id, body);
    return { template };
  }

  @Patch(":id/templates/:templateId")
  async updateTemplate(
    @Param("id") id: string,
    @Param("templateId") templateId: string,
    @Body() body: UpdateTemplateDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }

    const template = await this.organizationsService.updateTemplate(
      id,
      templateId,
      body,
    );
    return { template };
  }

  @Delete(":id/templates/:templateId")
  async deleteTemplate(
    @Param("id") id: string,
    @Param("templateId") templateId: string,
    @User() user: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }
    return await this.organizationsService.deleteTemplate(id, templateId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }
    const organization = await this.organizationsService.update(id, dto);
    return { organization };
  }
}
