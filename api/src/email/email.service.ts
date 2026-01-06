import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly defaultFrom: string;

  constructor() {
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST || process.env.RELAY_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER || process.env.RELAY_USER;
    const pass = process.env.SMTP_PASS || process.env.RELAY_PASS;
    const mailDomain = process.env.MAIL_DOMAIN || 'adventuremeets.apps.fringecoding.com';
    this.defaultFrom = process.env.MAIL_FROM || `noreply@${mailDomain}`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail(options: SendEmailOptions) {
    const { to, subject, text, html, from, replyTo } = options;
    const mailOptions = {
      to,
      subject,
      text,
      html,
      from: from || this.defaultFrom,
      replyTo,
    };
    this.logger.log(`Sending email to ${Array.isArray(to) ? to.join(',') : to} subject="${subject}"`);
    await this.transporter.sendMail(mailOptions);
  }
}
