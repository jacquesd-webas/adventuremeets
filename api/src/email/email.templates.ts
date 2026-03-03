import { readFileSync } from "node:fs";
import { join } from "node:path";

export type EmailTemplateName =
  | "password-reset"
  | "password-reset-confirmation"
  | "meet-signup"
  | "verify-email"
  | "meet-confirm"
  | "meet-reject"
  | "meet-waitlist"
  | "meet-message";

export type PasswordResetTemplateVars = {
  resetUrl: string;
};

export type VerifyEmailTemplateVars = {
  verificationCode: string;
  expiresIn: string;
};

export type MeetSignupTemplateVars = {
  meetName: string;
  attendeeName?: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  location?: string;
  statusUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
};

export type MeetStatusTemplateVars = {
  meetName: string;
  attendeeName?: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  location?: string;
  statusUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
};

export type MeetMessageTemplateVars = {
  meetName: string;
  attendeeName?: string;
  statusUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
  messageBody: string;
};

const BRAND_NAME = "AdventureMeets";
const SUPPORT_EMAIL = "support@fringecoding.com";
const PRIMARY_COLOR = "#0f172a";
const SECONDARY_COLOR = "#475569";
const FROM_NAME = "AdventureMeets";

const baseVarsMap = {
  brand: BRAND_NAME,
  supportEmail: SUPPORT_EMAIL,
  primaryColor: PRIMARY_COLOR,
  secondaryColor: SECONDARY_COLOR,
  fromName: FROM_NAME,
};

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
const getLogoUrl = () => `${getFrontendUrl()}/static/adventuremeets-logo.png`;

const templateCache = new Map<string, string>();

const loadTemplate = (name: EmailTemplateName, ext: "html" | "txt") => {
  const key = `${name}.${ext}`;
  const cached = templateCache.get(key);
  if (cached) return cached;
  const filePath = join(process.cwd(), "templates", key);
  const contents = readFileSync(filePath, "utf8");
  templateCache.set(key, contents);
  return contents;
};

const renderTemplate = (
  name: EmailTemplateName,
  ext: "html" | "txt",
  vars: Record<string, string>,
  flags?: Record<string, boolean>,
) => {
  let template = loadTemplate(name, ext);
  const withFlags = flags || {};
  Object.keys(withFlags).forEach((flag) => {
    const on = withFlags[flag];
    const open = `{{#${flag}}}`;
    const close = `{{/${flag}}}`;
    if (on) {
      template = template.split(open).join("").split(close).join("");
    } else {
      const regex = new RegExp(`${open}[\\s\\S]*?${close}`, "g");
      template = template.replace(regex, "");
    }
  });
  Object.entries(vars).forEach(([key, value]) => {
    template = template.split(`{{${key}}}`).join(value);
  });
  return template.replace(/\n{3,}/g, "\n\n").trim();
};

function wrapHtml(content: string) {
  const logoUrl = getLogoUrl();

  const logoBlock = logoUrl
    ? `<div style="text-align:center;margin-bottom:24px;">
        <img src="${logoUrl}" logo" alt="${BRAND_NAME} logo" style="max-width:180px;height:auto;" />
      </div>`
    : "";

  const supportBlock = SUPPORT_EMAIL
    ? `<p style="margin:24px 0 0 0;font-size:13px;color:#64748b;">Need help? Contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${BRAND_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
      ${logoBlock}
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
        ${content}
      </div>
      ${supportBlock}
      <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${BRAND_NAME}</p>
    </div>
  </body>
</html>`;
}

