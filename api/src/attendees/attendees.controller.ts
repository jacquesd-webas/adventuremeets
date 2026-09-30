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
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { MeetsService } from "../meets/meets.service";
import { CreateMeetAttendeeDto } from "./dto/create-meet-attendee.dto";
import { Public } from "../auth/decorators/public.decorator";
import { UpdateMeetAttendeeDto } from "./dto/update-meet-attendee.dto";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { AuthService } from "../auth/auth.service";
import { EmailService } from "../email/email.service";
import { renderEmailTemplate } from "../email/email.templates";
import { EmailTemplateName } from "../email/email.types";
import type { Request } from "express";
import { UsersService } from "../users/users.service";
import { AuditLogService } from "../audit/audit-log.service";
import { OrganizationsService } from "../organizations/organizations.service";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { ConfirmIndemnityDto } from "./dto/confirm-indemnity.dto";

@ApiTags("Attendees")
@Controller("meets/:meetId/attendees")
export class AttendeesController {
  constructor(
    private readonly meetsService: MeetsService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly auditLogService: AuditLogService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  private async sendIndemnityConfirmationEmail(
    meet: {
      id: string;
      name: string;
      shareCode?: string;
      organizationId?: string;
    },
    attendee: { id: string; email: string; name?: string },
    logoUrl?: string,
  ) {
    const resolvedLogoUrl =
      logoUrl ??
      (meet.organizationId
        ? await this.organizationsService.findLogoUrlById(meet.organizationId)
        : undefined);
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");
    const token = this.meetsService.createIndemnityConfirmationToken(
      meet.id,
      attendee.id,
      attendee.email,
    );
    const confirmationUrl = `${frontendUrl}/meets/${meet.shareCode || meet.id}/${attendee.id}/confirm-indemnity?token=${encodeURIComponent(token)}`;
    const confirmationEmail = renderEmailTemplate("indemnity-confirmation", {
      meetName: meet.name,
      attendeeName: attendee.name,
      confirmationUrl,
      logoUrl: resolvedLogoUrl,
    });
    const messageId = await this.emailService.saveMessage({
      to: attendee.email,
      ...confirmationEmail,
      attendeeId: attendee.id,
      meetId: meet.id,
    });
    await this.emailService.sendEmail({
      to: attendee.email,
      ...confirmationEmail,
      attendeeId: attendee.id,
      meetId: meet.id,
      templateName: "indemnity-confirmation",
      messageReferences: messageId
        ? [{ messageId, recipient: attendee.email }]
        : [],
    });
  }

  @Get()
  async list(
    @Param("meetId") meetId: string,
    @Query("filter") filter?: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);
    this.assertCanAccessMeetAttendees(user, meet);
    return await this.meetsService.listAttendees(meetId, filter);
  }

  @Public()
  @Get("check")
  check(
    @Param("meetId") meetId: string,
    @Query("name") name?: string,
    @Query("email") email?: string,
    @Query("phone") phone?: string,
  ) {
    return this.meetsService.findAttendeeByContact(meetId, email, phone, name, {
      includeInvited: false,
    });
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async add(
    @Param("meetId") meetId: string,
    @Body() dto: CreateMeetAttendeeDto,
    @Req() req: Request,
    @User() user?: UserProfile,
  ) {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0]?.trim();

    const meet = await this.meetsService.findOne(meetId);
    if (!meet) {
      throw new NotFoundException("Meet not found");
    }

    let { attendee } = await this.meetsService.addAttendee(
      meetId,
      user ? { ...dto, userId: user.id } : dto,
      {
        ip: forwardedIp || req.ip,
        userAgent: req.headers["user-agent"] as string | undefined,
        locale: req.headers["accept-language"] as string | undefined,
        ...(user ? { indemnityIdentityConfirmed: true } : {}),
      },
    );

    if (meet.autoPlacement && attendee.status === "pending") {
      const result = await this.meetsService.autoPlaceAttendees(
        meetId,
        attendee.id,
      );
      attendee = result.attendee;
    }

    if (dto.email) {
      const logoUrl = meet.organizationId
        ? await this.organizationsService.findLogoUrlById(meet.organizationId)
        : undefined;
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

      // Prepare the email content (meet-signup uses a different overload)
      const { subject, text, html } =
        emailTemplate !== "meet-signup"
          ? renderEmailTemplate(emailTemplate, {
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
              logoUrl,
              isRsvpMode: meet.autoPlacement,
            })
          : renderEmailTemplate("meet-signup", {
              meetName: meet.name,
              attendeeName,
              startTime: meet.startTime,
              endTime: meet.endTime,
              timeZone: meet.timeZone,
              location: meet.location,
              statusUrl,
              organizerName: meet.organizerName,
              organizerEmail: meet.organizerEmail,
              logoUrl,
              isRsvpMode: meet.autoPlacement,
            });

      const messageId = await this.emailService.saveMessage({
        to: dto.email,
        subject,
        text,
        html,
        attendeeId: attendee.id,
        meetId,
      });
      await this.emailService.sendEmail({
        to: dto.email,
        subject,
        text,
        html,
        attendeeId: attendee.id,
        meetId,
        messageReferences: messageId
          ? [{ messageId, recipient: dto.email }]
          : [],
      });

      if (
        meet.needIndemnityConfirmationEmail &&
        dto.indemnityAccepted &&
        !user
      ) {
        await this.sendIndemnityConfirmationEmail(
          meet,
          { id: attendee.id, email: dto.email, name: attendeeName },
          logoUrl,
        );
      }

      // A plain signup acknowledgement is not an organizer response.
      // Only auto-confirmed signups should be marked as responded/notified here.
      if (attendee.status === "confirmed" || attendee.status === "waitlisted") {
        await this.meetsService.updateAttendeesNotified(meetId, [attendee.id]);
      }
    }
    await this.auditLogService.addRecord({
      orgId: meet.organizationId ?? "",
      attendeeId: attendee.id,
      meetId: meet.id,
      action: "signed up for",
      target: `meet ${meet.name || "meet"}`,
    });
    return { attendee };
  }

