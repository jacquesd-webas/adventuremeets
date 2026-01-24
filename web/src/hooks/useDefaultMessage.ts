import { useMemo } from "react";
import { AttendeeStatusEnum } from "../types/AttendeeStatusEnum";

type DefaultMessageOptions = {
  meetName?: string;
  confirmMessage?: string;
  waitlistMessage?: string;
  rejectMessage?: string;
};

const createMessageContent = (status: AttendeeStatusEnum) => {
  if (status === AttendeeStatusEnum.Confirmed) {
    return "Your attendance has been confirmed for the meet. Looking forward to seeing you there!";
  } else if (status === AttendeeStatusEnum.Waitlisted) {
    return "You have been waitlisted for the meet. If a spot opens up, the organizer will notify you.";
  } else if (status === AttendeeStatusEnum.Rejected) {
    return "Unfortunately, the meet organizer has not been able to accept your application. This is usually due to capacity limits being reached.";
  }
  return "";
};

export function useDefaultMessage(
  status?: AttendeeStatusEnum | null,
  options?: DefaultMessageOptions
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
        content: options?.confirmMessage || createMessageContent(status),
      };
    }
    if (status === AttendeeStatusEnum.Waitlisted) {
      return {
        subject: options?.meetName
          ? `Waitlist: ${options.meetName}`
          : "Meet attendance waitlisted",
        content: options?.waitlistMessage || createMessageContent(status),
      };
    }
    if (status === AttendeeStatusEnum.Rejected) {
      return {
        subject: options?.meetName
          ? `Update: ${options.meetName}`
          : "Meet attendance update",
        content: options?.rejectMessage || createMessageContent(status),
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
