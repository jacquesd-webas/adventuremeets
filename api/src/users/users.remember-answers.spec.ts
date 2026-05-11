import { UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { DatabaseService } from "../database/database.service";
import { MinioService } from "../storage/minio.service";
import { AuthService } from "../auth/auth.service";

type UserMetaValueRow = {
  user_id: string;
  organization_id: string;
  key: string;
  value: string;
};

const buildReadBuilder = (rows: any[]) => {
  let filtered = [...rows];
  const builder: any = {};

  builder.where = jest.fn().mockImplementation((criteria: Record<string, any>) => {
    filtered = filtered.filter((row) =>
      Object.entries(criteria).every(([key, value]) => row[key] === value),
    );
    return builder;
  });
  builder.whereIn = jest
    .fn()
    .mockImplementation((key: string, values: any[]) => {
      filtered = filtered.filter((row) => values.includes(row[key]));
      return builder;
    });
  builder.orderBy = jest.fn().mockImplementation((key: string, direction: string) => {
    filtered = [...filtered].sort((a, b) => {
      if (a[key] === b[key]) return 0;
      return direction === "desc"
        ? a[key] < b[key]
          ? 1
          : -1
        : a[key] > b[key]
          ? 1
          : -1;
    });
    return builder;
  });
  builder.first = jest.fn().mockImplementation(async (...columns: string[]) => {
    const row = filtered[0];
    if (!row) return undefined;
    if (!columns.length) return row;
    const picked: Record<string, any> = {};
    columns.forEach((column) => {
      picked[column] = row[column];
    });
    return picked;
  });
  builder.select = jest.fn().mockImplementation(async (...columns: string[]) => {
    if (!columns.length) return filtered;
    return filtered.map((row) => {
      const picked: Record<string, any> = {};
      columns.forEach((column) => {
        picked[column] = row[column];
      });
      return picked;
    });
  });

  return builder;
};

describe("Users remember answers integration", () => {
  let controller: UsersController;
  let userMetaValues: UserMetaValueRow[];

  beforeEach(async () => {
    userMetaValues = [
      {
        user_id: "user-1",
        organization_id: "org-1",
        key: "headlamp",
        value: "false",
      },
      {
        user_id: "user-1",
        organization_id: "org-1",
        key: "snack",
        value: "Chips",
      },
    ];

    const transactionFactory = async () => {
      const trx: any = (table: string) => {
        if (table !== "user_meta_values") {
          throw new Error(`Unexpected transaction table ${table}`);
        }

        let criteria: Record<string, any> = {};
        let keys: string[] = [];
        const trxBuilder: any = {};

        trxBuilder.where = jest
          .fn()
          .mockImplementation((nextCriteria: Record<string, any>) => {
            criteria = nextCriteria;
            return trxBuilder;
          });
        trxBuilder.whereIn = jest
          .fn()
          .mockImplementation((key: string, values: string[]) => {
            if (key === "key") {
              keys = values;
            }
            return trxBuilder;
          });
        trxBuilder.del = jest.fn().mockImplementation(async () => {
          userMetaValues = userMetaValues.filter(
            (row) =>
              !(
                row.user_id === criteria.user_id &&
                row.organization_id === criteria.organization_id &&
                keys.includes(row.key)
              ),
          );
        });
        trxBuilder.insert = jest
          .fn()
          .mockImplementation(async (rows: UserMetaValueRow[]) => {
            userMetaValues.push(...rows);
          });

        return trxBuilder;
      };

      trx.commit = jest.fn().mockResolvedValue(undefined);
      trx.rollback = jest.fn().mockResolvedValue(undefined);
      return trx;
    };

    const client: any = (table: string) => {
      if (table === "meets") {
        return buildReadBuilder([
          {
            id: "meet-1",
            organization_id: "org-1",
          },
        ]);
      }
      if (table === "meet_attendees") {
        return buildReadBuilder([
          {
            id: "attendee-1",
            meet_id: "meet-1",
            user_id: "user-1",
          },
        ]);
      }
      if (table === "meet_meta_definitions") {
        return buildReadBuilder([
          {
            id: "definition-1",
            meet_id: "meet-1",
            field_key: "snack",
          },
          {
            id: "definition-2",
            meet_id: "meet-1",
            field_key: "headlamp",
          },
        ]);
      }
      if (table === "meet_meta_values") {
        return buildReadBuilder([
          {
            meet_id: "meet-1",
            attendee_id: "attendee-1",
            meta_definition_id: "definition-1",
            value: "Biltong",
          },
        ]);
      }
      if (table === "user_meta_values") {
        return buildReadBuilder(userMetaValues);
      }
      throw new Error(`Unexpected table ${table}`);
    };

    client.transaction = jest.fn().mockImplementation(transactionFactory);

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: {
            getClient: () => client,
          },
        },
        { provide: MinioService, useValue: {} },
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  it("copies attendee answers into saved user meta values", async () => {
    const response = await controller.copyMyMetaValuesFromAttendee(
      {
        meetId: "meet-1",
        attendeeId: "attendee-1",
      },
      {
        id: "user-1",
        email: "member@example.com",
        organizations: { "org-1": "member" },
        pendingInvites: [],
      },
    );

    expect(response).toEqual({
      organizationId: "org-1",
      metaValues: [{ key: "snack", value: "Biltong" }],
    });
    expect(userMetaValues).toEqual([
      {
        user_id: "user-1",
        organization_id: "org-1",
        key: "snack",
        value: "Biltong",
      },
    ]);
  });

  it("rejects unauthenticated remember-my-answers copying", async () => {
    await expect(
      controller.copyMyMetaValuesFromAttendee({
        meetId: "meet-1",
        attendeeId: "attendee-1",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
