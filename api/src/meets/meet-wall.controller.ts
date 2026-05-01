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
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { MeetsService } from "./meets.service";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { AuthService } from "../auth/auth.service";
import { CreateWallItemDto } from "./dto/create-wall-item.dto";
import { OrderWallItemFavouritesDto } from "./dto/order-wall-item-favourites.dto";
import { UpdateWallItemReactionDto } from "./dto/update-wall-item-reaction.dto";
import { UpdateWallItemFavouriteDto } from "./dto/update-wall-item-favourite.dto";

@ApiTags("Meet Wall")
@Controller("meets/:meetId/wall")
export class MeetWallController {
  constructor(
    private readonly meetsService: MeetsService,
    private readonly authService: AuthService,
  ) {}

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

    return this.meetsService.createWallItem(meetId, dto, file, {
      userId: user?.id,
      attendeeId: context.attendee?.id,
    });
  }

  @Get()
  async list(
    @Param("meetId") meetId: string,
    @Query("attendeeId") attendeeId?: string,
    @User() user?: UserProfile,
  ) {
    const context = await this.getWallContext(meetId, user, attendeeId);
    if (!context.isMember && !context.attendee) {
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

    return this.meetsService.orderWallItemFavourites(meetId, dto.wallItemIds);
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

    return this.meetsService.updateWallItemFavourite(
      meetId,
      wallItemId,
      dto.favourite,
    );
  }

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

    return this.meetsService.updateWallItemReaction(
      meetId,
      wallItemId,
      {
        userId: user?.id,
        attendeeId: context.attendee?.id,
      },
      dto.reaction,
    );
  }

  @Delete(":wallItemId")
  async remove(
    @Param("meetId") meetId: string,
    @Param("wallItemId") wallItemId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.getMeetOrThrow(meetId);
    if (!this.hasOrganizationRole(user, meet.organizationId, "admin")) {
      throw new ForbiddenException(
        "You do not have permission to remove wall items for this meet",
      );
    }

    return this.meetsService.removeWallItem(meetId, wallItemId);
  }

  private async getWallContext(
    meetId: string,
    user?: UserProfile,
    attendeeId?: string,
  ) {
    if (!user && !attendeeId) {
      throw new UnauthorizedException();
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
