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

  constructor(private readonly db: DatabaseService) {
    const host = process.env.MAIL_SMTP_HOST;
    const port = Number(process.env.MAIL_SMTP_PORT || 587);
    const secure = process.env.MAIL_SMTP_SECURE === "true" || port === 465;
    const user = process.env.MAIL_SMTP_USER;
    const pass = process.env.MAIL_SMTP_PASS;
    const mailDomain =
      process.env.MAIL_DOMAIN || "adventuremeets.apps.fringecoding.com";
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
    const body = `Subject: ${subject}\n\n` + content;
    const sender = from || this.defaultFrom;

    const hash = crypto.createHash("sha256").update(body).digest("hex");

    const [inserted] = await this.db
      .getClient()("message_contents")
      .insert({ content_hash: hash, content: body })
      .onConflict("content_hash")
      .merge({ content: body })
      .returning("id");
    const contentId = inserted?.id;
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

  async sendEmail(options: SendEmailOptions) {
    const { to, subject, text, html, from, replyTo, attachments } = options;
    const mailOptions = {
      to,
      subject,
      text,
      html,
      from: from || this.defaultFrom,
      replyTo,
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
