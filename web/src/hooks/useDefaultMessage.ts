import { useMemo } from "react";
import { AttendeeStatusEnum } from "../types/AttendeeStatusEnum";

type DefaultMessageOptions = {
  meetName?: string;
  confirmMessage?: string;
  waitlistMessage?: string;
  rejectMessage?: string;
};

const createMessageContent = (status: AttendeeStatusEnum) => {
  if (status === AttendeeStatusEnum.Invited) {
    return "You have been invited to join this meet. Please open your meet link to confirm or update your attendance.";
  }
  if (status === AttendeeStatusEnum.Confirmed) {
    return "Your attendance has been confirmed for the meet. Looking forward to seeing you there!";
  }
  if (status === AttendeeStatusEnum.Waitlisted) {
    return "You have been waitlisted for the meet. If a spot opens up, the organiser will notify you.";
  }
  if (status === AttendeeStatusEnum.Rejected) {
    return "Unfortunately, the meet organiser has not been able to accept your application. This is usually due to capacity limits being reached.";
  }
  return "";
};

export function useDefaultMessage(
  status?: AttendeeStatusEnum | null,
  options?: DefaultMessageOptions,
) {
  return useMemo(() => {
    if (!status) {
      return { subject: "", content: "" };
    }

    if (status === AttendeeStatusEnum.Confirmed) {
      return {
        subject: options?.meetName
          ? `Confirmed: ${options.meetName}`
          : "Meet attendance confirmed",
        content:
          options?.confirmMessage?.trim() || createMessageContent(status),
      };
    }
    if (status === AttendeeStatusEnum.Invited) {
      return {
        subject: options?.meetName
          ? `Invitation: ${options.meetName}`
          : "Meet invitation",
        content: createMessageContent(status),
      };
    }
    if (status === AttendeeStatusEnum.Waitlisted) {
      return {
        subject: options?.meetName
          ? `Waitlist: ${options.meetName}`
          : "Meet attendance waitlisted",
        content:
          options?.waitlistMessage?.trim() || createMessageContent(status),
      };
    }
    if (status === AttendeeStatusEnum.Rejected) {
      return {
        subject: options?.meetName
          ? `Update: ${options.meetName}`
          : "Meet attendance update",
        content: options?.rejectMessage?.trim() || createMessageContent(status),
      };
    }

    return { subject: "", content: "" };
  }, [
    status,
    options?.confirmMessage,
    options?.meetName,
    options?.rejectMessage,
    options?.waitlistMessage,
  ]);
}
