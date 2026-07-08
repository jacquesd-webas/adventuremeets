import { ALWAYS_ESCAPE } from "./email.types";

export function parseDateTime(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value?: string, timeZone?: string) {
  const parsed = parseDateTime(value);
  if (parsed) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: timeZone || "UTC",
    }).formatToParts(parsed);
    const weekday = parts.find((part) => part.type === "weekday")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    const month = parts.find((part) => part.type === "month")?.value;

    if (weekday && day && month) {
      return `${weekday}, ${day} ${month}`;
    }

    return parts.map((part) => part.value).join("");
  }
  return value || "";
}

export function formatTime(value?: string, timeZone?: string) {
  const parsed = parseDateTime(value);
  if (parsed) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timeZone || "UTC",
    }).format(parsed);
  }
  return value || "";
}

export function formatDateTime(value?: string, timeZone?: string) {
  const parsed = parseDateTime(value);
  if (parsed) {
    return `${formatDate(value, timeZone)} ${formatTime(value, timeZone)}`;
  }
  return value || "";
}

export function formatDateRange(
  startTime?: string,
  endTime?: string,
  timeZone?: string,
) {
  const start = formatDateTime(startTime, timeZone);
  if (!start) return "TBC";

  const end = formatDateTime(endTime, timeZone);
  if (!end || end === start) {
    return start;
  }

  if (
    parseDateTime(startTime) &&
    parseDateTime(endTime) &&
    formatDate(startTime, timeZone) === formatDate(endTime, timeZone)
  ) {
    return `${formatDate(startTime, timeZone)} ${formatTime(
      startTime,
      timeZone,
    )} to ${formatTime(endTime, timeZone)}`;
  }

  return `${start} to ${end}`;
}

export function escapeAllHtml<T extends Record<string, string>>(vars: T): T {
  const escaped = { ...vars };

  ALWAYS_ESCAPE.forEach((key) => {
    if (key in escaped) {
      escaped[key as keyof T] = escapeHtml(
        escaped[key as keyof T],
      ) as T[keyof T];
    }
  });

  return escaped;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
