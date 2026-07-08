import e from "express";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EmailTemplateName,
  MeetTemplateContextVars,
  MeetTemplateContextOptions,
  baseVarsMap,
} from "./email.types";
import { BRAND_NAME, SUPPORT_EMAIL } from "./email.types";
import {
  PasswordResetTemplateVars,
  MeetSignupTemplateVars,
  VerifyEmailTemplateVars,
  MeetStatusTemplateVars,
  MeetMessageTemplateVars,
  OrganizationInviteTemplateVars,
} from "./email.types";
import {
  escapeHtml,
  escapeAllHtml,
  formatDateRange,
  formatDate,
  formatDateTime,
} from "./email.helpers";

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

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const getDefaultLogoUrl = () =>
  `${getFrontendUrl()}/static/adventuremeets-logo.png`;

const LINKIFY_PATTERN =
  /(\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{6,}\d)/gi;

function formatMessageBodyHtml(value: string) {
  if (!value) return "";
  let html = "";
  let lastIndex = 0;

  for (const match of value.matchAll(LINKIFY_PATTERN)) {
    const matchText = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      html += escapeHtml(value.slice(lastIndex, index));
    }

    const lower = matchText.toLowerCase();

    if (lower.includes("@") && !lower.startsWith("http")) {
      html += `<a href="mailto:${escapeHtml(matchText)}">${escapeHtml(
        matchText,
      )}</a>`;
    } else if (lower.startsWith("http") || lower.startsWith("www.")) {
      const href = lower.startsWith("http")
        ? matchText
        : `https://${matchText}`;
      html += `<a href="${escapeHtml(href)}">${escapeHtml(matchText)}</a>`;
    } else {
      const telValue = matchText.replace(/[^\d+]/g, "");
      html += `<a href="tel:${escapeHtml(telValue)}">${escapeHtml(
        matchText,
      )}</a>`;
    }

    lastIndex = index + matchText.length;
  }

  if (lastIndex < value.length) {
    html += escapeHtml(value.slice(lastIndex));
  }

  return html.replace(/\r\n|\r|\n/g, "<br/>");
}

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

