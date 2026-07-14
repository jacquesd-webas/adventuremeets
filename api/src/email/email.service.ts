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

    const content =
      text && text.trim().length
        ? text
        : html && html.trim().length
          ? html
          : "";
    const raw = `Subject: ${subject}\n\n${content}`;
    const parsed = this.parseMessageContent(raw);
    const body =
      `Subject: ${parsed.subject}\n\n` +
      (parsed.pertinentBody || parsed.body || content);
    const sender = meetId ? this.defaultFrom : from || this.defaultFrom;
    const recipients = Array.isArray(to) ? to.join(", ") : to;

    const contentId = await this.resolveMessageContentId(body);
    if (!contentId) {
      this.logger.error("Failed to resolve message content id");
      return;
    }

    await this.db.getClient()("messages").insert({
      meet_id: meetId,
      attendee_id: attendeeId,
      from: sender,
      to: recipients,
      message_content_id: contentId,
      is_read: true,
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
    const subject =
      this.decodeMimeEncodedWords(subjectMatch?.[1]?.trim() || "") ||
      "No subject";
    const body = this.extractBody(
      normalized,
      subjectMatch?.[0],
      subjectMatch?.index,
    );
    const pertinentBody = this.stripQuotedText(body);
    return { subject, body, pertinentBody };
  }

  private extractBody(
    normalized: string,
    subjectLine?: string,
    subjectIndex?: number,
  ) {
    let body = normalized;
    const headerIndex = normalized.indexOf("\n\n");
    const headers =
      headerIndex !== -1 ? normalized.slice(0, headerIndex) : normalized;

    if (headerIndex !== -1) {
      body = normalized.slice(headerIndex + 2);
    } else if (subjectLine && subjectIndex != null) {
      body = normalized.slice(subjectIndex + subjectLine.length);
    }

    const boundaryMatch = headers.match(
      /^Content-Type:\s*multipart\/[^\n;]+;[\s\S]*?\bboundary="?([^";\n]+)"?/im,
    );

    if (boundaryMatch?.[1]) {
      const plainTextPart = this.extractMultipartTextPart(
        body,
        boundaryMatch[1],
      );
      if (plainTextPart) {
        return plainTextPart.trim();
      }
    }

    return body.trim();
  }

  private extractMultipartTextPart(body: string, boundary: string) {
    const delimiter = `--${boundary}`;
    const parts = body.split(delimiter);

    for (const rawPart of parts) {
      const part = rawPart.trim();
      if (!part || part === "--") continue;

      const normalizedPart = part.replace(/\n--$/, "").trim();
      const headerIndex = normalizedPart.indexOf("\n\n");
      if (headerIndex === -1) continue;

      const headers = normalizedPart.slice(0, headerIndex);
      if (!/^Content-Type:\s*text\/plain\b/im.test(headers)) continue;

      const encoding =
        headers
          .match(/^Content-Transfer-Encoding:\s*([^\s;]+)/im)?.[1]
          ?.toLowerCase() || "";
      let content = normalizedPart.slice(headerIndex + 2).trim();

      if (encoding === "quoted-printable") {
        content = this.decodeQuotedPrintable(content);
      } else if (encoding === "base64") {
        content = Buffer.from(content.replace(/\s+/g, ""), "base64").toString(
          "utf8",
        );
      }

      return content.trim();
    }

    return "";
  }

  private decodeQuotedPrintable(value: string) {
    const input = value.replace(/=\n/g, "");
    const bytes: number[] = [];

    for (let i = 0; i < input.length; ) {
      if (
        input[i] === "=" &&
        /^[0-9A-Fa-f]{2}$/.test(input.slice(i + 1, i + 3))
      ) {
        bytes.push(parseInt(input.slice(i + 1, i + 3), 16));
        i += 3;
      } else {
        const codePoint = input.codePointAt(i)!;
        const char = String.fromCodePoint(codePoint);
        bytes.push(...Buffer.from(char, "utf8"));
        i += char.length;
      }
    }

    return Buffer.from(bytes).toString("utf8");
  }

  private decodeMimeEncodedWords(value: string) {
    if (!value) return "";

    return value.replace(
      /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
      (_match, charset: string, encoding: string, encodedText: string) => {
        const normalizedCharset = charset.trim().toLowerCase();
        if (normalizedCharset !== "utf-8" && normalizedCharset !== "utf8") {
          return encodedText;
        }

        if (encoding.toUpperCase() === "B") {
          return Buffer.from(encodedText, "base64").toString("utf8");
        }

        return this.decodeQuotedPrintable(encodedText.replace(/_/g, " "));
      },
    );
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
        /^Content-Type:/i.test(trimmed) ||
        /^Content-Transfer-Encoding:/i.test(trimmed) ||
        /^MIME-Version:/i.test(trimmed) ||
        /^-{2,}\s*Original Message\s*-{2,}$/i.test(trimmed) ||
        /^_{2,}$/.test(trimmed) ||
        /^--[A-Za-z0-9][A-Za-z0-9'()+_,./:=?-]*$/.test(trimmed)
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
    const { to, subject, text, html, from, replyTo, attachments, meetId } =
      options;
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
      } subject="${subject}"`,
    );
    const info = await this.transporter.sendMail(mailOptions);
    const expectedRecipients = this.normalizeRecipientList(to);
    const acceptedRecipients = this.normalizeRecipientList(
      ((info as any)?.accepted ?? []) as Array<string | { address?: string }>,
    );

    const missingRecipients = expectedRecipients.filter(
      (recipient) => !acceptedRecipients.includes(recipient),
    );

    if (missingRecipients.length > 0) {
      throw new Error(
        `SMTP did not accept recipient(s): ${missingRecipients.join(", ")}`,
      );
    }
  }

  private normalizeRecipientList(
    recipients: Array<string | { address?: string }> | string,
  ) {
    const values = Array.isArray(recipients) ? recipients : [recipients];
    return values
      .flatMap((value) => {
        if (typeof value === "string") {
          return value
            .split(",")
            .map((part) => part.trim().toLowerCase())
            .filter(Boolean);
        }

        const address = value?.address?.trim().toLowerCase();
        return address ? [address] : [];
      })
      .filter(Boolean);
  }
}
