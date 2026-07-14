import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const buildMockDb = (
  selectResults: Array<Array<{ id: string; name: string }>>,
) => {
  const builder: any = {
    where: vi.fn().mockReturnThis(),
    orWhere: vi.fn().mockReturnThis(),
    whereNotNull: vi.fn().mockReturnThis(),
    whereIn: vi.fn().mockReturnThis(),
    whereRaw: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    select: vi.fn().mockImplementation((...args: string[]) => {
      const isTerminalMeetSelect =
        (args[0] === "id" && args[1] === "name") ||
        (args[0] === "m.id" && args[1] === "m.name");

      if (isTerminalMeetSelect) {
        return Promise.resolve(selectResults.shift() || []);
      }

      return builder;
    }),
    count: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    as: vi.fn().mockReturnThis(),
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

describe("runMeetScheduler", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.API_BASE_URL = "http://api.test";
    process.env.WORKER_API_KEY = "secret";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("runs all scheduler steps and calls status updates", async () => {
    vi.resetModules();
    const { db } = buildMockDb([
      [{ id: "m1", name: "Open Soon" }],
      [{ id: "m2", name: "Already Started" }],
      [{ id: "m3", name: "Packed Meet" }],
    ]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: vi.fn() });
    (global as any).fetch = fetchMock;

    const { runMeetScheduler } = await import("./meetScheduler");
    await runMeetScheduler();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://api.test/api/v1/meets/m1/status",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(db.destroy).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate the api version prefix when API_BASE_URL already includes /api/v1", async () => {
    vi.resetModules();
    process.env.API_BASE_URL = "http://api.test/api/v1";
    const { db } = buildMockDb([
      [{ id: "m1", name: "Open Soon" }],
      [],
      [],
    ]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: vi.fn() });
    (global as any).fetch = fetchMock;

    const { runMeetScheduler } = await import("./meetScheduler");
    await runMeetScheduler();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/v1/meets/m1/status",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("skips updates when API config is missing", async () => {
    vi.resetModules();
    process.env.API_BASE_URL = "";
    process.env.WORKER_API_KEY = "";
    const { db } = buildMockDb([
      [{ id: "m1", name: "Open Soon" }],
      [{ id: "m2", name: "Already Started" }],
      [{ id: "m3", name: "Packed Meet" }],
    ]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: vi.fn() });
    (global as any).fetch = fetchMock;

    const { runMeetScheduler } = await import("./meetScheduler");
    await runMeetScheduler();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.destroy).toHaveBeenCalledTimes(1);
  });

  it("closes meets only when confirmed plus waitlisted attendees fill capacity and waitlist", async () => {
    vi.resetModules();
    const { db, builder } = buildMockDb([
      [],
      [],
      [{ id: "m3", name: "Packed Meet" }],
    ]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: vi.fn() });
    (global as any).fetch = fetchMock;

    const { runMeetScheduler } = await import("./meetScheduler");
    await runMeetScheduler();

    expect(builder.where).toHaveBeenCalledWith("m.capacity", ">", 0);
    expect(builder.whereRaw).toHaveBeenCalledWith(
      "coalesce(ma.confirmed_count, 0) + coalesce(ma.waitlist_count, 0) >= m.capacity + m.waitlist_size",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/v1/meets/m3/status",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("closes open meets when either the closing date or start date has passed", async () => {
    vi.resetModules();
    const { db, builder } = buildMockDb([
      [],
      [{ id: "m2", name: "Already Started" }],
      [],
    ]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: vi.fn() });
    (global as any).fetch = fetchMock;

    const { runMeetScheduler } = await import("./meetScheduler");
    await runMeetScheduler();

    const groupedWhereCall = builder.where.mock.calls.find((call: unknown[]) => {
      const [firstArg] = call;
      return typeof firstArg === "function";
    });
    expect(groupedWhereCall).toBeTruthy();

    const nestedBuilder = {
      where: vi.fn().mockReturnThis(),
      orWhere: vi.fn().mockReturnThis(),
    };
    groupedWhereCall?.[0](nestedBuilder);

    expect(nestedBuilder.where).toHaveBeenCalledWith(
      "closing_date",
      "<=",
      "now",
    );
    expect(nestedBuilder.orWhere).toHaveBeenCalledWith(
      "start_time",
      "<=",
      "now",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/v1/meets/m2/status",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });
});