function wrapHtml(content: string, logoUrl?: string) {
  const resolvedLogoUrl = logoUrl || getDefaultLogoUrl();

  const logoBlock = resolvedLogoUrl
    ? `<div style="text-align:center;margin-bottom:24px;">
        <img src="${resolvedLogoUrl}" alt="${BRAND_NAME} logo" style="max-width:180px;height:auto;" />
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

function getMeetResponseWording(isRsvpMode?: boolean) {
  if (isRsvpMode) {
    return {
      signupHeading: "Your RSVP has been received",
      signupAcknowledgement: "You have RSVP'd for {{meetName}}.",
      signupSubject: "You RSVP'd for",
      responseNoun: "RSVP",
      responseNounLower: "rsvp",
      responsePastVerb: "RSVP'd",
      viewStatusLabel: "View your RSVP status:",
      viewLabel: "View your RSVP",
      manageResponseLead:
        "To view or update your RSVP, or provide feedback and upload photos after the meet please use the button below:",
      rejectHeading: "Sorry, your RSVP was not successful",
      rejectSubject: "Update on your RSVP for",
      rejectDefaultMessage:
        "Unfortunately your RSVP for {{meetName}} was not successful. This is usually due to capacity limits being reached.",
    };
  }

  return {
    signupHeading: "You're signed up",
    signupAcknowledgement: "You have applied for {{meetName}}.",
    signupSubject: "You signed up for",
    responseNoun: "application",
    responseNounLower: "application",
    responsePastVerb: "applied",
    viewStatusLabel: "View your application status:",
    viewLabel: "View your application",
    manageResponseLead:
      "To view or make changes to your application, or provide feedback and upload photos after the meet please use the button below:",
    rejectHeading: "Sorry, your application was not successful",
    rejectSubject: "Update on your application for",
    rejectDefaultMessage:
      "Unfortunately your application for {{meetName}} was not successful. This is usually due to capacity limits being reached.",
  };
}

// Overloads for type safety on vars for each template

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
  name: "meet-confirm" | "meet-reconfirm" | "meet-reject" | "meet-waitlist",
  vars: MeetStatusTemplateVars,
): { subject: string; text: string; html: string };

export function renderEmailTemplate(
  name: "meet-message",
  vars: MeetMessageTemplateVars,
): { subject: string; text: string; html: string };

export function renderEmailTemplate(
  name: "organization-invite",
  vars: OrganizationInviteTemplateVars,
): { subject: string; text: string; html: string };

// Main function implementation

export function renderEmailTemplate(
  name: EmailTemplateName,
  vars?:
    | PasswordResetTemplateVars
    | MeetSignupTemplateVars
    | VerifyEmailTemplateVars
    | MeetStatusTemplateVars
    | MeetMessageTemplateVars
    | OrganizationInviteTemplateVars,
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

  // Meet signup template

  if (name === "meet-signup") {
    const signupVars = vars as MeetSignupTemplateVars | undefined;
    if (!signupVars?.meetName) {
      throw new Error("Missing meetName for meet-signup template");
    }
    const varsMap = {
      ...baseVarsMap,
      ...getMeetTemplateContext(signupVars),
    };
    const wording = getMeetResponseWording(signupVars.isRsvpMode);
    const signupAcknowledgement = renderInlineTemplate(
      wording.signupAcknowledgement,
      {
        meetName: varsMap.meetName,
      },
    );
    const signupAcknowledgementHtml = escapeHtml(signupAcknowledgement);
    const subject = `${wording.signupSubject} ${varsMap.meetName}`;
    const flags = {
      ifStatusUrl: Boolean(varsMap.statusUrl),
      ifOrganizerEmail: Boolean(varsMap.organizerEmail),
    };
    const text = renderTemplate(
      "meet-signup",
      "txt",
      { ...varsMap, ...wording, signupAcknowledgement },
      flags,
    );
    const htmlBody = renderTemplate(
      "meet-signup",
      "html",
      {
        ...escapeAllHtml({ ...varsMap, ...wording, signupAcknowledgement }),
        signupAcknowledgementHtml,
      },
      flags,
    );
    return { subject, text, html: wrapHtml(htmlBody, signupVars.logoUrl) };
  }

  // Meet confirmation

  if (name === "meet-confirm") {
    const meetVars = vars as MeetStatusTemplateVars | undefined;
    if (!meetVars?.meetName) {
      throw new Error("Missing meetName for meet-confirm template");
    }
    const varsMap = {
      ...baseVarsMap,
      ...getMeetTemplateContext(meetVars, {
        getDefaultMessageBody: () =>
          "You're confirmed for {{meetName}} on {{startTime}} at {{locationLine}}.",
      }),
    };
    const wording = getMeetResponseWording(meetVars.isRsvpMode);
    const flags = {
      ifStatusUrl: Boolean(varsMap.statusUrl),
      ifOrganizerEmail: Boolean(varsMap.organizerEmail),
    };
    const subject = `You're confirmed for ${varsMap.meetName}`;
    const text = renderTemplate(
      "meet-confirm",
      "txt",
      { ...varsMap, ...wording },
      flags,
    );
    const htmlBody = renderTemplate(
      "meet-confirm",
      "html",
      {
        ...escapeAllHtml({ ...varsMap, ...wording }),
        messageBody: varsMap.messageBodyHtml,
      },
      flags,
    );
    return { subject, text, html: wrapHtml(htmlBody, meetVars.logoUrl) };
  }

  // Meet reconfirm after postponement

  if (name === "meet-reconfirm") {
    const meetVars = vars as MeetStatusTemplateVars | undefined;
    if (!meetVars?.meetName) {
      throw new Error("Missing meetName for meet-reconfirm template");
    }
    const varsMap = {
      ...baseVarsMap,
      ...getMeetTemplateContext(meetVars, {
        getDefaultMessageBody: () =>
          "{{meetName}} has been re-published after being postponed. Please confirm if you would still like to attend on {{startTime}}.",
      }),
    };
    const wording = getMeetResponseWording(meetVars.isRsvpMode);
    const flags = {
      ifStatusUrl: Boolean(varsMap.statusUrl),
      ifOrganizerEmail: Boolean(varsMap.organizerEmail),
    };
    const subject = `Please reconfirm your attendance for ${varsMap.meetName}`;
    const text = renderTemplate(
      "meet-reconfirm",
      "txt",
      { ...varsMap, ...wording },
      flags,
    );
    const htmlBody = renderTemplate(
      "meet-reconfirm",
      "html",
      {
        ...escapeAllHtml({ ...varsMap, ...wording }),
        messageBody: varsMap.messageBodyHtml,
      },
      flags,
    );
    return { subject, text, html: wrapHtml(htmlBody, meetVars.logoUrl) };
  }

  // Meet rejection

  if (name === "meet-reject") {
    const meetVars = vars as MeetStatusTemplateVars | undefined;
    if (!meetVars?.meetName) {
      throw new Error("Missing meetName for meet-reject template");
    }
    const varsMap = {
      ...baseVarsMap,
      ...getMeetTemplateContext(meetVars, {
        getDefaultMessageBody: () =>
          getMeetResponseWording(meetVars.isRsvpMode).rejectDefaultMessage,
      }),
    };
    const wording = getMeetResponseWording(meetVars.isRsvpMode);
    const flags = {
      ifStatusUrl: Boolean(varsMap.statusUrl),
      ifOrganizerEmail: Boolean(varsMap.organizerEmail),
    };
    const subject = `${wording.rejectSubject} ${varsMap.meetName}`;
    const text = renderTemplate(
      "meet-reject",
      "txt",
      { ...varsMap, ...wording },
      flags,
    );
    const htmlBody = renderTemplate(
      "meet-reject",
      "html",
      {
        ...escapeAllHtml({ ...varsMap, ...wording }),
        messageBody: varsMap.messageBodyHtml,
      },
      flags,
    );
    return { subject, text, html: wrapHtml(htmlBody, meetVars.logoUrl) };
  }

  // Meet waitlist

  if (name === "meet-waitlist") {
    const meetVars = vars as MeetStatusTemplateVars | undefined;
    if (!meetVars?.meetName) {
      throw new Error("Missing meetName for meet-waitlist template");
    }
    const varsMap = escapeAllHtml({
      ...baseVarsMap,
      ...getMeetTemplateContext(meetVars, {
        getDefaultMessageBody: () =>
          "You're on the waitlist for {{meetName}}. If a spot opens up, the organiser will notify you. When: {{timeLine}}. Where: {{locationLine}}.",
      }),
    });
    const wording = getMeetResponseWording(meetVars.isRsvpMode);
    const flags = {
      ifStatusUrl: Boolean(varsMap.statusUrl),
      ifOrganizerEmail: Boolean(varsMap.organizerEmail),
    };
    const subject = `You're on the waitlist for ${varsMap.meetName}`;
    const text = renderTemplate(
      "meet-waitlist",
      "txt",
      { ...varsMap, ...wording },
      flags,
    );
    const htmlBody = renderTemplate(
      "meet-waitlist",
      "html",
      {
        ...varsMap,
        ...escapeAllHtml(wording),
        messageBody: varsMap.messageBodyHtml,
      },
      flags,
    );
    return { subject, text, html: wrapHtml(htmlBody, meetVars.logoUrl) };
  }

  // Generic meet message

  if (name === "meet-message") {
    const messageVars = vars as MeetMessageTemplateVars | undefined;
    if (!messageVars?.meetName) {
      throw new Error("Missing meetName for meet-message template");
    }
    const includeStatusUrl = messageVars.includeStatusUrl !== false;
    const wording = getMeetResponseWording(messageVars.isRsvpMode);
    const varsMap = escapeAllHtml({
      ...baseVarsMap,
      ...getMeetTemplateContext(messageVars, {
        includeStatusUrl,
      }),
      ...wording,
    });
    const flags = {
      ifStatusUrl: includeStatusUrl && Boolean(varsMap.statusUrl),
      ifOrganizerEmail: Boolean(varsMap.organizerEmail),
      ifGroupedMessage: Boolean(messageVars.isGroupedMessage),
      ifDirectMessage: !messageVars.isGroupedMessage,
    };
    const subject = `Message about ${varsMap.meetName}`;
    const text = renderTemplate("meet-message", "txt", varsMap, flags);
    const htmlBody = renderTemplate(
      "meet-message",
      "html",
      { ...varsMap, messageBody: varsMap.messageBodyHtml },
      flags,
    );
    return { subject, text, html: wrapHtml(htmlBody, messageVars.logoUrl) };
  }

  // Password reset confirmation (no variables needed)

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

  // Verify email (only specific variables needed)

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

  // Organization invite (specific variables needed)

  if (name === "organization-invite") {
    const inviteVars = vars as OrganizationInviteTemplateVars | undefined;
    if (!inviteVars?.organizationName || !inviteVars?.registerUrl) {
      throw new Error(
        "Missing organizationName or registerUrl for organization-invite template",
      );
    }
    const subject = `You're invited to join ${inviteVars.organizationName}`;
    const varsMap = escapeAllHtml({
      ...baseVarsMap,
      organizationName: inviteVars.organizationName,
      registerUrl: inviteVars.registerUrl || "",
      expiresAt: inviteVars.expiresAt
        ? formatDateTime(inviteVars.expiresAt)
        : "",
    });
    const flags = {
      ifRegisterUrl: Boolean(inviteVars.registerUrl),
      ifExpiresAt: Boolean(inviteVars.expiresAt),
    };
    const text = renderTemplate("organization-invite", "txt", varsMap, flags);
    const htmlBody = renderTemplate(
      "organization-invite",
      "html",
      varsMap,
      flags,
    );
    return { subject, text, html: wrapHtml(htmlBody, inviteVars.logoUrl) };
  }
}

