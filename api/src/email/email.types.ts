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
  | "organization-invite"
  | "organiser-reminder-responses-needed"
  | "organizer-reminder-checkin-needed";

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
  logoUrl?: string;
  isRsvpMode?: boolean;
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
  logoUrl?: string;
  isRsvpMode?: boolean;
};

export type MeetMessageTemplateVars = {
  meetName: string;
  attendeeName?: string;
  statusUrl?: string;
  includeStatusUrl?: boolean;
  isGroupedMessage?: boolean;
  organizerName?: string;
  organizerEmail?: string;
  messageBody: string;
  logoUrl?: string;
  isRsvpMode?: boolean;
};

export type OrganizationInviteTemplateVars = {
  organizationName: string;
  registerUrl?: string;
  expiresAt?: string;
  logoUrl?: string;
};

export type OrganiserReminderResponsesNeededTemplateVars = {
  meetName: string;
  organizerName?: string;
  meetUrl?: string;
  responseCount: number;
  logoUrl?: string;
};

export type OrganizerReminderCheckinNeededTemplateVars = {
  meetName: string;
  organizerName?: string;
  checkinUrl?: string;
  logoUrl?: string;
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
  isRsvpMode?: boolean;
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