export function renderEmailTemplate(
  name: "password-reset",
  vars: PasswordResetTemplateVars,
): { subject: string; text: string; html: string };
export function renderEmailTemplate(name: "password-reset-confirmation"): {
  subject: string;
  text: string;
  html: string;
};
export function renderEmailTemplate(
  name: "meet-signup",
  vars: MeetSignupTemplateVars,
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: "verify-email",
  vars: VerifyEmailTemplateVars,
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: "meet-confirm",
  vars: MeetStatusTemplateVars,
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: "meet-reject",
  vars: MeetStatusTemplateVars,
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: "meet-waitlist",
  vars: MeetStatusTemplateVars,
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: "meet-message",
  vars: MeetMessageTemplateVars,
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: EmailTemplateName,
  vars?:
    | PasswordResetTemplateVars
    | MeetSignupTemplateVars
    | VerifyEmailTemplateVars
    | MeetStatusTemplateVars
    | MeetMessageTemplateVars,
) {
  if (name === "password-reset") {
    const resetVars = vars as PasswordResetTemplateVars | undefined;
    if (!resetVars?.resetUrl) {
      throw new Error("Missing resetUrl for password-reset template");
    }
    const subject = `Reset your ${BRAND_NAME} password`;
    const varsMap = {
      ...baseVarsMap,
      resetUrl: resetVars.resetUrl,
      expiresIn: "30 minutes",
    };
    const text = renderTemplate("password-reset", "txt", varsMap);
    const htmlBody = renderTemplate("password-reset", "html", varsMap);
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "meet-signup") {
    const signupVars = vars as MeetSignupTemplateVars | undefined;
    if (!signupVars?.meetName) {
      throw new Error("Missing meetName for meet-signup template");
    }
    const greetingName = signupVars.attendeeName || "there";
    const statusUrl = signupVars.statusUrl || "";
    const organizerName = signupVars.organizerName || "the organizer";
    const organizerEmail = signupVars.organizerEmail || "";
    const dateString = formatDateTime(
      signupVars.startTime,
      signupVars.timeZone,
    );
    const endString = formatDateTime(signupVars.endTime, signupVars.timeZone);
    const hasRange = Boolean(dateString && endString && dateString !== endString);
    const timeLine = hasRange
      ? `${dateString} to ${endString}`
      : dateString || "TBC";
    const locationLine = signupVars.location || "TBC";

    const subject = `You're signed up for ${signupVars.meetName}`;
    const varsMap = {
      ...baseVarsMap,
      attendeeName: escapeHtml(greetingName),
      meetName: escapeHtml(signupVars.meetName),
      timeLine: escapeHtml(timeLine),
      locationLine: escapeHtml(locationLine),
      statusUrl,
      organizerName: escapeHtml(organizerName),
      organizerEmail,
    };
    const flags = {
      ifStatusUrl: Boolean(statusUrl),
      ifOrganizerEmail: Boolean(organizerEmail),
    };
    const text = renderTemplate("meet-signup", "txt", varsMap, flags);
    const htmlBody = renderTemplate("meet-signup", "html", varsMap, flags);
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "meet-confirm") {
    const meetVars = vars as MeetStatusTemplateVars | undefined;
    if (!meetVars?.meetName) {
      throw new Error("Missing meetName for meet-confirm template");
    }
    const greetingName = meetVars.attendeeName || "there";
    const statusUrl = meetVars.statusUrl || "";
    const organizerName = meetVars.organizerName || "the organizer";
    const organizerEmail = meetVars.organizerEmail || "";
    const dateString = formatDateTime(meetVars.startTime, meetVars.timeZone);
    const endString = formatDateTime(meetVars.endTime, meetVars.timeZone);
    const hasRange = Boolean(dateString && endString && dateString !== endString);
    const timeLine = hasRange
      ? `${dateString} to ${endString}`
      : dateString || "TBC";
    const locationLine = meetVars.location || "TBC";
    const subject = `You're confirmed for ${meetVars.meetName}`;
    const varsMap = {
      ...baseVarsMap,
      attendeeName: escapeHtml(greetingName),
      meetName: escapeHtml(meetVars.meetName),
      timeLine: escapeHtml(timeLine),
      locationLine: escapeHtml(locationLine),
      statusUrl,
      organizerName: escapeHtml(organizerName),
      organizerEmail,
    };
    const flags = {
      ifStatusUrl: Boolean(statusUrl),
      ifOrganizerEmail: Boolean(organizerEmail),
    };
    const text = renderTemplate("meet-confirm", "txt", varsMap, flags);
    const htmlBody = renderTemplate("meet-confirm", "html", varsMap, flags);
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "meet-reject") {
    const meetVars = vars as MeetStatusTemplateVars | undefined;
    if (!meetVars?.meetName) {
      throw new Error("Missing meetName for meet-reject template");
    }
    const greetingName = meetVars.attendeeName || "there";
    const statusUrl = meetVars.statusUrl || "";
    const organizerName = meetVars.organizerName || "the organizer";
    const organizerEmail = meetVars.organizerEmail || "";
    const subject = `Update on your application for ${meetVars.meetName}`;
    const varsMap = {
      ...baseVarsMap,
      attendeeName: escapeHtml(greetingName),
      meetName: escapeHtml(meetVars.meetName),
      statusUrl,
      organizerName: escapeHtml(organizerName),
      organizerEmail,
    };
    const flags = {
      ifStatusUrl: Boolean(statusUrl),
      ifOrganizerEmail: Boolean(organizerEmail),
    };
    const text = renderTemplate("meet-reject", "txt", varsMap, flags);
    const htmlBody = renderTemplate("meet-reject", "html", varsMap, flags);
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "meet-waitlist") {
    const meetVars = vars as MeetStatusTemplateVars | undefined;
    if (!meetVars?.meetName) {
      throw new Error("Missing meetName for meet-waitlist template");
    }
    const greetingName = meetVars.attendeeName || "there";
    const statusUrl = meetVars.statusUrl || "";
    const organizerName = meetVars.organizerName || "the organizer";
    const organizerEmail = meetVars.organizerEmail || "";
    const dateString = formatDateTime(meetVars.startTime, meetVars.timeZone);
    const endString = formatDateTime(meetVars.endTime, meetVars.timeZone);
    const hasRange = Boolean(dateString && endString && dateString !== endString);
    const timeLine = hasRange
      ? `${dateString} to ${endString}`
      : dateString || "TBC";
    const locationLine = meetVars.location || "TBC";
    const subject = `You're on the waitlist for ${meetVars.meetName}`;
    const varsMap = {
      ...baseVarsMap,
      attendeeName: escapeHtml(greetingName),
      meetName: escapeHtml(meetVars.meetName),
      timeLine: escapeHtml(timeLine),
      locationLine: escapeHtml(locationLine),
      statusUrl,
      organizerName: escapeHtml(organizerName),
      organizerEmail,
    };
    const flags = {
      ifStatusUrl: Boolean(statusUrl),
      ifOrganizerEmail: Boolean(organizerEmail),
    };
    const text = renderTemplate("meet-waitlist", "txt", varsMap, flags);
    const htmlBody = renderTemplate("meet-waitlist", "html", varsMap, flags);
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "meet-message") {
    const messageVars = vars as MeetMessageTemplateVars | undefined;
    if (!messageVars?.meetName) {
      throw new Error("Missing meetName for meet-message template");
    }
    const greetingName = messageVars.attendeeName || "there";
    const statusUrl = messageVars.statusUrl || "";
    const organizerName = messageVars.organizerName || "the organizer";
    const organizerEmail = messageVars.organizerEmail || "";
    const subject = `Message about ${messageVars.meetName}`;
    const varsMap = {
      ...baseVarsMap,
      attendeeName: escapeHtml(greetingName),
      meetName: escapeHtml(messageVars.meetName),
      statusUrl,
      organizerName: escapeHtml(organizerName),
      organizerEmail,
      messageBody: escapeHtml(messageVars.messageBody),
    };
    const flags = {
      ifStatusUrl: Boolean(statusUrl),
      ifOrganizerEmail: Boolean(organizerEmail),
    };
    const text = renderTemplate("meet-message", "txt", varsMap, flags);
    const htmlBody = renderTemplate("meet-message", "html", varsMap, flags);
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "password-reset-confirmation") {
    const subject = `Your ${BRAND_NAME} password was updated`;
    const varsMap = {
      ...baseVarsMap,
    };
    const text = renderTemplate("password-reset-confirmation", "txt", varsMap);
    const htmlBody = renderTemplate(
      "password-reset-confirmation",
      "html",
      varsMap,
    );
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "verify-email") {
    const verifyVars = vars as VerifyEmailTemplateVars | undefined;
    const subject = `Verify your ${BRAND_NAME} email address`;
    const varsMap = {
      ...baseVarsMap,
      verificationCode: verifyVars?.verificationCode || "",
      expiresIn: verifyVars?.expiresIn || "30 minutes",
    };
    const text = renderTemplate("verify-email", "txt", varsMap);
    const htmlBody = renderTemplate("verify-email", "html", varsMap);
    return { subject, text, html: wrapHtml(htmlBody) };
  }
}

function formatDateTime(value?: string, timeZone?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    if (timeZone) {
      return new Intl.DateTimeFormat("en-US", {
        timeZone,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(parsed);
    }
    return parsed.toISOString().replace("T", " ").slice(0, 16);
  }
  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
