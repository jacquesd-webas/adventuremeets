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
import { CreateInviteLinkDto } from "./dto/create-invite-link.dto";
import { InviteLinkDto } from "./dto/invite-link.dto";
import { Public } from "../auth/decorators/public.decorator";
import { UseGuards } from "@nestjs/common";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { DatabaseService } from "../database/database.service";

@ApiTags("Organizations")
@ApiBearerAuth()
@Controller(["organizations", "organisations"])
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly authService: AuthService,
    private readonly db: DatabaseService,
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
      await this.removeEmptyPrivateOrganizationsForUser(
        user.id,
        invite.organizationId,
      );
    } catch (err: any) {
      this.logger.warn(
        `Accepted invite ${inviteId} for user ${user.id}, but private org cleanup failed: ${err?.message || err}`,
      );
    }

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
    return { invite };
  }

  private async removeEmptyPrivateOrganizationsForUser(
    userId: string,
    keepOrganizationId?: string,
  ) {
    const client = this.db.getClient();
    const orgRows = await client("organizations as o")
      .join("user_organization_memberships as uom", "uom.organization_id", "o.id")
      .where("uom.user_id", userId)
      .andWhere("uom.status", "active")
      .andWhere("o.is_private", true)
      .modify((queryBuilder) => {
        if (keepOrganizationId) {
          queryBuilder.andWhere("o.id", "!=", keepOrganizationId);
        }
      })
      .distinct("o.id");

    for (const org of orgRows) {
      const countRow = await client("user_organization_memberships")
        .where({ organization_id: org.id })
        .countDistinct<{ count: string }>("user_id as count")
        .first();
      const memberCount = Number(countRow?.count ?? 0);
      if (memberCount !== 1) {
        continue;
      }

      const meetCountRow = await client("meets")
        .where({ organization_id: org.id })
        .count<{ count: string }>("id as count")
        .first();
      const meetCount = Number(meetCountRow?.count ?? 0);
      if (meetCount === 0) {
        await client("organizations")
          .where({ id: org.id })
          .andWhere("is_private", true)
          .del();
      }
    }
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
    return { invite };
  }
}