function getMeetTemplateContext(
  vars: MeetTemplateContextVars,
  options: MeetTemplateContextOptions = {},
) {
  const timeLine = formatDateRange(vars.startTime, vars.endTime, vars.timeZone);
  const startTime = formatDateTime(vars.startTime, vars.timeZone);
  const startDate = formatDate(vars.startTime, vars.timeZone);
  const meetName = vars.meetName || "";
  const greetingName = vars.attendeeName || "there";
  const statusUrl =
    options.includeStatusUrl === false ? "" : (vars.statusUrl ?? "");
  const organizerName = vars.organizerName || "the organiser";
  const organizerEmail = vars.organizerEmail || "";
  const locationLine = vars.location || "TBC";
  const messageBodyTemplate =
    vars.messageBody?.trim() || options.getDefaultMessageBody?.() || "";
  const messageBody = renderInlineTemplate(messageBodyTemplate, {
    meetName,
    attendeeName: greetingName,
    statusUrl,
    organizerName,
    organizerEmail,
    timeLine,
    startTime,
    startDate,
    locationLine,
  });

  return {
    meetName,
    attendeeName: greetingName,
    statusUrl,
    organizerName,
    organizerEmail,
    timeLine,
    startTime,
    startDate,
    locationLine,
    messageBody,
    messageBodyText: escapeHtml(messageBody),
    messageBodyHtml: formatMessageBodyHtml(messageBody),
  };
}

function renderInlineTemplate(template: string, vars: Record<string, string>) {
  let output = template;
  Object.entries(vars).forEach(([key, value]) => {
    output = output.split(`{{${key}}}`).join(value);
  });
  return output;
}
