import Meet from "../types/MeetModel";

export const getCardRangeLabel = (meet: Meet): string => {
  // If we don't have a start time we know nothing
  if (!meet.startTime) return "TBC";

  const startTime = new Date(meet.startTime);
  const endTime = meet.endTime ? new Date(meet.endTime) : startTime;

  // If we don't have an end time just return the date and start time
  if (!meet.endTime || endTime <= startTime)
    return `${numericDate(startTime)} • ${timeString(startTime)}`;

  // Single day meet just show the numeric date and start time - end time
  const days = calenderDayCount(startTime, endTime);
  if (days <= 1)
    return `${numericDate(startTime)} • ${timeString(startTime)} — ${timeString(endTime)}`;

  // Multi-day meet, show the short start and end dates
  return `${numericDate(startTime)} — ${numericDate(endTime)}`;
};

export const getMeetDateLabel = (meet: Meet): string => {
  // If we don't have a start time we know nothing
  if (!meet.startTime || meet.startTimeTbc) return "TBC";

  const startDate = new Date(meet.startTime);
  const endDate = meet.endTime ? new Date(meet.endTime) : startDate;

  // If we don't have an end time just return the start time
  if (!meet.endTime || endDate < startDate) return longDate(startDate);

  // Single day meet just show the long date
  const days = calenderDayCount(startDate, endDate);
  if (days <= 1) return longDate(startDate);

  // Multi-day meet, show the short start and end dates with a duration
  const duration = days > 2 ? ` (${days} days)` : ` (Overnight)`;
  return `${shortDate(startDate)} — ${shortDate(endDate)}${duration}`;
};

export const getMeetTimeLabel = (meet: Meet): string => {
  // If we don't have a star time, we know nothing
  if (!meet.startTime || meet.startTimeTbc) {
    return "TBC";
  }

  const meetStartTime = new Date(meet.startTime);
  const meetEndTime = meet.endTime ? new Date(meet.endTime) : meetStartTime;

  const days = calenderDayCount(meetStartTime, meetEndTime);
  const hours = hourDifference(meetStartTime, meetEndTime);

  // If there is specifically an end time on multi-day meet, then we show it
  if (!meet.endTimeTbc && days > 1) {
    return `${shortDateNoYear(meetStartTime)} ${timeString(meetStartTime)} - ${shortDateNoYear(meetEndTime)} ${timeString(meetEndTime)} (${days > 2 ? `${days} days` : "Overnight"})`;
  }

  // If not just show the duration of the multi-day meet
  if (days > 1) return days > 2 ? `${days} days` : "Overnight";

  // If end time is not confirmed yet, just show the start time
  if (meet.endTimeTbc) return timeString(meetStartTime);

  // If the times are the same, just show the start time
  if (meetStartTime.getTime() === meetEndTime.getTime())
    return timeString(meetStartTime);

  return `${timeString(meetStartTime)} - ${timeString(meetEndTime)} (${hours} hours)`;
};

export const getLocationLabel = (meet: Meet): string => {
  const locationLabel = trimLocationOrTBC(meet.location);

  // If there is no location, then we really know nothing so just return TBC
  if (locationLabel === "TBC") return "TBC";

  // If there is no start time, just return the location
  if (!meet.startTime || meet.startTimeTbc) return locationLabel;

  // If the meet time label is single time HH:MM, then we just return the location or TBC
  if (meet.endTimeTbc || !meet.endTime) return locationLabel;

  // Otherwise we have a valid time range or multi-day so show location with time
  return `${locationLabel} at ${timeString(new Date(meet.startTime))}`;
};

function calenderDayCount(startTime: Date, endTime: Date): number {
  const startDate = new Date(
    Date.UTC(
      startTime.getFullYear(),
      startTime.getMonth(),
      startTime.getDate(),
    ),
  );
  const endDate = new Date(
    Date.UTC(endTime.getFullYear(), endTime.getMonth(), endTime.getDate()),
  );
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function hourDifference(startTime: Date, endTime: Date): number {
  const diffTime = endTime.getTime() - startTime.getTime();
  return Math.round(diffTime / (1000 * 60 * 60));
}

function numericDate(date: Date): string {
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function shortDateNoYear(date: Date): string {
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function shortDate(date: Date): string {
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function longDate(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeString(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function trimLocationOrTBC(location: string | null): string {
  return location ? location.trim() : "TBC";
}
