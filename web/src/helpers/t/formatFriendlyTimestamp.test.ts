import { describe, expect, it, vi, afterEach } from "vitest";
import formatFriendlyTimestamp, {
  shortTimestamp,
  formatFriendlyDuration,
  formatShortDuration,
} from "../formatFriendlyTimestamp";

const timeLabel = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

describe("formatFriendlyTimestamp", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for invalid input", () => {
    expect(formatFriendlyTimestamp(undefined)).toBe("");
    expect(formatFriendlyTimestamp("not-a-date")).toBe("");
  });

  it("formats today timestamps", () => {
    const now = new Date(2021, 1, 10, 8, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const input = new Date(2021, 1, 10, 8, 0, 0);
    expect(formatFriendlyTimestamp(input)).toBe(`Today, ${timeLabel(input)}`);
  });

  it("formats yesterday and tomorrow timestamps", () => {
    const now = new Date(2021, 1, 10, 8, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const yesterday = new Date(2021, 1, 9, 8, 0, 0);
    const tomorrow = new Date(2021, 1, 11, 8, 0, 0);
    expect(formatFriendlyTimestamp(yesterday)).toBe(
      `Yesterday, ${timeLabel(yesterday)}`
    );
    expect(formatFriendlyTimestamp(tomorrow)).toBe(
      `Tomorrow, ${timeLabel(tomorrow)}`
    );
  });

  it("formats other dates with weekday and month", () => {
    const now = new Date(2021, 1, 10, 8, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const input = new Date(2021, 1, 8, 8, 0, 0);
    const dateLabel = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(input);
    expect(formatFriendlyTimestamp(input)).toBe(
      `${dateLabel} ${timeLabel(input)}`
    );
  });

  it("formats short timestamps", () => {
    const input = new Date(2025, 10, 28, 8, 0, 0);
    expect(shortTimestamp(input)).toBe("2025-11-28 08:00");
  });

  it("formats friendly durations", () => {
    expect(formatFriendlyDuration(3 * 60)).toBe("3 minutes");
    expect(formatFriendlyDuration(6 * 60 * 60)).toBe("6 hours");
    expect(formatFriendlyDuration(24 * 60 * 60)).toBe("1 day");
  });

  it("formats short durations", () => {
    expect(formatShortDuration(3 * 60 * 60 + 26 * 60)).toBe("3h26m");
    expect(formatShortDuration(30 * 60)).toBe("30m");
    expect(formatShortDuration(2 * 60 * 60)).toBe("2h");
  });
});
