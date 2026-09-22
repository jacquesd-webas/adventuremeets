import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const buildMockDb = (pluckResults: string[][]) => {
  const builder: any = {
    where: vi.fn().mockReturnThis(),
    whereIn: vi.fn().mockReturnThis(),
    whereNull: vi.fn().mockReturnThis(),
    whereNotNull: vi.fn().mockReturnThis(),
    whereRaw: vi.fn().mockReturnThis(),
    whereExists: vi.fn().mockReturnThis(),
    whereNotExists: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    join: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    max: vi.fn().mockReturnThis(),
    as: vi.fn().mockReturnThis(),
    orWhereExists: vi.fn().mockReturnThis(),
    orWhere: vi.fn().mockReturnThis(),
    pluck: vi.fn().mockImplementation(async () => pluckResults.shift() || []),
  };

  const db: any = vi.fn(() => builder);
  db.fn = { now: vi.fn(() => "now") };
  db.raw = vi.fn((value: string) => value);
  db.destroy = vi.fn();

  return { db, builder };
};

vi.mock("knex", () => ({
  default: vi.fn(),
}));

describe("runMeetReminderJob", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.API_BASE_URL = "http://api.test";
    process.env.WORKER_API_KEY = "worker-secret";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("sends reminder notifications for meets with new unanswered attendees", async () => {
    vi.resetModules();
    const { db, builder } = buildMockDb([["meet-1", "meet-2"], ["meet-3"]]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn(),
      json: vi.fn().mockResolvedValue({ status: "sent" }),
    });
    (global as any).fetch = fetchMock;

    const { runMeetReminderJob } = await import("./meetReminder");
    const reminded = await runMeetReminderJob();

    expect(reminded).toBe(3);
    expect(builder.where).toHaveBeenCalledWith(
      "nt.name",
      "organiser_reminder_responses_needed",
    );
    expect(builder.where).toHaveBeenCalledWith(
      "nt.name",
      "organizer_reminder_checkin_needed",
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://api.test/api/v1/notifications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          notificationType: "organiser_reminder_responses_needed",
          meetId: "meet-1",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://api.test/api/v1/notifications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          notificationType: "organizer_reminder_checkin_needed",
          meetId: "meet-3",
        }),
      }),
    );
    expect(db.destroy).toHaveBeenCalledTimes(1);
  });

  it("does not call the api when worker config is missing", async () => {
    vi.resetModules();
    process.env.API_BASE_URL = "";
    process.env.WORKER_API_KEY = "";
    const { db } = buildMockDb([["meet-1"], ["meet-2"]]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn(),
      json: vi.fn().mockResolvedValue({ status: "sent" }),
    });
    (global as any).fetch = fetchMock;

    const { runMeetReminderJob } = await import("./meetReminder");
    const reminded = await runMeetReminderJob();

    expect(reminded).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.destroy).toHaveBeenCalledTimes(1);
  });

  it("does not count skipped reminder notifications as sent", async () => {
    vi.resetModules();
    const { db } = buildMockDb([["meet-1"], []]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn(),
      json: vi.fn().mockResolvedValue({ status: "skipped" }),
    });
    (global as any).fetch = fetchMock;

    const { runMeetReminderJob } = await import("./meetReminder");
    const reminded = await runMeetReminderJob();

    expect(reminded).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(db.destroy).toHaveBeenCalledTimes(1);
  });

  it("sends check-in reminders for started meets with zero checked-in attendees", async () => {
    vi.resetModules();
    const { db } = buildMockDb([[], ["meet-9"]]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn(),
      json: vi.fn().mockResolvedValue({ status: "sent" }),
    });
    (global as any).fetch = fetchMock;

    const { runMeetReminderJob } = await import("./meetReminder");
    const reminded = await runMeetReminderJob();

    expect(reminded).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/v1/notifications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          notificationType: "organizer_reminder_checkin_needed",
          meetId: "meet-9",
        }),
      }),
    );
  });
});
