import { MeetsService } from "./meets.service";
import { DatabaseService } from "../database/database.service";
import { MinioService } from "../storage/minio.service";

const buildBuilder = () => {
  const builder: any = {};
  builder.select = jest.fn().mockReturnValue(builder);
  builder.count = jest.fn().mockReturnValue(builder);
  builder.groupBy = jest.fn().mockReturnValue(builder);
  builder.as = jest.fn().mockReturnValue(builder);
  builder.leftJoin = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.whereIn = jest.fn().mockReturnValue(builder);
  builder.whereNotNull = jest.fn().mockReturnValue(builder);
  builder.whereRaw = jest.fn().mockReturnValue(builder);
  builder.orderBy = jest.fn().mockReturnValue(builder);
  builder.first = jest.fn();
  builder.pluck = jest.fn();
  builder.update = jest.fn();
  builder.insert = jest.fn();
  return builder;
};

describe("MeetsService", () => {
  it("creates a meet with mapped fields", async () => {
    const meetsInsert = buildBuilder();
    meetsInsert.insert.mockImplementation(async (record: any) => [record]);

    const client: any = (table: string) => {
      if (table === "meets") return meetsInsert;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");
    client.transaction = jest.fn(async (cb: any) => cb(client));

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    const created = await service.create({
      name: "Test meet",
      description: "Desc",
      organizerId: "org-1",
      organizationId: "org-2",
      location: "Cape Town",
      startTime: "2024-01-01T10:00:00Z",
      endTime: "2024-01-01T12:00:00Z",
      openingDate: "2023-12-20T00:00:00Z",
      closingDate: "2023-12-30T00:00:00Z",
      capacity: 25,
      waitlistSize: 5,
      statusId: 2,
      allowGuests: true,
      maxGuests: 2,
      currencyId: 1,
      costCents: 1234,
    });

    const insertArg = meetsInsert.insert.mock.calls[0][0];
    expect(insertArg.name).toBe("Test meet");
    expect(insertArg.organizer_id).toBe("org-1");
    expect(insertArg.organization_id).toBe("org-2");
    expect(insertArg.location).toBe("Cape Town");
    expect(insertArg.start_time).toBe("2024-01-01T10:00:00Z");
    expect(insertArg.end_time).toBe("2024-01-01T12:00:00Z");
    expect(insertArg.opening_date).toBe("2023-12-20T00:00:00Z");
    expect(insertArg.closing_date).toBe("2023-12-30T00:00:00Z");
    expect(insertArg.capacity).toBe(25);
    expect(insertArg.waitlist_size).toBe(5);
    expect(insertArg.status_id).toBe(2);
    expect(insertArg.allow_guests).toBe(true);
    expect(insertArg.max_guests).toBe(2);
    expect(insertArg.currency_id).toBe(1);
    expect(insertArg.cost_cents).toBe(123400);
    expect(typeof insertArg.share_code).toBe("string");
    expect(insertArg.share_code.length).toBeGreaterThan(0);

    expect(created.name).toBe("Test meet");
  });

  it("returns primary image URL when fetching a meet", async () => {
    const meetRow = {
      id: "meet-1",
      name: "Meet",
      organizer_id: "org-1",
      organization_id: "org-2",
      status_id: 2,
    };
    const imageRow = {
      url: "https://cdn.example.com/meet.jpg",
      is_primary: true,
    };

    const meetBuilder = buildBuilder();
    meetBuilder.first.mockResolvedValue(meetRow);

    const imageBuilder = buildBuilder();
    imageBuilder.first.mockResolvedValue(imageRow);

    const metaBuilder = buildBuilder();
    metaBuilder.select = jest.fn().mockResolvedValue([]);

    const client: any = (table: string) => {
      if (table === "meets as m") return meetBuilder;
      if (table === "meet_images") return imageBuilder;
      if (table === "meet_meta_definitions") return metaBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    const result = await service.findOne("meet-1");
    expect(result.imageUrl).toBe("https://cdn.example.com/meet.jpg");
  });
});
