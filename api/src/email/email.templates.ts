export type EmailTemplateName =
  | "password-reset"
  | "password-reset-confirmation"
  | "meet-signup";

export type PasswordResetTemplateVars = {
  resetUrl: string;
};

export type MeetSignupTemplateVars = {
  meetName: string;
  attendeeName?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  statusUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
};

const BRAND_NAME = "AdventureMeets";
const SUPPORT_EMAIL = "support@fringecoding.com";
const PRIMARY_COLOR = "#0f172a";

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
const getLogoUrl = () =>
  `${getFrontendUrl()}/static/adventuremeets-logo.png`;

function wrapHtml(content: string) {
  const brand = BRAND_NAME;
  const logoUrl = getLogoUrl();
  const primary = PRIMARY_COLOR;
  const supportEmail = SUPPORT_EMAIL;

  const logoBlock = logoUrl
    ? `<div style="text-align:center;margin-bottom:24px;">
        <img src="${logoUrl}" alt="${brand} logo" style="max-width:180px;height:auto;" />
      </div>`
    : `<div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:20px;font-weight:700;color:${primary};">${brand}</div>
      </div>`;

  const supportBlock = supportEmail
    ? `<p style="margin:24px 0 0 0;font-size:13px;color:#64748b;">Need help? Contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${brand}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
      ${logoBlock}
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
        ${content}
      </div>
      ${supportBlock}
      <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${brand}</p>
    </div>
  </body>
</html>`;
}

export function renderEmailTemplate(
  name: "password-reset",
  vars: PasswordResetTemplateVars
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: "password-reset-confirmation"
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: "meet-signup",
  vars: MeetSignupTemplateVars
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: EmailTemplateName,
  vars?: PasswordResetTemplateVars | MeetSignupTemplateVars
) {
  const brand = BRAND_NAME;

  if (name === "password-reset") {
    const resetVars = vars as PasswordResetTemplateVars | undefined;
    if (!resetVars?.resetUrl) {
      throw new Error("Missing resetUrl for password-reset template");
    }
    const subject = `Reset your ${brand} password`;
    const text =
      `You requested a password reset for your ${brand} account.\n\n` +
      `Use this link to reset your password (valid for 30 minutes):\n${resetVars.resetUrl}\n\n` +
      "If you did not request this, you can ignore this email.";
    const htmlBody = `
      <h2 style="margin:0 0 12px 0;font-size:20px;">Reset your password</h2>
      <p style="margin:0 0 16px 0;">We received a request to reset the password for your ${brand} account.</p>
      <p style="margin:0 0 24px 0;">This link is valid for 30 minutes.</p>
      <p style="margin:0 0 24px 0;text-align:center;">
        <a href="${resetVars.resetUrl}" style="display:inline-block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;">Reset password</a>
      </p>
      <p style="margin:0 0 16px 0;font-size:13px;color:#475569;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break:break-all;font-size:13px;color:#475569;margin:0;">${resetVars.resetUrl}</p>
      <p style="margin:24px 0 0 0;font-size:13px;color:#475569;">If you did not request this, you can ignore this email.</p>
    `;
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "meet-signup") {
    const signupVars = vars as MeetSignupTemplateVars | undefined;
    if (!signupVars?.meetName) {
      throw new Error("Missing meetName for meet-signup template");
    }
    const dateString = formatDateTime(signupVars.startTime);
    const endString = formatDateTime(signupVars.endTime);
    const hasRange = Boolean(dateString && endString && dateString !== endString);
    const timeLine = hasRange
      ? `${dateString} to ${endString}`
      : dateString || "TBC";
    const locationLine = signupVars.location || "TBC";
    const greetingName = signupVars.attendeeName || "there";
    const statusUrl = signupVars.statusUrl || "";
    const organizerName = signupVars.organizerName || "the organizer";
    const organizerEmail = signupVars.organizerEmail || "";

    const subject = `You're signed up for ${signupVars.meetName}`;
    const textParts = [
      `Hi ${greetingName},`,
      "",
      `You're signed up for ${signupVars.meetName}.`,
      "",
      `When: ${timeLine}`,
      `Where: ${locationLine}`,
    ];
    if (statusUrl) {
      textParts.push("", "View your application status:", statusUrl);
    }
    if (organizerEmail) {
      textParts.push(
        "",
        `Questions? Contact ${organizerName} at ${organizerEmail}.`,
      );
    }
    const text = textParts.join("\n");

    const htmlBody = `
      <h2 style="margin:0 0 12px 0;font-size:20px;">You're signed up</h2>
      <p style="margin:0 0 16px 0;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin:0 0 16px 0;">You're signed up for <strong>${escapeHtml(
        signupVars.meetName,
      )}</strong>.</p>
      <div style="margin:0 0 16px 0;padding:12px 14px;background:#f1f5f9;border-radius:8px;">
        <p style="margin:0 0 6px 0;"><strong>When:</strong> ${escapeHtml(
          timeLine,
        )}</p>
        <p style="margin:0;"><strong>Where:</strong> ${escapeHtml(
          locationLine,
        )}</p>
      </div>
      ${
        statusUrl
          ? `<p style="margin:0 0 16px 0;text-align:center;">
              <a href="${statusUrl}" style="display:inline-block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;">View your application</a>
            </p>`
          : ""
      }
      ${
        statusUrl
          ? `<p style="margin:0 0 16px 0;font-size:13px;color:#475569;">If the button doesn't work, copy and paste this link into your browser:</p>
             <p style="word-break:break-all;font-size:13px;color:#475569;margin:0 0 16px 0;">${statusUrl}</p>`
          : ""
      }
      ${
        organizerEmail
          ? `<p style="margin:0;font-size:13px;color:#475569;">Questions? Contact ${escapeHtml(
              organizerName,
            )} at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>`
          : ""
      }
    `;
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  const subject = `Your ${brand} password was updated`;
  const text =
    `This is a confirmation that your ${brand} password was updated successfully. ` +
    "If you did not perform this action, please contact support.";
  const htmlBody = `
    <h2 style="margin:0 0 12px 0;font-size:20px;">Password updated</h2>
    <p style="margin:0 0 16px 0;">Your ${brand} password was updated successfully.</p>
    <p style="margin:0;font-size:13px;color:#475569;">If you did not perform this action, please contact support.</p>
  `;
  return { subject, text, html: wrapHtml(htmlBody) };
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
