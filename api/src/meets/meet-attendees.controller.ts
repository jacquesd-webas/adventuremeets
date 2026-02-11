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
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { AuthService } from "../auth/auth.service";
import { EmailService } from "../email/email.service";
import { renderEmailTemplate } from "../email/email.templates";

@ApiTags("Meet Attendees")
@Controller("meets/:meetId/attendees")
export class MeetAttendeesController {
  constructor(
    private readonly meetsService: MeetsService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  async list(
    @Param("meetId") meetId: string,
    @Query("filter") filter?: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer in this organization",
      );
    }
    return await this.meetsService.listAttendees(meetId, filter);
  }

  @Public()
  @Get("check")
  check(
    @Param("meetId") meetId: string,
    @Query("email") email?: string,
    @Query("phone") phone?: string,
  ) {
    return this.meetsService.findAttendeeByContact(meetId, email, phone);
  }

  @Public()
  @Post()
  async add(
    @Param("meetId") meetId: string,
    @Body() dto: CreateMeetAttendeeDto,
  ) {
    const { attendee } = await this.meetsService.addAttendee(meetId, dto);

    if (dto.email) {
      const meet = await this.meetsService.findOne(meetId);
      if (meet?.shareCode) {
        const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173")
          .replace(/\/+$/, "");
        const statusUrl = `${frontendUrl}/meets/${meet.shareCode}/${attendee.id}`;
        const { subject, text, html } = renderEmailTemplate("meet-signup", {
          meetName: meet.name,
          attendeeName: dto.name ?? undefined,
          startTime: meet.startTime,
          endTime: meet.endTime,
          location: meet.location,
          statusUrl,
          organizerName: meet.organizerName,
          organizerEmail: meet.organizerEmail,
        });
        await this.emailService.sendEmail({
          to: dto.email,
          subject,
          text,
          html,
          attendeeId: attendee.id,
          meetId,
        });
      }
    }

    return { attendee };
  }

  @Public()
  @Post(":attendeeId/verify-email")
  async verifyEmail(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @Body() body: { email: string },
  ) {
    const attendee = await this.meetsService.findAttendeeForEdit(
      meetId,
      attendeeId,
    );
    const attendeeEmail = attendee.attendee.email?.trim().toLowerCase() || "";
    const providedEmail = body.email?.trim().toLowerCase() || "";
    return { valid: Boolean(attendeeEmail && attendeeEmail === providedEmail) };
  }

  @Patch(":attendeeId")
  async update(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @Body() dto: UpdateMeetAttendeeDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer in this organization",
      );
    }
    return this.meetsService.updateAttendee(meetId, attendeeId, dto);
  }

  @Delete(":attendeeId")
  async remove(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer in this organization",
      );
    }
    return this.meetsService.removeAttendee(meetId, attendeeId);
  }
}
