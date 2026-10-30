import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  HttpStatus,
  Res,
} from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { DatabaseService } from "../database/database.service";
import { Public } from "../auth/decorators/public.decorator";
import { EmailService } from "../email/email.service";
import { normalizeIncomingMessageContent } from "../email/incoming-message-content";
import { AuditLogService } from "../audit/audit-log.service";
import { simpleParser, type AddressObject } from "mailparser";
import { IndemnityTemplateService } from "./indemnity-template.service";
import { validIndemnityReplyToken } from "./indemnity-reply-token";

@ApiTags("Mail")
@Controller()
export class IncomingMailController {
  constructor(
    private readonly db: DatabaseService,
    private readonly emailService: EmailService,
    private readonly auditLogService: AuditLogService,
    private readonly indemnityTemplates: IndemnityTemplateService,
  ) {}

  @Public()
  @Post("incoming")
  @ApiOperation({ summary: "Incoming mail webhook" })
  @ApiHeader({
    name: "X-Rcpt-To",
    required: true,
    description: "<meet_id>@adventuremeets.apps.fringecoding.com",
  })
  @ApiHeader({
    name: "X-Mail-From",
    required: true,
    description: "Sender email address",
  })
  @ApiHeader({
    name: "X-Client-IP",
    required: false,
    description: "Origin IP (if provided by MTA)",
  })
  @ApiConsumes("message/rfc822", "text/plain")
  @ApiBody({
    description: "Raw RFC822 message body",
    schema: {
      type: "string",
      example: "Subject: Test\r\n\r\nThis is the body.",
    },
    required: true,
  })
  async handleIncoming(
    @Headers("x-rcpt-to") rcptTo: string | string[],
    @Headers("x-mail-from") mailFrom: string | string[],
    @Headers("x-client-ip") clientIp: string | string[],
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rcpt = Array.isArray(rcptTo) ? rcptTo[0] : rcptTo;
    const sender = Array.isArray(mailFrom) ? mailFrom[0] : mailFrom;
    //const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp;

    const mailDomain =
      process.env.MAIL_DOMAIN || "adventuremeets.apps.fringecoding.com";
    const escapedDomain = mailDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = rcpt?.match(
      new RegExp(`<?([^@<>]+)@${escapedDomain}>?`, "i"),
    );
    const rcptLocal = match?.[1];
    const meetAddress = rcptLocal?.startsWith("meet+")
      ? rcptLocal.slice("meet+".length)
      : rcptLocal;
    const [meetId, addressedAttendeeId, replyToken] =
      meetAddress?.split("+") || [];

    const rawBuffer = Buffer.isBuffer((req as any).rawBody)
      ? ((req as any).rawBody as Buffer)
      : Buffer.isBuffer(body)
        ? body
        : Buffer.from(
            typeof body === "string" ? body : JSON.stringify(body ?? ""),
          );
    const rawBody = rawBuffer.toString("utf8");

    if (!rcptLocal || !rawBody) {
      res.status(HttpStatus.OK);
      return { status: "ignored" };
    }

    if (rcptLocal.startsWith("bounce+")) {
      await this.emailService.recordBounce(
        rcptLocal.slice("bounce+".length),
        rawBody,
      );
      res.status(HttpStatus.OK);
      return { status: "bounce recorded" };
    }

    if (!meetId || !sender) {
      res.status(HttpStatus.OK);
      return { status: "ignored" };
    }

    // Make sure meet, sender and recipients are real
    const meet = await this.db
      .getClient()("meets")
      .select(
        "id",
        "organization_id",
        "organizer_id",
        "name",
        "indemnity_pdfs_id",
      )
      .where("id", meetId)
      .first();

    if (!meet) {
      res.status(HttpStatus.NOT_FOUND);
      return { status: "meet not found" };
    }

    const organizer = await this.db
      .getClient()("users")
      .select("email")
      .where("id", meet.organizer_id)
      .first();

    if (!organizer || !organizer.email) {
      res.status(HttpStatus.NOT_FOUND);
      return { status: "meet organiser not found" };
    }

    const readableContent = await normalizeIncomingMessageContent(rawBody);
    const organizerEmail = organizer.email.trim().toLowerCase();
    const isOrganizer = sender.trim().toLowerCase() === organizerEmail;
    if (isOrganizer) {
      const parsedReply = await simpleParser(rawBuffer);
      const addresses = [parsedReply.to, parsedReply.cc]
        .flatMap((entry) =>
          entry ? (Array.isArray(entry) ? entry : [entry]) : [],
        )
        .flatMap((entry: AddressObject) =>
          entry.value.flatMap((value) => [
            value.address,
            ...(value.group ?? []).map((member) => member.address),
          ]),
        )
        .filter((address): address is string => Boolean(address))
        .map((address) => address.trim().toLowerCase());
      const recipientEmails = [...new Set(addresses)].filter(
        (address) =>
          address !== organizerEmail &&
          address !== `organiser@${mailDomain.toLowerCase()}` &&
          address !== `${meetId.toLowerCase()}@${mailDomain.toLowerCase()}` &&
          !address.startsWith(`meet+${meetId.toLowerCase()}@`) &&
          !address.startsWith(`meet+${meetId.toLowerCase()}+`),
      );

      if (recipientEmails.length > 0) {
        for (const recipientEmail of recipientEmails) {
          const recipientAttendee = await this.db
            .getClient()("meet_attendees")
            .select("id")
            .where("meet_id", meetId)
            .andWhereRaw("lower(email) = ?", [recipientEmail])
            .first();
          if (!recipientAttendee) continue;

          await this.emailService.saveIncomingMessage({
            meetId,
            attendeeId: recipientAttendee.id,
            from: sender,
            to: recipientEmail,
            rawContent: readableContent,
          });
          await this.auditLogService.addRecord({
            orgId: meet.organization_id,
            attendeeId: recipientAttendee.id,
            meetId: meet.id,
            description: `Outgoing mail for meet ${meet.name || "meet"}`,
          });
        }
        res.status(HttpStatus.CREATED);
        return { status: "ok" };
      }
    }

    const attendeeQuery = this.db
      .getClient()("meet_attendees")
      .select("id", "name", "email")
      .where("meet_id", meetId)
      .andWhereRaw("lower(email) = lower(?)", [sender]);
    if (addressedAttendeeId) attendeeQuery.andWhere("id", addressedAttendeeId);
    const attendee = await attendeeQuery.first();

    const parsedMail = meet.indemnity_pdfs_id
      ? await simpleParser(rawBuffer)
      : null;
    if (
      parsedMail &&
      addressedAttendeeId &&
      validIndemnityReplyToken(meetId, addressedAttendeeId, replyToken)
    ) {
      const pdf = parsedMail.attachments.find(
        (attachment) =>
          attachment.content.length > 0 &&
          attachment.content.length <= 10 * 1024 * 1024 &&
          attachment.content.subarray(0, 5).toString() === "%PDF-",
      );
      if (pdf && attendee) {
        await this.indemnityTemplates.saveSignedAttendeePdf(
          meetId,
          attendee.id,
          {
            filename: pdf.filename || undefined,
            content: pdf.content,
          },
        );
        await this.auditLogService.addRecord({
          orgId: meet.organization_id,
          attendeeId: attendee.id,
          meetId: meet.id,
          description: `Signed indemnity PDF received for ${attendee.name || "attendee"}`,
        });
      }
    }

    // It's okay if we dont' have an attendee - the email could come from anyone

    // Always forward the message to the organiser (if the organiser has an email)
    // We try to make it look nice
    const parsedContent =
      this.emailService.parseMessageContent(readableContent);
    const subject = parsedMail?.subject || parsedContent.subject;
    const pertinentBody = parsedMail?.text || parsedContent.pertinentBody;
    const fullBody = parsedMail?.text || parsedContent.body;
    const attendeeLabel = attendee?.name?.trim() || sender;
    const forwardedBody = [
      `You received a message from ${attendeeLabel} about meet ${meet.name}.`,
      "",
      `From: ${sender}`,
      `Meet: ${meet.name}`,
      `Original subject: ${subject || "No subject"}`,
      "",
      pertinentBody || fullBody || "",
    ].join("\n");

    await this.emailService.sendEmail({
      to: organizer.email,
      subject: `Message for meet: ${meet.name}`,
      text: forwardedBody,
      replyTo: sender,
      meetId: meet.id,
    });

    await this.emailService.saveIncomingMessage({
      meetId,
      attendeeId: attendee?.id ?? null,
      from: sender,
      to: organizer?.email ?? null,
      rawContent: parsedMail
        ? parsedMail.text
          ? `Subject: ${subject}\n\n${parsedMail.text}`
          : readableContent
        : readableContent,
    });

    await this.auditLogService.addRecord({
      orgId: meet.organization_id,
      attendeeId: attendee?.id ?? null,
      meetId: meet.id,
      description: `Incoming mail for meet ${meet.name || "meet"}`,
    });

    res.status(HttpStatus.CREATED);
    return { status: "ok" };
  }
}
