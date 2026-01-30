import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import * as crypto from "crypto";
import type { Attachment } from "nodemailer/lib/mailer";
import { DatabaseService } from "../database/database.service";

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Attachment[];
  attendeeId?: string;
  meetId?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly defaultFrom: string;
  private readonly mailDomain: string;

  constructor(private readonly db: DatabaseService) {
    const host = process.env.MAIL_SMTP_HOST;
    const port = Number(process.env.MAIL_SMTP_PORT || 587);
    const secure = process.env.MAIL_SMTP_SECURE === "true" || port === 465;
    const user = process.env.MAIL_SMTP_USER;
    const pass = process.env.MAIL_SMTP_PASS;
    const mailDomain =
      process.env.MAIL_DOMAIN || "adventuremeets.apps.fringecoding.com";
    this.mailDomain = mailDomain;
    this.defaultFrom = process.env.MAIL_DEFAULT_FROM || `noreply@${mailDomain}`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async saveMessage(options: SendEmailOptions) {
    const { to, subject, text, html, from, attendeeId, meetId } = options;

    // It's not a message relating to a meet or attendee
    if (!attendeeId || !meetId) return;

    const content = html && html.trim().length ? html : text;
    const raw = `Subject: ${subject}\n\n${content}`;
    const parsed = this.parseMessageContent(raw);
    const body =
      `Subject: ${parsed.subject}\n\n` +
      (parsed.pertinentBody || parsed.body || content);
    const sender = meetId ? this.defaultFrom : from || this.defaultFrom;

    const contentId = await this.resolveMessageContentId(body);
    if (!contentId) {
      this.logger.error("Failed to resolve message content id");
      return;
    }

    await this.db.getClient()("messages").insert({
      meet_id: meetId,
      attendee_id: attendeeId,
      from: sender,
      to,
      message_content_id: contentId,
    });
  }

  async saveIncomingMessage(payload: {
    meetId: string;
    attendeeId?: string | null;
    from: string;
    to?: string | null;
    rawContent: string;
  }) {
    const parsed = this.parseMessageContent(payload.rawContent);
    const body =
      `Subject: ${parsed.subject}\n\n` + (parsed.pertinentBody || parsed.body);
    const contentId = await this.resolveMessageContentId(body);
    if (!contentId) {
      this.logger.error("Failed to resolve message content id");
      return;
    }
    await this.db
      .getClient()("messages")
      .insert({
        meet_id: payload.meetId,
        attendee_id: payload.attendeeId ?? null,
        from: payload.from,
        to: payload.to ?? null,
        message_content_id: contentId,
      });
  }

  parseMessageContent(rawContent: string) {
    const normalized = rawContent.replace(/\r\n/g, "\n");
    const subjectMatch = normalized.match(/^Subject:\s*(.+)$/im);
    const subject = subjectMatch?.[1]?.trim() || "No subject";
    let body = normalized;
    const headerIndex = normalized.indexOf("\n\n");
    if (headerIndex !== -1) {
      body = normalized.slice(headerIndex + 2);
    } else if (subjectMatch?.index != null) {
      body = normalized.slice(subjectMatch.index + subjectMatch[0].length);
    }
    body = body.trim();
    const pertinentBody = this.stripQuotedText(body);
    return { subject, body, pertinentBody };
  }

  private stripQuotedText(body: string) {
    if (!body) return "";
    const lines = body.split("\n");
    const collected: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        /^>/.test(trimmed) ||
        /^On .+ wrote:$/i.test(trimmed) ||
        /^From:/i.test(trimmed) ||
        /^Sent:/i.test(trimmed) ||
        /^To:/i.test(trimmed) ||
        /^Subject:/i.test(trimmed) ||
        /^-{2,}\s*Original Message\s*-{2,}$/i.test(trimmed) ||
        /^_{2,}$/.test(trimmed)
      ) {
        break;
      }
      if (/^--\s*$/.test(trimmed)) {
        break;
      }
      collected.push(line);
    }
    const cleaned = collected.join("\n").trim();
    return cleaned;
  }

  private async resolveMessageContentId(content: string) {
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    const [inserted] = await this.db
      .getClient()("message_contents")
      .insert({ content_hash: hash, content })
      .onConflict("content_hash")
      .merge({ content })
      .returning("id");
    return inserted?.id;
  }

  async sendEmail(options: SendEmailOptions) {
    const {
      to,
      subject,
      text,
      html,
      from,
      replyTo,
      attachments,
      meetId,
    } = options;
    const resolvedFrom = meetId ? this.defaultFrom : from || this.defaultFrom;
    const resolvedReplyTo = meetId
      ? replyTo || `meet+${meetId}@${this.mailDomain}`
      : replyTo;
    const mailOptions = {
      to,
      subject,
      text,
      html,
      from: resolvedFrom,
      replyTo: resolvedReplyTo,
      attachments,
    };
    this.logger.log(
      `Sending email to ${
        Array.isArray(to) ? to.join(",") : to
      } subject="${subject}"`
    );
    await this.transporter.sendMail(mailOptions);

    await this.saveMessage(options);
  }
}
