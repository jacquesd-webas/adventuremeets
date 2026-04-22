export type EmailTemplateName =
  | "password-reset"
  | "password-reset-confirmation"
  | "meet-signup"
  | "verify-email"
  | "meet-confirm"
  | "meet-reconfirm"
  | "meet-reject"
  | "meet-waitlist"
  | "meet-message"
  | "organization-invite";

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
  messageBody?: string;
};

export type MeetMessageTemplateVars = {
  meetName: string;
  attendeeName?: string;
  statusUrl?: string;
  includeStatusUrl?: boolean;
  organizerName?: string;
  organizerEmail?: string;
  messageBody: string;
};

export type OrganizationInviteTemplateVars = {
  organizationName: string;
  registerUrl?: string;
  expiresAt?: string;
};

export type MeetTemplateContextVars = {
  meetName?: string;
  attendeeName?: string;
  statusUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  location?: string;
  messageBody?: string;
};

export type MeetTemplateContextOptions = {
  includeStatusUrl?: boolean;
  getDefaultMessageBody?: () => string;
};

export const BRAND_NAME = "AdventureMeets";
export const SUPPORT_EMAIL = "support@fringecoding.com";
export const PRIMARY_COLOR = "#0f172a";
export const SECONDARY_COLOR = "#475569";
export const FROM_NAME = "AdventureMeets";

export const baseVarsMap = {
  brand: BRAND_NAME,
  supportEmail: SUPPORT_EMAIL,
  primaryColor: PRIMARY_COLOR,
  secondaryColor: SECONDARY_COLOR,
  fromName: FROM_NAME,
};

export const ALWAYS_ESCAPE = [
  "attendeeName",
  "meetName",
  "organizerName",
  "organizationName",
  "locationLine",
  "timeLine",
  "startTime",
  "startDate",
  "messageBody",
] as const;
