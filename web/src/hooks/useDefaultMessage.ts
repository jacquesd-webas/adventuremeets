import { useMemo } from "react";

type DefaultMessageOptions = {
  meetName?: string;
  confirmMessage?: string;
  waitlistMessage?: string;
  rejectMessage?: string;
};

const createMessageContent = (status: string) => {
  if (status === "confirmed") {
    return "Your attendance has been confirmed for the meet. Looking forward to seeing you there!";
  } else if (status === "waitlisted") {
    return "You have been waitlisted for the meet. If a spot opens up, the organizer will notify you.";
  } else if (status === "rejected") {
    return "Unfortunately, the meet organizer has not been able to accept your application. This is usually due to capacity limits being reached.";
  }
  return "";
};

export function useDefaultMessage(
  status?: string | null,
  options?: DefaultMessageOptions
) {
  return useMemo(() => {
    if (!status) {
      return { subject: "", content: "" };
    }

    if (status === "confirmed") {
      return {
        subject: options?.meetName
          ? `Confirmed: ${options.meetName}`
          : "Meet attendance confirmed",
        content: options?.confirmMessage || createMessageContent(status),
      };
    }
    if (status === "waitlisted") {
      return {
        subject: options?.meetName
          ? `Waitlist: ${options.meetName}`
          : "Meet attendance waitlisted",
        content: options?.waitlistMessage || createMessageContent(status),
      };
    }
    if (status === "rejected") {
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
