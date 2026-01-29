import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { MeetsService } from "./meets.service";
import { CreateMeetAttendeeDto } from "./dto/create-meet-attendee.dto";
import { Public } from "../auth/decorators/public.decorator";
import { UpdateMeetAttendeeDto } from "./dto/update-meet-attendee.dto";
import { User } from "src/auth/decorators/user.decorator";
import { UserProfile } from "src/users/dto/user-profile.dto";
import { AuthService } from "src/auth/auth.service";

@ApiTags("Meet Attendees")
@Controller("meets/:meetId/attendees")
export class MeetAttendeesController {
  constructor(
    private readonly meetsService: MeetsService,
    private readonly authService: AuthService
  ) {}

  @Get()
  async list(
    @Param("meetId") meetId: string,
    @Query("filter") filter?: string,
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer in this organization"
      );
    }
    return await this.meetsService.listAttendees(meetId, filter);
  }

  @Public()
  @Get("check")
  check(
    @Param("meetId") meetId: string,
    @Query("email") email?: string,
    @Query("phone") phone?: string
  ) {
    return this.meetsService.findAttendeeByContact(meetId, email, phone);
  }

  @Public()
  @Post()
  add(@Param("meetId") meetId: string, @Body() dto: CreateMeetAttendeeDto) {
    return this.meetsService.addAttendee(meetId, dto);
  }

  @Patch(":attendeeId")
  async update(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @Body() dto: UpdateMeetAttendeeDto,
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer in this organization"
      );
    }
    return this.meetsService.updateAttendee(meetId, attendeeId, dto);
  }

  @Delete(":attendeeId")
  async remove(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer in this organization"
      );
    }
    return this.meetsService.removeAttendee(meetId, attendeeId);
  }
}
