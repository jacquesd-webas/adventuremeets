import {
  getCardRangeLabel,
  getLocationLabel,
  getMeetDateLabel,
  getMeetTimeLabel,
} from "../meetTime";
import Meet from "../../types/MeetModel";

const baseMeet = (overrides: Partial<Meet> = {}): Meet => ({
  id: "meet-1",
  name: "Test Meet",
  organizerId: "org-1",
  ...overrides,
});

describe("meetTime helpers", () => {
  describe("getCardRangeLabel", () => {
    it("returns TBC when start time is missing", () => {
      expect(getCardRangeLabel(baseMeet())).toBe("TBC");
    });

    it("returns date and start time when end time is missing", () => {
      const label = getCardRangeLabel(
        baseMeet({ startTime: "2026-02-03T09:00:00.000Z" })
      );
      expect(label).toContain("•");
      expect(label).toContain("2026");
    });

    it("returns date with start and end time for same-day meets", () => {
      const label = getCardRangeLabel(
        baseMeet({
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-03T11:00:00.000Z",
        })
      );
      expect(label).toContain("•");
      expect(label).toContain("—");
    });

    it("returns date range for multi-day meets", () => {
      const label = getCardRangeLabel(
        baseMeet({
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-05T11:00:00.000Z",
        })
      );
      expect(label).toContain("—");
      expect(label).not.toContain("•");
    });

    it("handles invalid timestamps", () => {
      const label = getCardRangeLabel(baseMeet({ startTime: "not-a-date" }));
      expect(label).toContain("Invalid Date");
    });
  });

  describe("getMeetDateLabel", () => {
    it("returns TBC when start time is missing", () => {
      expect(getMeetDateLabel(baseMeet())).toBe("TBC");
    });

    it("returns a long date when start time exists", () => {
      const label = getMeetDateLabel(
        baseMeet({ startTime: "2026-02-03T09:00:00.000Z" })
      );
      expect(label).toContain("2026");
    });

    it("returns a long date when end is before start", () => {
      const label = getMeetDateLabel(
        baseMeet({
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-02T11:00:00.000Z",
        })
      );
      expect(label).toContain("2026");
      expect(label).not.toContain("Overnight");
    });

    it("handles invalid timestamps", () => {
      const label = getMeetDateLabel(baseMeet({ startTime: "bad" }));
      expect(label).toContain("Invalid Date");
    });
  });

  describe("getMeetTimeLabel", () => {
    it("returns TBC when start time is missing", () => {
      expect(getMeetTimeLabel(baseMeet())).toBe("TBC");
    });

    it("returns TBC when start time is marked TBC", () => {
      expect(
        getMeetTimeLabel(
          baseMeet({
            startTime: "2026-02-03T09:00:00.000Z",
            startTimeTbc: true,
          })
        )
      ).toBe("TBC");
    });

    it("returns start-end with hours for same-day meets", () => {
      const label = getMeetTimeLabel(
        baseMeet({
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-03T11:00:00.000Z",
        })
      );
      expect(label).toContain(" - ");
      expect(label).toContain("(2 hours)");
    });

    it("returns only start time when end time is TBC on same day", () => {
      const label = getMeetTimeLabel(
        baseMeet({
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-03T11:00:00.000Z",
          endTimeTbc: true,
        })
      );
      expect(label).not.toContain(" - ");
      expect(label).not.toContain("hours");
    });

    it("returns Overnight for multi-day meets with end time TBC", () => {
      const label = getMeetTimeLabel(
        baseMeet({
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-04T11:00:00.000Z",
          endTimeTbc: true,
        })
      );
      expect(label).toBe("Overnight");
    });

    it("returns explicit multi-day range when end time is confirmed", () => {
      const label = getMeetTimeLabel(
        baseMeet({
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-05T11:00:00.000Z",
          endTimeTbc: false,
        })
      );
      expect(label).toContain(" - ");
      expect(label).toContain("days");
    });

    it("handles missing end time edge case", () => {
      const label = getMeetTimeLabel(
        baseMeet({
          startTime: "2026-02-03T09:00:00.000Z",
        })
      );
      expect(label).not.toContain("hours");
      expect(label).not.toContain(" - ");
    });
  });

  describe("getLocationLabel", () => {
    it("returns TBC when location is empty", () => {
      expect(
        getLocationLabel(
          baseMeet({
            startTime: "2026-02-03T09:00:00.000Z",
            location: "",
          })
        )
      ).toBe("TBC");
    });

    it("returns trimmed location when start time is TBC", () => {
      expect(
        getLocationLabel(
          baseMeet({
            location: "  Riverside Camp  ",
            startTimeTbc: true,
          })
        )
      ).toBe("Riverside Camp");
    });

    it("returns location only when meet time label is a single time", () => {
      const label = getLocationLabel(
        baseMeet({
          location: "Old Cave",
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-03T11:00:00.000Z",
          endTimeTbc: true,
        })
      );
      expect(label).toBe("Old Cave");
    });

    it("returns location with start time when range/duration exists", () => {
      const label = getLocationLabel(
        baseMeet({
          location: "Old Cave",
          startTime: "2026-02-03T09:00:00.000Z",
          endTime: "2026-02-03T11:00:00.000Z",
        })
      );
      expect(label).toContain("Old Cave at ");
    });

    it("handles invalid start time without throwing", () => {
      const label = getLocationLabel(
        baseMeet({
          location: "Old Cave",
          startTime: "invalid",
        })
      );
      expect(label).toContain("at");
    });
  });
});
