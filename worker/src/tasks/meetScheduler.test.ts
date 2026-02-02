import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const buildMockDb = (pluckResults: string[][]) => {
  const builder: any = {
    where: vi.fn().mockReturnThis(),
    whereNotNull: vi.fn().mockReturnThis(),
    whereIn: vi.fn().mockReturnThis(),
    whereRaw: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    as: vi.fn().mockReturnThis(),
    pluck: vi.fn().mockImplementation(async () => pluckResults.shift() || []),
  };

  const db: any = vi.fn(() => builder);
  db.fn = { now: vi.fn(() => "now") };
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
    const pluckResults = [["m1"], ["m2"], ["m3"], ["m4"]];
    const { db } = buildMockDb(pluckResults);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: vi.fn() });
    (global as any).fetch = fetchMock;

    const { runMeetScheduler } = await import("./meetScheduler");
    await runMeetScheduler();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(db.destroy).toHaveBeenCalledTimes(1);
  });

  it("skips updates when API config is missing", async () => {
    vi.resetModules();
    process.env.API_BASE_URL = "";
    process.env.WORKER_API_KEY = "";
    const { db } = buildMockDb([["m1"], ["m2"], ["m3"], ["m4"]]);
    const knexModule = await import("knex");
    (knexModule.default as any).mockReturnValue(db);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: vi.fn() });
    (global as any).fetch = fetchMock;

    const { runMeetScheduler } = await import("./meetScheduler");
    await runMeetScheduler();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.destroy).toHaveBeenCalledTimes(1);
  });
});
