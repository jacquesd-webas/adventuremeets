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

@ApiTags("Mail")
@Controller()
export class IncomingMailController {
  constructor(
    private readonly db: DatabaseService,
    private readonly emailService: EmailService
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
    @Res({ passthrough: true }) res: Response
  ) {
    const rcpt = Array.isArray(rcptTo) ? rcptTo[0] : rcptTo;
    const sender = Array.isArray(mailFrom) ? mailFrom[0] : mailFrom;
    const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp;

    const mailDomain =
      process.env.MAIL_DOMAIN || "adventuremeets.apps.fringecoding.com";
    const match = rcpt?.match(
      new RegExp(`<?([^@<>]+)@${mailDomain.replace(".", "\\.")}>?`, "i")
    );
    const meetId = match?.[1];

    const rawBody =
      (req as any).rawBody?.toString?.() ??
      (typeof body === "string"
        ? body
        : typeof body === "object"
        ? JSON.stringify(body)
        : "");

    console.log(
      JSON.stringify(
        {
          rcpt,
          sender,
          clientIp: ip,
          meetId,
          bodyLength: rawBody.length,
        },
        null,
        2
      )
    );

    if (!meetId || !sender || !rawBody) {
      res.status(HttpStatus.OK);
      return { status: "ignored" };
    }

    // Make sure meet, sender and recipients are real
    const meet = await this.db
      .getClient()("meets")
      .select("id", "organizer_id", "name")
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

    const attendee = await this.db
      .getClient()("meet_attendees")
      .select("id")
      .where("meet_id", meetId)
      .andWhereRaw("lower(email) = lower(?)", [sender])
      .first();

    // It's okay if we dont' have an attendee - the email could come from anyone

    // Always forward the message to the organiser (if the organiser has an email)
    await this.emailService.sendEmail({
      to: organizer.email,
      subject: `Incoming message for meet: ${meet.name}`,
      text: `Forwarded message from ${sender}:\n\n` + rawBody,
    });

    await this.emailService.saveMessage({
      to: organizer.email,
      subject: `Incoming message for meet: ${meet.name}`,
      text: rawBody,
      from: sender,
      attendeeId: attendee?.id ?? undefined,
      meetId: meet.id,
    });
    await this.emailService.saveIncomingMessage({
      meetId,
      attendeeId: attendee?.id ?? null,
      from: sender,
      to: organizer?.email ?? null,
      rawContent: rawBody,
    });

    res.status(HttpStatus.CREATED);
    return { status: "ok" };
  }
}
