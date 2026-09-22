import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type CreateAuditLogInput = {
  orgId: string;
  userId?: string | null;
  attendeeId?: string | null;
  meetId?: string | null;
  description?: string;
  action?: string;
  target?: string;
};

export type FindAuditLogInput = {
  orgId: string;
  userId?: string;
  attendeeId?: string;
  page?: number;
  limit?: number;
};

export type AuditLogRecord = {
  id: string;
  timestamp: string;
  orgId: string;
  userId: string | null;
  attendeeId: string | null;
  meetId: string | null;
  description: string;
};

export type AuditLogPage = {
  records: AuditLogRecord[];
  page: number;
  limit: number;
  total: number;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly database: DatabaseService) {}

  private async getSubjectLabel(input: CreateAuditLogInput) {
    if (input.attendeeId) {
      const attendee = await this.database
        .getClient()("meet_attendees")
        .where({ id: input.attendeeId })
        .select("name")
        .first();

      const attendeeName = attendee?.name?.trim();
      return attendeeName || "Attendee";
    }

    if (input.userId) {
      const user = await this.database
        .getClient()("users")
        .where({ id: input.userId })
        .select("first_name", "last_name")
        .first();

      if (user?.first_name && user?.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
    }

    return "User";
  }

  private async buildDescription(input: CreateAuditLogInput) {
    const trimmedAction = input.action?.trim();
    if (!trimmedAction) {
      return null;
    }

    const subject = await this.getSubjectLabel(input);
    const trimmedTarget = input.target?.trim();
    return trimmedTarget
      ? `${subject} ${trimmedAction} ${trimmedTarget}`
      : `${subject} ${trimmedAction}`;
  }

  private mapAuditLogRecord(row: any): AuditLogRecord {
    return {
      id: row.id,
      timestamp: row.created_at,
      orgId: row.org_id,
      userId: row.user_id ?? null,
      attendeeId: row.attendee_id ?? null,
      meetId: row.meet_id ?? null,
      description: row.description,
    };
  }

  async addRecord(input: CreateAuditLogInput) {
    if (!input.orgId) {
      this.logger.warn("Skipped audit log record because orgId is missing");
      return null;
    }

    const description =
      input.description?.trim() || (await this.buildDescription(input));

    if (!description) {
      this.logger.warn(
        `Skipped audit log record for org ${input.orgId} because description is missing`,
      );
      return null;
    }

    try {
      const [row] = await this.database
        .getClient()("audit_log")
        .insert(
          {
            org_id: input.orgId,
            user_id: input.userId ?? null,
            attendee_id: input.attendeeId ?? null,
            meet_id: input.meetId ?? null,
            description,
          },
          ["*"],
        );

      return this.mapAuditLogRecord(row);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown audit log error";
      this.logger.warn(
        `Failed to write audit log record for org ${input.orgId}: ${message}`,
      );
      return null;
    }
  }

  async findRecords(input: FindAuditLogInput): Promise<AuditLogPage> {
    if (!input.orgId) {
      throw new BadRequestException("orgId is required");
    }

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.max(1, Math.min(100, input.limit ?? 20));

    const applyFilters = (query: any) => {
      query.where({ org_id: input.orgId });

      if (input.userId) {
        query.andWhere({ user_id: input.userId });
      }

      if (input.attendeeId) {
        query.andWhere({ attendee_id: input.attendeeId });
      }

      return query;
    };

    const [countRow] = await applyFilters(
      this.database.getClient()("audit_log").count<{ count: string }[]>({
        count: "*",
      }),
    );

    const rows = await applyFilters(this.database.getClient()("audit_log"))
      .select("*")
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      records: rows.map((row: any) => this.mapAuditLogRecord(row)),
      page,
      limit,
      total: Number(countRow?.count ?? 0),
    };
  }
}
