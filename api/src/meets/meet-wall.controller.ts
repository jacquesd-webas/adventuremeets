import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { MeetsService } from "./meets.service";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { AuthService } from "../auth/auth.service";
import { Public } from "../auth/decorators/public.decorator";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CreateWallItemDto } from "./dto/create-wall-item.dto";
import { UpdateWallItemCommentDto } from "./dto/update-wall-item-comment.dto";
import { OrderWallItemFavouritesDto } from "./dto/order-wall-item-favourites.dto";
import { UpdateWallItemReactionDto } from "./dto/update-wall-item-reaction.dto";
import { UpdateWallItemFavouriteDto } from "./dto/update-wall-item-favourite.dto";
import { AuditLogService } from "../audit/audit-log.service";

@ApiTags("Meet Wall")
@Controller("meets/:meetId/wall")
export class MeetWallController {
  constructor(
    private readonly meetsService: MeetsService,
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @Param("meetId") meetId: string,
    @Body() dto: CreateWallItemDto,
    @UploadedFile() file: any,
    @User() user?: UserProfile,
  ) {
    const context = await this.getWallContext(meetId, user, dto.attendeeId);
    if (!context.isMember && !context.attendee) {
      throw new ForbiddenException(
        "You do not have permission to post to the wall for this meet",
      );
    }
    if (file && !file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Only image uploads are allowed");
    }

    const result = await this.meetsService.createWallItem(meetId, dto, file, {
      userId: user?.id,
      attendeeId: context.attendee?.id,
    });
    await this.auditLogService.addRecord({
      orgId: context.meet.organizationId ?? "",
      userId: user?.id,
      attendeeId: context.attendee?.id,
      meetId: context.meet.id,
      action: file ? "posted photo to" : "posted to",
      target: `meet wall for ${context.meet.name || "meet"}`,
    });
    return result;
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(
    @Param("meetId") meetId: string,
    @Query("attendeeId") attendeeId?: string,
    @User() user?: UserProfile,
  ) {
    const context = await this.getWallContext(meetId, user, attendeeId);
    if (!context.isMember && !context.attendee) {
      if (!user) {
        throw new NotFoundException("Meet attendee not found");
      }
      throw new ForbiddenException(
        "You do not have permission to view the wall for this meet",
      );
    }

    return this.meetsService.listWallItems(meetId, {
      userId: user?.id,
      attendeeId: context.attendee?.id,
    });
  }

  @Patch("favourites/order")
  async orderFavourites(
    @Param("meetId") meetId: string,
    @Body() dto: OrderWallItemFavouritesDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.getMeetOrThrow(meetId);
    if (!this.canManageFavourites(user, meet)) {
      throw new ForbiddenException(
        "You do not have permission to favourite wall items for this meet",
      );
    }

    const result = await this.meetsService.orderWallItemFavourites(
      meetId,
      dto.wallItemIds,
    );
    await this.auditLogService.addRecord({
      orgId: meet.organizationId ?? "",
      userId: user.id,
      meetId: meet.id,
      action: "reordered favourites for",
      target: `meet wall for ${meet.name || "meet"}`,
    });
    return result;
  }

  @Patch(":wallItemId/favourite")
  async updateFavourite(
    @Param("meetId") meetId: string,
    @Param("wallItemId") wallItemId: string,
    @Body() dto: UpdateWallItemFavouriteDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.getMeetOrThrow(meetId);
    if (!this.canManageFavourites(user, meet)) {
      throw new ForbiddenException(
        "You do not have permission to favourite wall items for this meet",
      );
    }

    const result = await this.meetsService.updateWallItemFavourite(
      meetId,
      wallItemId,
      dto.favourite,
    );
    await this.auditLogService.addRecord({
      orgId: meet.organizationId ?? "",
      userId: user.id,
      meetId: meet.id,
      action: "updated favourite for",
      target: `meet wall for ${meet.name || "meet"}`,
    });
    return result;
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch(":wallItemId")
  async update(
    @Param("meetId") meetId: string,
    @Param("wallItemId") wallItemId: string,
    @Body() dto: UpdateWallItemCommentDto,
    @User() user?: UserProfile,
  ) {
    const context = await this.getWallContext(meetId, user, dto.attendeeId);

    const result = await this.meetsService.updateWallItemComment(
      meetId,
      wallItemId,
      dto.comment,
      {
        userId: user?.id,
        attendeeId: context.attendee?.id,
      },
    );
    await this.auditLogService.addRecord({
      orgId: context.meet.organizationId ?? "",
      userId: user?.id,
      attendeeId: context.attendee?.id,
      meetId: context.meet.id,
      action: "edited",
      target: `meet wall for ${context.meet.name || "meet"}`,
    });
    return result;
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch(":wallItemId/reaction")
  async updateReaction(
    @Param("meetId") meetId: string,
    @Param("wallItemId") wallItemId: string,
    @Body() dto: UpdateWallItemReactionDto,
    @User() user?: UserProfile,
  ) {
    const context = await this.getWallContext(meetId, user, dto.attendeeId);
    if (!context.isMember && !context.attendee) {
      throw new ForbiddenException(
        "You do not have permission to react to wall items for this meet",
      );
    }

    const result = await this.meetsService.updateWallItemReaction(
      meetId,
      wallItemId,
      {
        userId: user?.id,
        attendeeId: context.attendee?.id,
      },
      dto.reaction,
    );
    await this.auditLogService.addRecord({
      orgId: context.meet.organizationId ?? "",
      userId: user?.id,
      attendeeId: context.attendee?.id,
      meetId: context.meet.id,
      action: "reacted to",
      target: `meet wall for ${context.meet.name || "meet"}`,
    });
    return result;
  }

  @Delete(":wallItemId")
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  async remove(
    @Param("meetId") meetId: string,
    @Param("wallItemId") wallItemId: string,
    @Query("attendeeId") attendeeId: string | undefined,
    @User() user?: UserProfile,
  ) {
    const context = await this.getWallContext(meetId, user, attendeeId);

    const result = await this.meetsService.removeWallItem(meetId, wallItemId, {
      userId: user?.id,
      attendeeId: context.attendee?.id,
      canAdminDelete: user
        ? this.hasOrganizationRole(user, context.meet.organizationId, "admin")
        : false,
    });
    await this.auditLogService.addRecord({
      orgId: context.meet.organizationId ?? "",
      userId: user?.id,
      attendeeId: context.attendee?.id,
      meetId: context.meet.id,
      action: "deleted",
      target: `meet wall for ${context.meet.name || "meet"}`,
    });
    return result;
  }

  private async getWallContext(
    meetId: string,
    user?: UserProfile,
    attendeeId?: string,
  ) {
    if (!user && !attendeeId) {
      throw new NotFoundException("Meet attendee not found");
    }
    const meet = await this.getMeetOrThrow(meetId);

    const attendee = user
      ? await this.meetsService.findMeetAttendeeByUser(meetId, user.id)
      : attendeeId
        ? await this.meetsService.findMeetAttendeeById(meetId, attendeeId)
        : null;
    return {
      meet,
      attendee,
      isMember: user
        ? this.hasOrganizationRole(user, meet.organizationId, "member")
        : false,
    };
  }

  private async getMeetOrThrow(meetId: string) {
    const meet = await this.meetsService.findOne(meetId);
    if (!meet) {
      throw new NotFoundException("Meet not found");
    }
    return meet;
  }

  private hasOrganizationRole(
    user: UserProfile,
    organizationId: string | undefined,
    role: "member" | "organizer" | "admin",
  ) {
    return organizationId
      ? this.authService.hasRole(user, organizationId, role)
      : false;
  }

  private canManageFavourites(
    user: UserProfile,
    meet: { organizationId?: string; organizerId?: string },
  ) {
    return (
      this.hasOrganizationRole(user, meet.organizationId, "admin") ||
      user.id === meet.organizerId
    );
  }
}
