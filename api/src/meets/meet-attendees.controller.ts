import {
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
  Req,
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
import {
  EmailTemplateName,
  renderEmailTemplate,
} from "../email/email.templates";
import type { Request } from "express";

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
    return this.meetsService.findAttendeeByContact(meetId, email, phone, {
      includePreloaded: false,
    });
  }

  @Public()
  @Post()
  async add(
    @Param("meetId") meetId: string,
    @Body() dto: CreateMeetAttendeeDto,
    @Req() req: Request,
  ) {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0]?.trim();

    const meet = await this.meetsService.findOne(meetId);
    if (!meet) {
      throw new NotFoundException("Meet not found");
    }

    let { attendee } = await this.meetsService.addAttendee(meetId, dto, {
      ip: forwardedIp || req.ip,
      userAgent: req.headers["user-agent"] as string | undefined,
      locale: req.headers["accept-language"] as string | undefined,
    });

    if (meet.autoPlacement && attendee.status === "pending") {
      const result = await this.meetsService.autoPlaceAttendees(
        meetId,
        attendee.id,
      );
      attendee = result.attendee;
    }

    if (dto.email) {
      const frontendUrl = (
        process.env.FRONTEND_URL || "http://localhost:5173"
      ).replace(/\/+$/, "");

      const statusUrl = meet?.shareCode
        ? `${frontendUrl}/meets/${meet.shareCode}/${attendee.id}`
        : "";

      const attendeeName = dto.name ?? undefined;
      const status = attendee.status;

      // Messages could be custom if they are empty they will be filled with default values
      const messageBody =
        status === "confirmed"
          ? meet.confirmMessage
          : status === "waitlisted"
            ? meet.waitlistMessage
            : status === "rejected"
              ? meet.rejectMessage
              : undefined;

      const emailTemplate: EmailTemplateName =
        status === "confirmed"
          ? "meet-confirm"
          : status === "waitlisted"
            ? "meet-waitlist"
            : status === "rejected"
              ? "meet-reject"
              : "meet-signup";

      // The "meet-singup" template uses a different overload, the others all use the same
      if (emailTemplate !== "meet-signup") {
        const { subject, text, html } = renderEmailTemplate(emailTemplate, {
          meetName: meet.name,
          attendeeName,
          startTime: meet.startTime,
          endTime: meet.endTime,
          timeZone: meet.timeZone,
          location: meet.location,
          statusUrl,
          organizerName: meet.organizerName,
          organizerEmail: meet.organizerEmail,
          messageBody: messageBody,
        });
        await this.emailService.sendEmail({
          to: dto.email,
          subject,
          text,
          html,
          attendeeId: attendee.id,
          meetId,
        });
        await this.meetsService.updateAttendeesNotified(meetId, [attendee.id]);
      } else {
        const { subject, text, html } = renderEmailTemplate("meet-signup", {
          meetName: meet.name,
          attendeeName,
          startTime: meet.startTime,
          endTime: meet.endTime,
          timeZone: meet.timeZone,
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
        await this.meetsService.updateAttendeesNotified(meetId, [attendee.id]);
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
