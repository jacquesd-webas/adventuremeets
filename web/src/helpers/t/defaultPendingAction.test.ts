import { describe, expect, it, vi } from "vitest";
import { defaultPendingAction } from "../defaultPendingAction";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { MeetActionsEnum } from "../../types/MeetActionsEnum";

describe("defaultPendingAction", () => {
  it("defaults closed meets on the same day to check-in for managers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T08:00:00.000Z"));

    expect(
      defaultPendingAction(
        MeetStatusEnum.Closed,
        true,
        { startTime: "2026-05-01T18:00:00.000Z" },
        { canManageMeet: true },
      ),
    ).toBe(MeetActionsEnum.Checkin);

    vi.useRealTimers();
  });

  it("defaults closed meets after the meet day to check-in for managers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-02T08:00:00.000Z"));

    expect(
      defaultPendingAction(
        MeetStatusEnum.Closed,
        true,
        { startTime: "2026-05-01T18:00:00.000Z" },
        { canManageMeet: true },
      ),
    ).toBe(MeetActionsEnum.Checkin);

    vi.useRealTimers();
  });

  it("defaults closed meets before the meet day to attendees for organisers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T08:00:00.000Z"));

    expect(
      defaultPendingAction(
        MeetStatusEnum.Closed,
        true,
        { startTime: "2026-05-02T18:00:00.000Z" },
        { canManageMeet: true },
      ),
    ).toBe(MeetActionsEnum.Attendees);

    vi.useRealTimers();
  });

  it("defaults completed meets to details", () => {
    expect(
      defaultPendingAction(
        MeetStatusEnum.Completed,
        true,
        { startTime: "2026-05-01T18:00:00.000Z" },
        { canManageMeet: true },
      ),
    ).toBe(MeetActionsEnum.Details);
  });
});
