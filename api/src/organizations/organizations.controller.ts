import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Delete,
  UnauthorizedException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { CreateInviteLinkDto } from "./dto/create-invite-link.dto";
import { InviteLinkDto } from "./dto/invite-link.dto";
import { Public } from "../auth/decorators/public.decorator";
import { UseGuards } from "@nestjs/common";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { AuditLogService } from "../audit/audit-log.service";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("Organizations")
@ApiBearerAuth()
@Controller(["organizations", "organisations"])
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
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

  @Post()
  async create(
    @Body() body: CreateOrganizationDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const organization =
      await this.organizationsService.createPrivateOrganization(
        body.name,
        user.id,
      );
    await this.auditLogService.addRecord({
      orgId: organization.id,
      userId: user.id,
      action: "created",
      target: `organization ${organization.name || "organization"}`,
    });
    return { organization };
  }

  @Post(":id/leave")
  async leave(@Param("id") id: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    await this.organizationsService.leaveOrganization(id, user.id);
    await this.auditLogService.addRecord({
      orgId: id,
      userId: user.id,
      action: "left",
      target: "organization",
    });
    return { success: true };
  }

  @Post("invites/:inviteId/accept")
  async acceptInvite(
    @Param("inviteId") inviteId: string,
    @User() user?: UserProfile,
  ): Promise<{ invite: InviteLinkDto }> {
    if (!user) throw new UnauthorizedException();

    const invite = await this.organizationsService.acceptInvite(
      inviteId,
      user.id,
      user.email,
    );

    try {
      await this.organizationsService.removeEmptyPrivateOrganizationsForUser(
        user.id,
        invite.organizationId,
      );
    } catch (err: any) {
      this.logger.warn(
        `Accepted invite ${inviteId} for user ${user.id}, but private org cleanup failed: ${err?.message || err}`,
      );
    }

    await this.auditLogService.addRecord({
      orgId: invite.organizationId,
      userId: user.id,
      action: "accepted",
      target: "organization invite",
    });

    return { invite };
  }

  @Post("invites/:inviteId/decline")
  async declineInvite(
    @Param("inviteId") inviteId: string,
    @User() user?: UserProfile,
  ): Promise<{ invite: InviteLinkDto }> {
    if (!user) throw new UnauthorizedException();

    const invite = await this.organizationsService.declineInvite(
      inviteId,
      user.email,
    );
    await this.auditLogService.addRecord({
      orgId: invite.organizationId,
      userId: user.id,
      action: "declined",
      target: "organization invite",
    });
    return { invite };
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
    await this.auditLogService.addRecord({
      orgId: id,
      userId: user.id,
      action: "updated",
      target: "organization member",
    });
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

    if (!this.authService.hasRole(user, id, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer for this organization",
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
    await this.auditLogService.addRecord({
      orgId: id,
      userId: user.id,
      action: "created",
      target: `organization template ${template.name || "template"}`,
    });
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
    await this.auditLogService.addRecord({
      orgId: id,
      userId: user.id,
      action: "updated",
      target: `organization template ${template.name || "template"}`,
    });
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
    const result = await this.organizationsService.deleteTemplate(
      id,
      templateId,
    );
    await this.auditLogService.addRecord({
      orgId: id,
      userId: user.id,
      action: "deleted",
      target: "organization template",
    });
    return result;
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
    await this.auditLogService.addRecord({
      orgId: id,
      userId: user.id,
      action: "updated",
      target: `organization ${organization.name || "organization"}`,
    });
    return { organization };
  }

  @Post(":id/logo")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadLogo(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }
    if (!file) {
      throw new BadRequestException("Organisation logo image file is required");
    }
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Only image uploads are allowed");
    }

    const organization = await this.organizationsService.uploadLogo(id, file);
    await this.auditLogService.addRecord({
      orgId: id,
      userId: user.id,
      action: "updated",
      target: "organization logo",
    });
    return { organization };
  }

  @Get(":id/invites")
  async listInvites(
    @Param("id") id: string,
    @User() user?: UserProfile,
  ): Promise<{ invites: InviteLinkDto[] }> {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }

    const invites = await this.organizationsService.listInviteLinks(id);
    return { invites };
  }

  @Post(":id/invites")
  async invite(
    @Param("id") id: string,
    @Body() body: CreateInviteLinkDto,
    @User() user?: UserProfile,
  ): Promise<{ invite: InviteLinkDto }> {
    if (!user) throw new UnauthorizedException();

    if (!this.authService.hasRole(user, id, "admin")) {
      throw new ForbiddenException(
        "You are not an administrator for this organization",
      );
    }

    const invite = await this.organizationsService.createInviteLink(
      id,
      body,
      user.id,
    );
    await this.auditLogService.addRecord({
      orgId: id,
      userId: user.id,
      action: "created",
      target: "organization invite",
    });
    return { invite };
  }
}
