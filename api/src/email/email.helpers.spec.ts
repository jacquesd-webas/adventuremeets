import {
  escapeAllHtml,
  escapeHtml,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatTime,
  parseDateTime,
} from "./email.helpers";

describe("email.helpers", () => {
  describe("parseDateTime", () => {
    it("returns a Date for valid values", () => {
      const parsed = parseDateTime("2026-10-14T06:00:00.000Z");

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.toISOString()).toBe("2026-10-14T06:00:00.000Z");
    });

    it("returns null for empty or invalid values", () => {
      expect(parseDateTime()).toBeNull();
      expect(parseDateTime("not-a-date")).toBeNull();
    });
  });

  describe("date formatting", () => {
    it("formats the date, time and datetime in the expected display format", () => {
      const value = "2026-10-14T06:00:00.000Z";

      expect(formatDate(value, "Africa/Johannesburg")).toBe(
        "Wednesday, 14 October",
      );
      expect(formatTime(value, "Africa/Johannesburg")).toBe("08:00");
      expect(formatDateTime(value, "Africa/Johannesburg")).toBe(
        "Wednesday, 14 October 08:00",
      );
    });

    it("falls back to the original value when formatting invalid input", () => {
      expect(formatDate("bad-date")).toBe("bad-date");
      expect(formatTime("bad-date")).toBe("bad-date");
      expect(formatDateTime("bad-date")).toBe("bad-date");
    });
  });

  describe("formatDateRange", () => {
    it("returns TBC when there is no valid start time", () => {
      expect(formatDateRange()).toBe("TBC");
      expect(formatDateRange("bad-date")).toBe("bad-date");
    });

    it("formats a same-day range using a single date and two times", () => {
      expect(
        formatDateRange(
          "2026-10-14T06:00:00.000Z",
          "2026-10-14T10:30:00.000Z",
          "Africa/Johannesburg",
        ),
      ).toBe("Wednesday, 14 October 08:00 to 12:30");
    });

    it("formats a cross-day range using full datetimes", () => {
      expect(
        formatDateRange(
          "2026-10-14T22:00:00.000Z",
          "2026-10-15T04:30:00.000Z",
          "UTC",
        ),
      ).toBe("Wednesday, 14 October 22:00 to Thursday, 15 October 04:30");
    });
  });

  describe("escaping", () => {
    it("escapes html-sensitive characters", () => {
      expect(escapeHtml(`A&B <tag> "quoted" 'single'`)).toBe(
        "A&amp;B &lt;tag&gt; &quot;quoted&quot; &#39;single&#39;",
      );
    });

    it("escapes only the known ALWAYS_ESCAPE fields", () => {
      const original = {
        attendeeName: `Alex & "Sam"`,
        meetName: "<River Run>",
        statusUrl: "https://app.example.com/a?x=1&y=2",
        organizerEmail: "taylor@example.com",
        messageBody: "Bring <headlamp>",
      };

      const escaped = escapeAllHtml(original);

      expect(escaped).toEqual({
        attendeeName: "Alex &amp; &quot;Sam&quot;",
        meetName: "&lt;River Run&gt;",
        statusUrl: "https://app.example.com/a?x=1&y=2",
        organizerEmail: "taylor@example.com",
        messageBody: "Bring &lt;headlamp&gt;",
      });
      expect(original.attendeeName).toBe(`Alex & "Sam"`);
      expect(original.meetName).toBe("<River Run>");
    });
  });
});
