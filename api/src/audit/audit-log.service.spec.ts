import { BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AuditLogService } from "./audit-log.service";

const buildBuilder = () => {
  const builder: any = {};
  builder.where = jest.fn().mockReturnValue(builder);
  builder.andWhere = jest.fn().mockReturnValue(builder);
  builder.select = jest.fn().mockReturnValue(builder);
  builder.first = jest.fn();
  builder.orderBy = jest.fn().mockReturnValue(builder);
  builder.limit = jest.fn().mockReturnValue(builder);
  builder.offset = jest.fn().mockReturnValue(builder);
  builder.count = jest.fn().mockReturnValue(builder);
  builder.insert = jest.fn().mockReturnValue(builder);
  return builder;
};

describe("AuditLogService", () => {
  it("adds an audit log record", async () => {
    const auditLogBuilder = buildBuilder();
    auditLogBuilder.insert.mockResolvedValue([
      {
        id: "log-1",
        created_at: "2026-05-27T10:00:00.000Z",
        org_id: "org-1",
        user_id: "user-1",
        attendee_id: null,
        meet_id: "meet-1",
        description: "Created a meet",
      },
    ]);

    const client: any = (table: string) => {
      if (table === "audit_log") return auditLogBuilder;
      return buildBuilder();
    };

    const service = new AuditLogService({
      getClient: () => client,
    } as unknown as DatabaseService);

    await expect(
      service.addRecord({
        orgId: "org-1",
        userId: "user-1",
        meetId: "meet-1",
        description: " Created a meet ",
      }),
    ).resolves.toEqual({
      id: "log-1",
      timestamp: "2026-05-27T10:00:00.000Z",
      orgId: "org-1",
      userId: "user-1",
      attendeeId: null,
      meetId: "meet-1",
      description: "Created a meet",
    });

    expect(auditLogBuilder.insert).toHaveBeenCalledWith(
      {
        org_id: "org-1",
        user_id: "user-1",
        attendee_id: null,
        meet_id: "meet-1",
        description: "Created a meet",
      },
      ["*"],
    );
  });

  it("builds the description from user, action, and target", async () => {
    const auditLogBuilder = buildBuilder();
    const usersBuilder = buildBuilder();
    auditLogBuilder.insert.mockResolvedValue([
      {
        id: "log-1",
        created_at: "2026-05-27T10:00:00.000Z",
        org_id: "org-1",
        user_id: "user-1",
        attendee_id: null,
        meet_id: "meet-1",
        description: "Sally Jones edit meet XYZ",
      },
    ]);
    usersBuilder.first.mockResolvedValue({
      first_name: "Sally",
      last_name: "Jones",
    });

    const client: any = (table: string) => {
      if (table === "audit_log") return auditLogBuilder;
      if (table === "users") return usersBuilder;
      return buildBuilder();
    };

    const service = new AuditLogService({
      getClient: () => client,
    } as unknown as DatabaseService);

    await expect(
      service.addRecord({
        orgId: "org-1",
        userId: "user-1",
        meetId: "meet-1",
        action: "edit",
        target: "meet XYZ",
      }),
    ).resolves.toEqual({
      id: "log-1",
      timestamp: "2026-05-27T10:00:00.000Z",
      orgId: "org-1",
      userId: "user-1",
      attendeeId: null,
      meetId: "meet-1",
      description: "Sally Jones edit meet XYZ",
    });
  });

  it('falls back to "User" when first and last name are not both present', async () => {
    const auditLogBuilder = buildBuilder();
    const usersBuilder = buildBuilder();
    auditLogBuilder.insert.mockResolvedValue([
      {
        id: "log-1",
        created_at: "2026-05-27T10:00:00.000Z",
        org_id: "org-1",
        user_id: "user-1",
        attendee_id: null,
        meet_id: "meet-1",
        description: "User edit meet XYZ",
      },
    ]);
    usersBuilder.first.mockResolvedValue({
      first_name: "Sally",
      last_name: null,
    });

    const client: any = (table: string) => {
      if (table === "audit_log") return auditLogBuilder;
      if (table === "users") return usersBuilder;
      return buildBuilder();
    };

    const service = new AuditLogService({
      getClient: () => client,
    } as unknown as DatabaseService);

    await expect(
      service.addRecord({
        orgId: "org-1",
        userId: "user-1",
        meetId: "meet-1",
        action: "edit",
        target: "meet XYZ",
      }),
    ).resolves.toEqual({
      id: "log-1",
      timestamp: "2026-05-27T10:00:00.000Z",
      orgId: "org-1",
      userId: "user-1",
      attendeeId: null,
      meetId: "meet-1",
      description: "User edit meet XYZ",
    });
  });

  it("uses the attendee name as the subject when attendeeId is provided", async () => {
    const auditLogBuilder = buildBuilder();
    const attendeesBuilder = buildBuilder();
    auditLogBuilder.insert.mockResolvedValue([
      {
        id: "log-1",
        created_at: "2026-05-27T10:00:00.000Z",
        org_id: "org-1",
        user_id: null,
        attendee_id: "attendee-1",
        meet_id: "meet-1",
        description: "Alex Example updated application for meet XYZ",
      },
    ]);
    attendeesBuilder.first.mockResolvedValue({
      name: "Alex Example",
    });

    const client: any = (table: string) => {
      if (table === "audit_log") return auditLogBuilder;
      if (table === "meet_attendees") return attendeesBuilder;
      return buildBuilder();
    };

    const service = new AuditLogService({
      getClient: () => client,
    } as unknown as DatabaseService);

    await expect(
      service.addRecord({
        orgId: "org-1",
        attendeeId: "attendee-1",
        meetId: "meet-1",
        action: "updated application for",
        target: "meet XYZ",
      }),
    ).resolves.toEqual({
      id: "log-1",
      timestamp: "2026-05-27T10:00:00.000Z",
      orgId: "org-1",
      userId: null,
      attendeeId: "attendee-1",
      meetId: "meet-1",
      description: "Alex Example updated application for meet XYZ",
    });
  });

  it("logs a warning and returns null when addRecord input is invalid", async () => {
    const service = new AuditLogService({
      getClient: () => jest.fn(),
    } as unknown as DatabaseService);
    const warn = jest.spyOn((service as any).logger, "warn").mockImplementation();

    await expect(
      service.addRecord({
        orgId: "org-1",
        description: "   ",
      }),
    ).resolves.toBeNull();

    expect(warn).toHaveBeenCalledWith(
      "Skipped audit log record for org org-1 because description is missing",
    );
  });

  it("logs a warning and returns null when the audit log insert fails", async () => {
    const auditLogBuilder = buildBuilder();
    auditLogBuilder.insert.mockRejectedValue(new Error("db unavailable"));

    const client: any = (table: string) => {
      if (table === "audit_log") return auditLogBuilder;
      return buildBuilder();
    };

    const service = new AuditLogService({
      getClient: () => client,
    } as unknown as DatabaseService);
    const warn = jest.spyOn((service as any).logger, "warn").mockImplementation();

    await expect(
      service.addRecord({
        orgId: "org-1",
        userId: "user-1",
        description: "Created a meet",
      }),
    ).resolves.toBeNull();

    expect(warn).toHaveBeenCalledWith(
      "Failed to write audit log record for org org-1: db unavailable",
    );
  });

  it("finds audit log records by org, user, and attendee with pagination", async () => {
    const countBuilder = buildBuilder();
    const rowsBuilder = buildBuilder();
    countBuilder.then = jest.fn((resolve: (value: any) => unknown) =>
      Promise.resolve(resolve([{ count: "3" }])),
    );
    rowsBuilder.then = jest.fn((resolve: (value: any) => unknown) =>
      Promise.resolve(
        resolve([
          {
            id: "log-2",
            created_at: "2026-05-27T11:00:00.000Z",
            org_id: "org-1",
            user_id: "user-1",
            attendee_id: "attendee-1",
            meet_id: null,
            description: "Updated attendee note",
          },
        ]),
      ),
    );

    let auditLogCallCount = 0;
    const client: any = (table: string) => {
      if (table !== "audit_log") return buildBuilder();
      auditLogCallCount += 1;
      return auditLogCallCount === 1 ? countBuilder : rowsBuilder;
    };

    rowsBuilder.offset.mockReturnValue(rowsBuilder);
    rowsBuilder.limit.mockReturnValue(rowsBuilder);
    rowsBuilder.orderBy.mockReturnValue(rowsBuilder);
    rowsBuilder.select.mockReturnValue(rowsBuilder);

    countBuilder.where.mockReturnValue(countBuilder);
    countBuilder.andWhere.mockReturnValue(countBuilder);
    rowsBuilder.where.mockReturnValue(rowsBuilder);
    rowsBuilder.andWhere.mockReturnValue(rowsBuilder);

    const service = new AuditLogService({
      getClient: () => client,
    } as unknown as DatabaseService);

    await expect(
      service.findRecords({
        orgId: "org-1",
        userId: "user-1",
        attendeeId: "attendee-1",
        page: 2,
        limit: 10,
      }),
    ).resolves.toEqual({
      records: [
        {
          id: "log-2",
          timestamp: "2026-05-27T11:00:00.000Z",
          orgId: "org-1",
          userId: "user-1",
          attendeeId: "attendee-1",
          meetId: null,
          description: "Updated attendee note",
        },
      ],
      page: 2,
      limit: 10,
      total: 3,
    });

    expect(countBuilder.where).toHaveBeenCalledWith({ org_id: "org-1" });
    expect(countBuilder.andWhere).toHaveBeenCalledWith({ user_id: "user-1" });
    expect(countBuilder.andWhere).toHaveBeenCalledWith({
      attendee_id: "attendee-1",
    });
    expect(rowsBuilder.limit).toHaveBeenCalledWith(10);
    expect(rowsBuilder.offset).toHaveBeenCalledWith(10);
  });

  it("still requires orgId for paginated reads", async () => {
    const service = new AuditLogService({
      getClient: () => jest.fn(),
    } as unknown as DatabaseService);

    await expect(
      service.findRecords({
        orgId: "",
      }),
    ).rejects.toThrow(new BadRequestException("orgId is required"));
  });
});
