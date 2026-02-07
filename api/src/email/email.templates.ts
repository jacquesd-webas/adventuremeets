export type EmailTemplateName =
  | "password-reset"
  | "password-reset-confirmation"
  | "email-verification";

export type PasswordResetTemplateVars = {
  resetUrl: string;
};

export type EmailVerificationTemplateVars = {
  code: string;
  expiresInMinutes?: number;
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
  name: "email-verification",
  vars: EmailVerificationTemplateVars
): { subject: string; text: string; html: string };
export function renderEmailTemplate(
  name: EmailTemplateName,
  vars?: PasswordResetTemplateVars | EmailVerificationTemplateVars
) {
  const brand = BRAND_NAME;

  if (name === "password-reset") {
    if (!vars?.resetUrl) {
      throw new Error("Missing resetUrl for password-reset template");
    }
    const subject = `Reset your ${brand} password`;
    const text =
      `You requested a password reset for your ${brand} account.\n\n` +
      `Use this link to reset your password (valid for 30 minutes):\n${vars.resetUrl}\n\n` +
      "If you did not request this, you can ignore this email.";
    const htmlBody = `
      <h2 style="margin:0 0 12px 0;font-size:20px;">Reset your password</h2>
      <p style="margin:0 0 16px 0;">We received a request to reset the password for your ${brand} account.</p>
      <p style="margin:0 0 24px 0;">This link is valid for 30 minutes.</p>
      <p style="margin:0 0 24px 0;text-align:center;">
        <a href="${vars.resetUrl}" style="display:inline-block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;">Reset password</a>
      </p>
      <p style="margin:0 0 16px 0;font-size:13px;color:#475569;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break:break-all;font-size:13px;color:#475569;margin:0;">${vars.resetUrl}</p>
      <p style="margin:24px 0 0 0;font-size:13px;color:#475569;">If you did not request this, you can ignore this email.</p>
    `;
    return { subject, text, html: wrapHtml(htmlBody) };
  }

  if (name === "email-verification") {
    const verificationVars = vars as EmailVerificationTemplateVars;
    if (!verificationVars?.code) {
      throw new Error("Missing code for email-verification template");
    }
    const expiresIn =
      verificationVars.expiresInMinutes != null
        ? `${verificationVars.expiresInMinutes} minutes`
        : "a limited time";
    const subject = `Verify your ${brand} email`;
    const text =
      `Use this code to verify your ${brand} email address:\n\n` +
      `${verificationVars.code}\n\n` +
      `This code is valid for ${expiresIn}. If you did not request this, you can ignore this email.`;
    const htmlBody = `
      <h2 style="margin:0 0 12px 0;font-size:20px;">Verify your email</h2>
      <p style="margin:0 0 16px 0;">Enter this code to verify your email address.</p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background:#f1f5f9;border-radius:10px;padding:14px 24px;font-size:28px;letter-spacing:6px;font-weight:700;color:${PRIMARY_COLOR};">
          ${verificationVars.code}
        </div>
      </div>
      <p style="margin:0 0 16px 0;font-size:13px;color:#475569;">This code is valid for ${expiresIn}.</p>
      <p style="margin:0;font-size:13px;color:#475569;">If you did not request this, you can ignore this email.</p>
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
