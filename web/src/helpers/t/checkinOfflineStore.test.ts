import { beforeEach, describe, expect, it } from "vitest";
import type { Attendee } from "../../types/AttendeeModel";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";
import {
  acknowledgeCheckinQueueEntry,
  getCachedMeetAttendees,
  listCheckinQueue,
  markCheckinQueueEntryFailed,
  setCachedMeetAttendees,
  upsertCheckinQueueEntry,
} from "../checkinOfflineStore";

const attendee: Attendee = {
  id: "attendee-1",
  meetId: "meet-1",
  status: AttendeeStatusEnum.Confirmed,
  sequence: 1,
  respondedAt: "2026-04-13T10:00:00.000Z",
  name: "Sam Trail",
  guests: 0,
  indemnityAccepted: false,
  createdAt: "2026-04-13T10:00:00.000Z",
  updatedAt: "2026-04-13T10:00:00.000Z",
  metaValues: [],
};

describe("checkinOfflineStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps only the latest queued action per attendee", () => {
    upsertCheckinQueueEntry({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      status: AttendeeStatusEnum.CheckedIn,
      updatedAt: "2026-04-13T10:00:00.000Z",
    });

    upsertCheckinQueueEntry({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      status: AttendeeStatusEnum.Confirmed,
      updatedAt: "2026-04-13T10:05:00.000Z",
    });

    expect(listCheckinQueue("meet-1")).toEqual([
      {
        meetId: "meet-1",
        attendeeId: "attendee-1",
        status: AttendeeStatusEnum.Confirmed,
        updatedAt: "2026-04-13T10:05:00.000Z",
      },
    ]);
  });

  it("only acknowledges the exact flushed queue entry", () => {
    upsertCheckinQueueEntry({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      status: AttendeeStatusEnum.CheckedIn,
      updatedAt: "2026-04-13T10:00:00.000Z",
    });

    upsertCheckinQueueEntry({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      status: AttendeeStatusEnum.Confirmed,
      updatedAt: "2026-04-13T10:05:00.000Z",
    });

    acknowledgeCheckinQueueEntry({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      status: AttendeeStatusEnum.CheckedIn,
      updatedAt: "2026-04-13T10:00:00.000Z",
    });

    expect(listCheckinQueue("meet-1")).toHaveLength(1);
    expect(listCheckinQueue("meet-1")[0]?.status).toBe(
      AttendeeStatusEnum.Confirmed,
    );
  });

  it("marks failed entries without losing them", () => {
    upsertCheckinQueueEntry({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      status: AttendeeStatusEnum.CheckedIn,
      updatedAt: "2026-04-13T10:00:00.000Z",
    });

    markCheckinQueueEntryFailed(
      {
        meetId: "meet-1",
        attendeeId: "attendee-1",
        status: AttendeeStatusEnum.CheckedIn,
        updatedAt: "2026-04-13T10:00:00.000Z",
      },
      "Conflict",
    );

    const [entry] = listCheckinQueue("meet-1");
    expect(entry?.lastError).toBe("Conflict");
    expect(entry?.failedAt).toBeTruthy();
  });

  it("stores cached attendees by meet and filter", () => {
    setCachedMeetAttendees("meet-1", "accepted", [attendee]);
    setCachedMeetAttendees("meet-1", "all", [
      { ...attendee, id: "attendee-2" },
    ]);

    expect(getCachedMeetAttendees("meet-1", "accepted")).toEqual([attendee]);
    expect(getCachedMeetAttendees("meet-1", "all")).toHaveLength(1);
    expect(getCachedMeetAttendees("meet-2", "accepted")).toEqual([]);
  });
});