  @Public()
  @Post(":attendeeId/confirm-indemnity")
  async confirmIndemnity(
    @Param("meetId") meetIdOrCode: string,
    @Param("attendeeId") attendeeId: string,
    @Body() dto: ConfirmIndemnityDto,
    @Req() req: Request,
  ) {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0]?.trim();
    const meet = await this.meetsService.findOne(meetIdOrCode);
    if (!meet) {
      throw new NotFoundException("Meet not found");
    }
    return this.meetsService.confirmIndemnityAcceptance(
      meet.id,
      attendeeId,
      dto.token,
      {
        ip: forwardedIp || req.ip,
        userAgent: req.headers["user-agent"] as string | undefined,
        locale: req.headers["accept-language"] as string | undefined,
      },
    );
  }

  @Post(":attendeeId/resend-indemnity")
  async resendIndemnityConfirmation(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);
    this.assertCanAccessMeetAttendees(user, meet);
    if (!meet.needIndemnityConfirmationEmail) {
      throw new BadRequestException(
        "This meet does not require email confirmation of indemnity",
      );
    }
    const { attendee } = await this.meetsService.findAttendeeForEdit(
      meet.id,
      attendeeId,
    );
    if (attendee.indemnityAccepted) {
      throw new BadRequestException("Indemnity has already been accepted");
    }
    if (!attendee.email) {
      throw new BadRequestException("Attendee does not have an email address");
    }
    const hasPendingAcceptance =
      await this.meetsService.hasPendingIndemnityAcceptance(
        meet.id,
        attendeeId,
      );
    if (!hasPendingAcceptance) {
      throw new BadRequestException(
        "Attendee has not submitted indemnity acceptance for confirmation",
      );
    }

    await this.sendIndemnityConfirmationEmail(meet, {
      id: attendee.id,
      email: attendee.email,
      name: attendee.name,
    });
    await this.auditLogService.addRecord({
      orgId: meet.organizationId ?? "",
      userId: user.id,
      attendeeId,
      meetId: meet.id,
      action: "resent indemnity confirmation for",
      target: `meet ${meet.name || "meet"}`,
    });
    return { sent: true };
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
    this.assertCanAccessMeetAttendees(user, meet);

    const attendee = await this.meetsService.updateAttendee(
      meetId,
      attendeeId,
      dto,
    );
    await this.auditLogService.addRecord({
      orgId: meet.organizationId ?? "",
      userId: user.id,
      attendeeId,
      meetId: meet.id,
      action: "updated attendee for",
      target: `meet ${meet.name || "meet"}`,
    });

    return attendee;
  }

  @Get(":attendeeId/ice")
  async getIceInfo(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);

    if (!meet || user.id !== meet.organizerId) {
      throw new ForbiddenException(
        "Only the meet organiser can access ICE information",
      );
    }

    if (!this.isMeetAccessDay(meet)) {
      throw new ForbiddenException(
        "ICE information is only available on the day of the meet",
      );
    }

    const attendee = await this.meetsService.findAttendeeForEdit(
      meetId,
      attendeeId,
    );
    const linkedUserId = attendee?.attendee?.userId;

    if (!linkedUserId) {
      return { iceInfo: null };
    }

    const iceInfo = await this.usersService.findIceInfoByUserId(linkedUserId);
    return { iceInfo };
  }

  @Get(":attendeeId/history")
  async getHistory(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);
    this.assertCanAccessMeetAttendees(user, meet);

    const history = await this.meetsService.listAttendeeHistory(
      meetId,
      attendeeId,
    );
    return { history };
  }

  @Delete(":attendeeId")
  async remove(
    @Param("meetId") meetId: string,
    @Param("attendeeId") attendeeId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);
    this.assertCanAccessMeetAttendees(user, meet);

    const result = await this.meetsService.removeAttendee(meetId, attendeeId);
    await this.auditLogService.addRecord({
      orgId: meet.organizationId ?? "",
      userId: user.id,
      attendeeId,
      meetId: meet.id,
      action: "removed attendee from",
      target: `meet ${meet.name || "meet"}`,
    });
    return result;
  }

  private assertCanAccessMeetAttendees(
    user: UserProfile,
    meet: { organizationId?: string | null; organizerId?: string | null },
  ) {
    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "You are not an organizer in this organization",
      );
    }
    if (
      !this.authService.hasRole(user, meet.organizationId!, "admin") &&
      user.id !== meet.organizerId
    ) {
      throw new ForbiddenException(
        "You cannot access attendees for a meet you do not organize",
      );
    }
  }

  private isMeetAccessDay(
    meet?: {
      startTime?: string | null;
      endTime?: string | null;
      timeZone?: string | null;
    } | null,
  ) {
    if (!meet?.startTime) {
      return false;
    }

    const startTime = new Date(meet.startTime);
    const endTime = meet.endTime ? new Date(meet.endTime) : startTime;
    const now = new Date();

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      Number.isNaN(now.getTime())
    ) {
      return false;
    }

    const timeZone = meet.timeZone || "UTC";
    const formatDate = (value: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(value);

    const currentDate = formatDate(now);
    const startDate = formatDate(startTime);
    const endDate = formatDate(endTime);

    return currentDate >= startDate && currentDate <= endDate;
  }
}
