import type { Attendee } from "../types/AttendeeModel";

export type CachedAttendeeFilter = "all" | "accepted";

export type CheckinQueueEntry = {
  meetId: string;
  attendeeId: string;
  status: string;
  updatedAt: string;
  failedAt?: string;
  lastError?: string;
};

type CachedAttendeeEntry = {
  attendees: Attendee[];
  updatedAt: string;
};

const CHECKIN_QUEUE_KEY = "checkin-offline-queue";
const CHECKIN_ATTENDEES_KEY = "checkin-offline-attendees";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures and continue with in-memory UI state.
  }
}

function buildAttendeeCacheKey(meetId: string, filter: CachedAttendeeFilter) {
  return `${meetId}:${filter}`;
}

export function listCheckinQueue(meetId?: string | null) {
  const queue = readJson<CheckinQueueEntry[]>(CHECKIN_QUEUE_KEY, []);
  if (!meetId) return queue;
  return queue.filter((entry) => entry.meetId === meetId);
}

export function upsertCheckinQueueEntry(entry: CheckinQueueEntry) {
  const queue = readJson<CheckinQueueEntry[]>(CHECKIN_QUEUE_KEY, []);
  const nextQueue = queue.filter(
    (item) =>
      !(
        item.meetId === entry.meetId && item.attendeeId === entry.attendeeId
      ),
  );
  nextQueue.push(entry);
  writeJson(CHECKIN_QUEUE_KEY, nextQueue);
  return nextQueue;
}

export function acknowledgeCheckinQueueEntry(entry: CheckinQueueEntry) {
  const queue = readJson<CheckinQueueEntry[]>(CHECKIN_QUEUE_KEY, []);
  const nextQueue = queue.filter(
    (item) =>
      !(
        item.meetId === entry.meetId &&
        item.attendeeId === entry.attendeeId &&
        item.updatedAt === entry.updatedAt &&
        item.status === entry.status
      ),
  );
  writeJson(CHECKIN_QUEUE_KEY, nextQueue);
  return nextQueue;
}

export function markCheckinQueueEntryFailed(
  entry: CheckinQueueEntry,
  message: string,
) {
  const queue = readJson<CheckinQueueEntry[]>(CHECKIN_QUEUE_KEY, []);
  const nextQueue = queue.map((item) => {
    if (
      item.meetId !== entry.meetId ||
      item.attendeeId !== entry.attendeeId ||
      item.updatedAt !== entry.updatedAt ||
      item.status !== entry.status
    ) {
      return item;
    }
    return {
      ...item,
      failedAt: new Date().toISOString(),
      lastError: message,
    };
  });
  writeJson(CHECKIN_QUEUE_KEY, nextQueue);
  return nextQueue;
}

export function getCachedMeetAttendees(
  meetId: string,
  filter: CachedAttendeeFilter,
) {
  const cache = readJson<Record<string, CachedAttendeeEntry>>(
    CHECKIN_ATTENDEES_KEY,
    {},
  );
  return cache[buildAttendeeCacheKey(meetId, filter)]?.attendees ?? [];
}

export function setCachedMeetAttendees(
  meetId: string,
  filter: CachedAttendeeFilter,
  attendees: Attendee[],
) {
  const cache = readJson<Record<string, CachedAttendeeEntry>>(
    CHECKIN_ATTENDEES_KEY,
    {},
  );
  cache[buildAttendeeCacheKey(meetId, filter)] = {
    attendees,
    updatedAt: new Date().toISOString(),
  };
  writeJson(CHECKIN_ATTENDEES_KEY, cache);
}
