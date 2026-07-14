import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash } from "crypto";
import { DatabaseService } from "../database/database.service";
import { EmailService } from "../email/email.service";
import { renderEmailTemplate } from "../email/email.templates";
import { MeetDto } from "../meets/dto/meet.dto";
import { MeetsService } from "../meets/meets.service";
import {
  NotificationTypeName,
  SendNotificationDto,
} from "./dto/send-notification.dto";
import { SendNotificationResponseDto } from "./dto/send-notification-response.dto";

type NotificationEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attendeeId?: string;
  userId?: string;
};

type RecipientUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

type MeetAttendeeRecipient = {
  id: string;
  userId?: string | null;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
};

const DEFAULT_NOTIFICATION_TYPE_IDS: Record<NotificationTypeName, number> = {
  [NotificationTypeName.NewMeet]: 1,
  [NotificationTypeName.OrganizerNewAttendee]: 2,
  [NotificationTypeName.OrganiserReminderResponsesNeeded]: 3,
  [NotificationTypeName.OrganizerLastMinuteAttendee]: 4,
  [NotificationTypeName.OrganizerReminderCheckinNeeded]: 5,
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly emailService: EmailService,
    private readonly meetsService: MeetsService,
  ) {}

  async sendNotification(
    dto: SendNotificationDto,
  ): Promise<SendNotificationResponseDto> {
    const meet = await this.meetsService.findOne(dto.meetId);
    if (!meet) {
      throw new NotFoundException("Meet not found");
    }

    let email: NotificationEmail;
    let notificationHash: string | null = null;
    let shouldDeduplicateByHash = false;

    switch (dto.notificationType) {
      case NotificationTypeName.NewMeet:
        email = await this.sendNewMeetNotification(meet, dto);
        break;
      case NotificationTypeName.OrganizerNewAttendee:
        email = await this.sendOrganizerNewAttendeeNotification(meet, dto);
        break;
      case NotificationTypeName.OrganiserReminderResponsesNeeded:
        email = await this.sendOrganiserReminderResponsesNeededNotification(
          meet,
        );
        shouldDeduplicateByHash = true;
        break;
      case NotificationTypeName.OrganizerReminderCheckinNeeded:
        email = await this.sendOrganizerReminderCheckinNeededNotification(meet);
        shouldDeduplicateByHash = true;
        break;
      case NotificationTypeName.OrganizerLastMinuteAttendee:
        email = await this.sendOrganizerLastMinuteAttendeeNotification(
          meet,
          dto,
        );
        break;
      default:
        throw new BadRequestException("Unsupported notification type");
    }

    if (shouldDeduplicateByHash) {
      notificationHash = await this.buildMeetAttendeeHash(meet.id);
      const latestNotification = await this.getLatestNotificationRecord(
        dto.notificationType,
        meet.id,
      );
      if (
        latestNotification?.hash &&
        latestNotification.hash === notificationHash
      ) {
        return {
          status: "skipped",
          notificationType: dto.notificationType,
          notificationId: latestNotification.id,
          to: email.to,
        };
      }
    }

    await this.emailService.sendEmail({
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      meetId: meet.id,
      attendeeId: email.attendeeId,
    });

    const notificationId = await this.createNotificationRecord({
      notificationType: dto.notificationType,
      organizationId: meet.organizationId ?? null,
      meetId: meet.id,
      attendeeId: email.attendeeId ?? dto.attendeeId ?? null,
      userId: email.userId ?? null,
      hash: notificationHash,
    });

    return {
      status: "sent",
      notificationType: dto.notificationType,
      notificationId,
      to: email.to,
    };
  }

  private async sendNewMeetNotification(
    meet: MeetDto,
    dto: SendNotificationDto,
  ): Promise<NotificationEmail> {
    if (!dto.userId) {
      throw new BadRequestException(
        "userId is required for new_meet notifications",
      );
    }

    const user = await this.getUserOrThrow(dto.userId);
    if (!user.email) {
      throw new BadRequestException("Recipient user does not have an email");
    }

    const recipientName = this.getUserDisplayName(user) || "there";
    const meetUrl = this.buildOrganizerAttendeesUrl(meet);
    const timeLine = this.getMeetTimeLine(meet);
    const subject = `New meet: ${meet.name}`;
    const textLines = [
      `Hi ${recipientName},`,
      "",
      `${meet.organizerName || "An organiser"} has opened a new meet: ${meet.name}.`,
      `When: ${timeLine}`,
      `Where: ${meet.location || "Location to be confirmed"}`,
      ...(meetUrl ? ["", `Open meet: ${meetUrl}`] : []),
    ];

    return {
      to: user.email,
      subject,
      text: textLines.join("\n"),
      html: this.renderHtmlEmail({
        greeting: `Hi ${this.escapeHtml(recipientName)},`,
        paragraphs: [
          `${this.escapeHtml(meet.organizerName || "An organiser")} has opened a new meet: <strong>${this.escapeHtml(meet.name)}</strong>.`,
          `<strong>When:</strong> ${this.escapeHtml(timeLine)}`,
          `<strong>Where:</strong> ${this.escapeHtml(
            meet.location || "Location to be confirmed",
          )}`,
        ],
        actionLabel: meetUrl ? "Open meet" : undefined,
        actionUrl: meetUrl,
      }),
      userId: user.id,
    };
  }

  private async sendOrganizerNewAttendeeNotification(
    meet: MeetDto,
    dto: SendNotificationDto,
  ): Promise<NotificationEmail> {
    if (!dto.attendeeId) {
      throw new BadRequestException(
        "attendeeId is required for organizer_new_attendee notifications",
      );
    }

    const organizerEmail = meet.organizerEmail?.trim();
    if (!organizerEmail) {
      throw new BadRequestException("Meet organiser does not have an email");
    }

    const attendee = await this.getMeetAttendeeOrThrow(meet.id, dto.attendeeId);
    const attendeeName = this.getAttendeeDisplayName(attendee);
    const subject = `New attendee for ${meet.name}`;
    const meetUrl = this.buildOrganizerAttendeesUrl(meet);
    const textLines = [
      `Hi ${meet.organizerFirstName || meet.organizerName || "organiser"},`,
      "",
      `${attendeeName} has joined ${meet.name}.`,
      `Status: ${attendee.status || "pending"}`,
      `When: ${this.getMeetTimeLine(meet)}`,
      ...(meetUrl ? ["", `Open meet: ${meetUrl}`] : []),
    ];

    return {
      to: organizerEmail,
      subject,
      text: textLines.join("\n"),
      html: this.renderHtmlEmail({
        greeting: `Hi ${this.escapeHtml(
          meet.organizerFirstName || meet.organizerName || "organiser",
        )},`,
        paragraphs: [
          `<strong>${this.escapeHtml(attendeeName)}</strong> has joined <strong>${this.escapeHtml(meet.name)}</strong>.`,
          `<strong>Status:</strong> ${this.escapeHtml(
            attendee.status || "pending",
          )}`,
          `<strong>When:</strong> ${this.escapeHtml(this.getMeetTimeLine(meet))}`,
        ],
        actionLabel: meetUrl ? "Open meet" : undefined,
        actionUrl: meetUrl,
      }),
      attendeeId: attendee.id,
      userId: meet.organizerId,
    };
  }

  private async sendOrganiserReminderResponsesNeededNotification(
    meet: MeetDto,
  ): Promise<NotificationEmail> {
    const organizerEmail = meet.organizerEmail?.trim();
    if (!organizerEmail) {
      throw new BadRequestException("Meet organiser does not have an email");
    }

    const outstandingResponses = await this.countOutstandingResponses(meet.id);
    if (outstandingResponses <= 0) {
      throw new BadRequestException("No attendees are awaiting a response");
    }

    const meetUrl = this.buildOrganizerAttendeesUrl(meet);
    const { subject, text, html } = renderEmailTemplate(
      "organiser-reminder-responses-needed",
      {
        meetName: meet.name,
        organizerName:
          meet.organizerFirstName || meet.organizerName || "organiser",
        meetUrl,
        responseCount: outstandingResponses,
      },
    );

    return {
      to: organizerEmail,
      subject,
      text,
      html,
      userId: meet.organizerId,
    };
  }

  private async sendOrganizerReminderCheckinNeededNotification(
    meet: MeetDto,
  ): Promise<NotificationEmail> {
    const organizerEmail = meet.organizerEmail?.trim();
    if (!organizerEmail) {
      throw new BadRequestException("Meet organiser does not have an email");
    }

    const checkedInCount = await this.countCheckedInAttendees(meet.id);
    if (checkedInCount > 0) {
      throw new BadRequestException("Attendees have already been checked in");
    }

    const checkinUrl = this.buildOrganizerCheckinUrl(meet);
    const { subject, text, html } = renderEmailTemplate(
      "organizer-reminder-checkin-needed",
      {
        meetName: meet.name,
        organizerName:
          meet.organizerFirstName || meet.organizerName || "organiser",
        checkinUrl,
      },
    );

    return {
      to: organizerEmail,
      subject,
      text,
      html,
      userId: meet.organizerId,
    };
  }

  private async sendOrganizerLastMinuteAttendeeNotification(
    meet: MeetDto,
    dto: SendNotificationDto,
  ): Promise<NotificationEmail> {
    if (!dto.attendeeId) {
      throw new BadRequestException(
        "attendeeId is required for organizer_last_minute_attendee notifications",
      );
    }

    const organizerEmail = meet.organizerEmail?.trim();
    if (!organizerEmail) {
      throw new BadRequestException("Meet organiser does not have an email");
    }

    const attendee = await this.getMeetAttendeeOrThrow(meet.id, dto.attendeeId);
    const attendeeName = this.getAttendeeDisplayName(attendee);
    const subject = `Last-minute attendee for ${meet.name}`;
    const meetUrl = this.buildMeetUrl(meet);
    const textLines = [
      `Hi ${meet.organizerFirstName || meet.organizerName || "organiser"},`,
      "",
      `${attendeeName} joined ${meet.name} close to the start time.`,
      `Status: ${attendee.status || "pending"}`,
      `When: ${this.getMeetTimeLine(meet)}`,
      ...(meetUrl ? ["", `Open meet: ${meetUrl}`] : []),
    ];

    return {
      to: organizerEmail,
      subject,
      text: textLines.join("\n"),
      html: this.renderHtmlEmail({
        greeting: `Hi ${this.escapeHtml(
          meet.organizerFirstName || meet.organizerName || "organiser",
        )},`,
        paragraphs: [
          `<strong>${this.escapeHtml(attendeeName)}</strong> joined <strong>${this.escapeHtml(
            meet.name,
          )}</strong> close to the start time.`,
          `<strong>Status:</strong> ${this.escapeHtml(
            attendee.status || "pending",
          )}`,
          `<strong>When:</strong> ${this.escapeHtml(this.getMeetTimeLine(meet))}`,
        ],
        actionLabel: meetUrl ? "Open meet" : undefined,
        actionUrl: meetUrl,
      }),
      attendeeId: attendee.id,
      userId: meet.organizerId,
    };
  }

  private async getUserOrThrow(userId: string): Promise<RecipientUser> {
    const user = await this.db
      .getClient()("users")
      .where({ id: userId })
      .first("id", "email", "first_name", "last_name");

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
    };
  }

  private async getMeetAttendeeOrThrow(
    meetId: string,
    attendeeId: string,
  ): Promise<MeetAttendeeRecipient> {
    const attendee = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId, id: attendeeId })
      .first("id", "user_id", "status", "email", "phone", "name");

    if (!attendee) {
      throw new NotFoundException("Attendee not found");
    }

    return {
      id: attendee.id,
      userId: attendee.user_id ?? null,
      status: attendee.status ?? null,
      email: attendee.email ?? null,
      phone: attendee.phone ?? null,
      name: attendee.name ?? null,
    };
  }

  private async countOutstandingResponses(meetId: string): Promise<number> {
    const result = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId, status: "pending" })
      .whereNull("responded_at")
      .count<{ count: string }>("* as count")
      .first();

    return Number(result?.count ?? 0);
  }

  private async countCheckedInAttendees(meetId: string): Promise<number> {
    const result = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId })
      .whereIn("status", ["checked-in", "attended"])
      .count<{ count: string }>("* as count")
      .first();

    return Number(result?.count ?? 0);
  }

  private async createNotificationRecord(input: {
    notificationType: NotificationTypeName;
    organizationId?: string | null;
    meetId?: string | null;
    attendeeId?: string | null;
    userId?: string | null;
    hash?: string | null;
  }) {
    const notificationTypeId = await this.getNotificationTypeId(
      input.notificationType,
    );

    const [inserted] = await this.db
      .getClient()("notifications")
      .insert({
        organization_id: input.organizationId ?? null,
        meet_id: input.meetId ?? null,
        attendee_id: input.attendeeId ?? null,
        user_id: input.userId ?? null,
        notification_type_id: notificationTypeId,
        hash: input.hash ?? null,
      })
      .returning("id");

    return typeof inserted === "string" ? inserted : inserted?.id;
  }

  private async getNotificationTypeId(notificationType: NotificationTypeName) {
    const db = this.db.getClient();
    const findRecord = async () =>
      db("notification_types").where({ name: notificationType }).first("id");

    let record = await findRecord();

    if (!record) {
      const fallbackId = DEFAULT_NOTIFICATION_TYPE_IDS[notificationType];

      try {
        await db("notification_types")
          .insert({
            id: fallbackId,
            name: notificationType,
          })
          .onConflict("name")
          .ignore();
      } catch {
        // If another process inserted it first or the legacy DB state is odd,
        // re-read before failing.
      }

      record = await findRecord();
    }

    if (!record) {
      throw new NotFoundException(
        `Notification type ${notificationType} is not configured`,
      );
    }

    return record.id;
  }

  private async getLatestNotificationRecord(
    notificationType: NotificationTypeName,
    meetId: string,
  ) {
    const record = await this.db
      .getClient()("notifications as n")
      .join("notification_types as nt", "nt.id", "n.notification_type_id")
      .where("n.meet_id", meetId)
      .where("nt.name", notificationType)
      .orderBy("n.created_at", "desc")
      .first("n.id", "n.hash");

    return record
      ? {
          id: record.id as string,
          hash: (record.hash as string | null) ?? null,
        }
      : null;
  }

  private async buildMeetAttendeeHash(meetId: string) {
    const attendeeRows = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId })
      .orderBy([
        { column: "sequence", order: "asc" },
        { column: "created_at", order: "asc" },
        { column: "id", order: "asc" },
      ])
      .select("id");

    const serialized = attendeeRows
      .map((attendee: { id: string }) => attendee.id)
      .join("|");

    return createHash("sha256").update(serialized).digest("hex");
  }

  private getUserDisplayName(user: RecipientUser) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  }

  private getAttendeeDisplayName(attendee: MeetAttendeeRecipient) {
    return attendee.name || attendee.email || attendee.phone || "An attendee";
  }

  private getMeetTimeLine(meet: MeetDto) {
    const start = this.formatDateTime(meet.startTime, meet.timeZone);
    const end = this.formatDateTime(meet.endTime, meet.timeZone);

    if (start && end) return `${start} to ${end}`;
    if (start) return start;
    if (end) return end;
    return "Date and time to be confirmed";
  }

  private formatDateTime(value?: string, timeZone?: string) {
    if (!value) return "";

    try {
      return new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: timeZone || "UTC",
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  private buildMeetUrl(meet: MeetDto) {
    if (!meet.shareCode) return undefined;
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");
    return `${frontendUrl}/meets/${meet.shareCode}`;
  }

  private buildOrganizerAttendeesUrl(meet: MeetDto) {
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");
    return `${frontendUrl}/meet/${meet.id}/attendees`;
  }

  private buildOrganizerCheckinUrl(meet: MeetDto) {
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");
    return `${frontendUrl}/meet/${meet.id}/checkin`;
  }

  private renderHtmlEmail(input: {
    greeting: string;
    paragraphs: string[];
    actionLabel?: string;
    actionUrl?: string;
  }) {
    const actionMarkup =
      input.actionLabel && input.actionUrl
        ? `<p><a href="${this.escapeHtml(input.actionUrl)}">${this.escapeHtml(
            input.actionLabel,
          )}</a></p>`
        : "";

    return [
      "<div>",
      `<p>${input.greeting}</p>`,
      ...input.paragraphs.map((paragraph) => `<p>${paragraph}</p>`),
      actionMarkup,
      "</div>",
    ].join("");
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
