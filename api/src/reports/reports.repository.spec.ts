import knex, { Knex } from "knex";
import { ReportsRepository } from "./reports.repository";
import { DatabaseService } from "../database/database.service";
import { ReportQueryDto } from "./dto/report-query.dto";

describe("ReportsRepository queries", () => {
  let client: Knex;
  let queries: Knex.Sql[];
  let repository: ReportsRepository;

  beforeEach(() => {
    client = knex({ client: "pg" });
    queries = [];
    // Compile real Knex SQL without connecting to a database.
    jest.spyOn(client.client, "runner").mockImplementation((builder) => ({
      run: async () => {
        const query = (builder as Knex.QueryBuilder).toSQL();
        queries.push(query);
        return query.method === "first" ? { total: "4" } : [];
      },
    }) as ReturnType<typeof client.client.runner>);
    repository = new ReportsRepository({ getClient: () => client } as DatabaseService);
  });

  afterEach(async () => { await client.destroy(); });

  it("scopes attendee rows and totals, uses the full end day, and paginates", async () => {
    const filters = Object.assign(new ReportQueryDto(), {
      organizationId: "org-a", type: "attendees", startDate: "2026-09-01",
      endDate: "2026-09-15", search: "Alice%", status: "attended", page: 2, limit: 25,
    });
    const result = await repository.findReport(filters);
    expect(result.total).toBe(4);
    expect(queries).toHaveLength(2);
    for (const query of queries) {
      expect(query.sql).toContain('"m"."organization_id" = ?');
      expect(query.sql).toContain('"m"."start_time" < ?');
      expect(query.bindings).toEqual(expect.arrayContaining(["org-a", "2026-09-01T00:00:00Z", "2026-09-16T00:00:00.000Z", "attended", "%Alice\\%%"]));
    }
    expect(queries[1].sql).toContain("limit ? offset ?");
    expect(queries[1].bindings.slice(-2)).toEqual([25, 25]);
  });

  it("retains meets with no attendees and separates registrations from attendance", async () => {
    await repository.findReport(Object.assign(new ReportQueryDto(), { organizationId: "org-a", type: "meets" }));
    const query = queries[1];
    expect(query.sql).toContain("left join (select");
    expect(query.sql).toContain("count(*) filter (where status <> ?)::int as applied");
    expect(query.sql).toContain("count(*) filter (where status in (?, ?))::int as attended");
    expect(query.sql).toContain("coalesce(counts.applied, 0)");
    expect(query.sql).toContain("coalesce(counts.attended, 0)");
    expect(query.bindings).toEqual(expect.arrayContaining(["org-a", "invited", "checked-in", "attended"]));
  });
});
