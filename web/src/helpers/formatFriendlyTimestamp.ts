type FriendlyTimestampInput = string | number | Date | null | undefined;

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function formatFriendlyTimestamp(input: FriendlyTimestampInput) {
  if (!input) return "";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = startOfDay(now);
  const targetDay = startOfDay(date);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const timeLabel = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (sameDay(targetDay, today)) {
    return `Today, ${timeLabel}`;
  }
  if (sameDay(targetDay, yesterday)) {
    return `Yesterday, ${timeLabel}`;
  }
  if (sameDay(targetDay, tomorrow)) {
    return `Tomorrow, ${timeLabel}`;
  }

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
  return `${dateLabel} ${timeLabel}`;
}

export function shortTimestamp(input: FriendlyTimestampInput) {
  if (!input) return "";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const dateLabel = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const timeLabel = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateLabel} ${timeLabel}`;
}

export function formatFriendlyDuration(totalSeconds?: number | null) {
  if (typeof totalSeconds !== "number" || Number.isNaN(totalSeconds)) return "";
  const absSeconds = Math.abs(Math.round(totalSeconds));
  const totalMinutes = Math.round(absSeconds / 60);
  if (totalMinutes < 60) {
    const minutes = Math.max(1, totalMinutes);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  const totalHours = Math.round(totalMinutes / 60);
  if (totalHours < 24) {
    return `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
  }
  const totalDays = Math.round(totalHours / 24);
  return `${totalDays} ${totalDays === 1 ? "day" : "days"}`;
}

export function formatShortDuration(totalSeconds?: number | null) {
  if (typeof totalSeconds !== "number" || Number.isNaN(totalSeconds)) return "";
  const absSeconds = Math.abs(Math.round(totalSeconds));
  const totalMinutes = Math.round(absSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${minutes}m`;
}
