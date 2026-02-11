import { readFileSync } from "node:fs";
import { join } from "node:path";

export type EmailTemplateName =
  | "password-reset"
  | "password-reset-confirmation"
  | "meet-signup"
  | "verify-email";

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
  statusUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
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
  const filePath = join(__dirname, "templates", key);
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

const textToHtmlParagraphs = (text: string) => {
  const lines = text.split("\n");
  const paragraphs: string[] = [];
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length === 0) return;
    const content = escapeHtml(buffer.join(" ").trim());
    if (content) {
      paragraphs.push(`<p style="margin:0 0 16px 0;">${content}</p>`);
    }
    buffer = [];
  };
  lines.forEach((line) => {
    if (!line.trim()) {
      flush();
    } else {
      buffer.push(line.trim());
    }
  });
  flush();
  return paragraphs.join("");
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
  name: EmailTemplateName,
  vars?: PasswordResetTemplateVars | MeetSignupTemplateVars,
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
    };
    const text = renderTemplate("password-reset", "txt", varsMap);
    const htmlBody = textToHtmlParagraphs(text);
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

    const subject = `You're signed up for ${signupVars.meetName}`;
    const varsMap = {
      ...baseVarsMap,
      attendeeName: escapeHtml(greetingName),
      meetName: escapeHtml(signupVars.meetName),
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
    const subject = `Verify your ${BRAND_NAME} email address`;
    const varsMap = {
      ...baseVarsMap,
      expiresIn: "30 minutes",
    };
    const text = renderTemplate("verify-email", "txt", varsMap);
    const htmlBody = renderTemplate("verify-email", "html", varsMap);
    return { subject, text, html: wrapHtml(htmlBody) };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
