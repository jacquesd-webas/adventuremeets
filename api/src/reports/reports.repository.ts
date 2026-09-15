import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { ReportQueryDto, ReportResponse, ReportRow } from "./dto/report-query.dto";

@Injectable()
export class ReportsRepository {
  constructor(private readonly db: DatabaseService) {}

  async reportingEnabled(organizationId: string): Promise<boolean> {
    const row = await this.db.getClient()("org_features")
      .where({ organization_id: organizationId }).first("reporting_enabled");
    return Boolean(row?.reporting_enabled);
  }

  async findReport(options: ReportQueryDto): Promise<ReportResponse> {
    const client = this.db.getClient();
    const attendees = options.type === "attendees";
    const query = client("meets as m")
      .where("m.organization_id", options.organizationId);
    if (attendees) {
      query.join("meet_attendees as a", "a.meet_id", "m.id")
        .leftJoin("users as u", "u.id", "a.user_id");
    } else {
      query.leftJoin("users as u", "u.id", "m.organizer_id")
        .join("meet_statuses as s", "s.id", "m.status_id");
    }
    if (options.startDate) query.where("m.start_time", ">=", `${options.startDate}T00:00:00Z`);
    if (options.endDate) {
      const end = new Date(`${options.endDate}T00:00:00Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      query.where("m.start_time", "<", end.toISOString());
    }
    if (options.status) query.where(attendees ? "a.status" : "s.name", options.status);
    if (options.search?.trim()) {
      const pattern = `%${options.search.trim().replace(/[\\%_]/g, "\\$&")}%`;
      query.where(function () {
        this.whereILike("m.name", pattern)
          .orWhereRaw("concat_ws(' ', u.first_name, u.last_name) ilike ?", [pattern]);
        if (attendees) this.orWhereILike("a.name", pattern).orWhereILike("a.email", pattern).orWhereILike("u.email", pattern);
      });
    }
    const count = await query.clone().count({ total: "*" }).first();
    query.select("m.name as meetName", "m.start_time as startTime");
    if (attendees) {
      query.select("a.id", "a.status")
        .select(client.raw("coalesce(nullif(a.name, ''), nullif(concat_ws(' ', u.first_name, u.last_name), ''), 'Unknown attendee') as \"attendeeName\""))
        .select(client.raw("coalesce(a.email, u.email, '') as email"));
    } else {
      const counts = client("meet_attendees").select("meet_id")
        .whereIn("meet_id", client("meets").select("id").where("organization_id", options.organizationId))
        .select(client.raw("count(*) filter (where status <> ?)::int as applied", ["invited"]))
        .select(client.raw("count(*) filter (where status in (?, ?))::int as attended", ["checked-in", "attended"]))
        .groupBy("meet_id");
      query.leftJoin(counts.as("counts"), "counts.meet_id", "m.id")
        .select("m.id", "s.name as status")
        .select(client.raw("concat_ws(' ', u.first_name, u.last_name) as \"organizerName\""))
        .select(client.raw("coalesce(counts.applied, 0)::int as applied, coalesce(counts.attended, 0)::int as attended"));
    }
    const rows: ReportRow[] = await query.orderBy("m.start_time", "desc", "last")
      .orderBy(attendees ? "a.id" : "m.id", "asc")
      .limit(options.limit).offset((options.page - 1) * options.limit);
    return { rows, total: Number(count?.total || 0) };
  }
}
