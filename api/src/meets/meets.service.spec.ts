import { MeetsService } from "./meets.service";
import { DatabaseService } from "../database/database.service";
import { MinioService } from "../storage/minio.service";
import { ConflictException } from "@nestjs/common";

const buildBuilder = () => {
  const builder: any = {};
  builder.select = jest.fn().mockReturnValue(builder);
  builder.count = jest.fn().mockReturnValue(builder);
  builder.groupBy = jest.fn().mockReturnValue(builder);
  builder.as = jest.fn().mockReturnValue(builder);
  builder.join = jest.fn().mockReturnValue(builder);
  builder.leftJoin = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.orWhere = jest.fn().mockReturnValue(builder);
  builder.andWhere = jest.fn().mockReturnValue(builder);
  builder.andWhereNot = jest.fn().mockReturnValue(builder);
  builder.whereIn = jest.fn().mockReturnValue(builder);
  builder.whereNotIn = jest.fn().mockReturnValue(builder);
  builder.whereNotNull = jest.fn().mockReturnValue(builder);
  builder.whereRaw = jest.fn().mockReturnValue(builder);
  builder.orderBy = jest.fn().mockReturnValue(builder);
  builder.modify = jest.fn().mockReturnValue(builder);
  builder.max = jest.fn().mockReturnValue(builder);
  builder.forUpdate = jest.fn().mockReturnValue(builder);
  builder.limit = jest.fn().mockReturnValue(builder);
  builder.offset = jest.fn().mockReturnValue(builder);
  builder.first = jest.fn();
  builder.pluck = jest.fn();
  builder.update = jest.fn();
  builder.insert = jest.fn();
  builder.del = jest.fn();
  return builder;
};

describe("MeetsService", () => {
  it("creates a meet with mapped fields", async () => {
    const meetsInsert = buildBuilder();
    meetsInsert.insert.mockImplementation(async (record: any) => [record]);

    const organizerBuilder = buildBuilder();
    organizerBuilder.first.mockResolvedValue({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone: "123",
    });
    const attendeeInsert = buildBuilder();
    attendeeInsert.insert.mockResolvedValue([{ id: "attendee-1" }]);

    const metaDefinitionsBuilder = buildBuilder();
    metaDefinitionsBuilder.select.mockResolvedValue([]);
    const metaValuesBuilder = buildBuilder();
    metaValuesBuilder.select.mockResolvedValue([]);

    const client: any = (table: string) => {
      if (table === "meets") return meetsInsert;
      if (table === "users") return organizerBuilder;
      if (table === "meet_attendees") return attendeeInsert;
      if (table === "meet_meta_definitions") return metaDefinitionsBuilder;
      if (table === "meet_meta_values as mv") return metaValuesBuilder;
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

  it("clones a meet as a draft without carrying over dates", async () => {
    const sourceMeet = {
      id: "meet-1",
      name: "Original meet",
      organizer_id: "organizer-1",
      organization_id: "org-1",
      description: "Desc",
      location: "Cape Town",
      location_lat: -33.9,
      location_long: 18.4,
      start_time: "2026-04-20T08:00:00Z",
      end_time: "2026-04-20T10:00:00Z",
      opening_date: "2026-04-01T00:00:00Z",
      closing_date: "2026-04-18T00:00:00Z",
      scheduled_date: "2026-04-20T08:00:00Z",
      confirm_date: "2026-04-19T00:00:00Z",
      status_id: 3,
      share_code: "original-share",
      currency_id: 1,
      cost_cents: 2500,
      deposit_cents: 1000,
      allow_guests: true,
      max_guests: 2,
      created_at: "2026-04-01T00:00:00Z",
      updated_at: "2026-04-02T00:00:00Z",
    };

    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue(sourceMeet);
    meetsBuilder.insert.mockImplementation(async (record: any) => [
      { ...record, id: "meet-2" },
    ]);

    const metaDefinitionsBuilder = buildBuilder();
    metaDefinitionsBuilder.select
      .mockResolvedValueOnce([
        {
          field_key: "fitness",
          label: "Fitness",
          field_type: "text",
          required: true,
          config: { includeInReports: true },
        },
      ])
      .mockResolvedValueOnce([{ field_key: "fitness" }])
      .mockResolvedValueOnce([{ id: "meta-2", field_key: "fitness" }]);

    const imagesBuilder = buildBuilder();
    imagesBuilder.select.mockResolvedValue([
      {
        object_key: "meets/meet-1/image.jpg",
        url: "https://cdn.example.com/meet.jpg",
        content_type: "image/jpeg",
        size_bytes: 12345,
        is_primary: true,
      },
    ]);

    const organizerBuilder = buildBuilder();
    organizerBuilder.first.mockResolvedValue({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone: "123",
    });

    const attendeesBuilder = buildBuilder();
    attendeesBuilder.insert.mockResolvedValue([{ id: "attendee-1" }]);

    const metaValuesBuilder = buildBuilder();
    metaValuesBuilder.select.mockResolvedValue([]);

    const client: any = (table: string) => {
      if (table === "meets") return meetsBuilder;
      if (table === "meet_meta_definitions") return metaDefinitionsBuilder;
      if (table === "meet_images") return imagesBuilder;
      if (table === "users") return organizerBuilder;
      if (table === "meet_attendees") return attendeesBuilder;
      if (table === "meet_meta_values as mv") return metaValuesBuilder;
      if (table === "meet_meta_values") return buildBuilder();
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");
    client.transaction = jest.fn(async (cb: any) => cb(client));

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    const cloned = await service.clone("meet-1", {
      name: "Original meet Copy",
      organizerId: "organizer-2",
    });

    const clonedInsertArg = meetsBuilder.insert.mock.calls[0][0];
    expect(clonedInsertArg.name).toBe("Original meet Copy");
    expect(clonedInsertArg.organizer_id).toBe("organizer-2");
    expect(clonedInsertArg.status_id).toBe(1);
    expect(clonedInsertArg.start_time).toBeNull();
    expect(clonedInsertArg.end_time).toBeNull();
    expect(clonedInsertArg.opening_date).toBeNull();
    expect(clonedInsertArg.closing_date).toBeNull();
    expect(clonedInsertArg.scheduled_date).toBeNull();
    expect(clonedInsertArg.confirm_date).toBeNull();
    expect(clonedInsertArg.share_code).not.toBe(sourceMeet.share_code);

    const clonedMetaInsertArg = metaDefinitionsBuilder.insert.mock.calls[0][0];
    expect(clonedMetaInsertArg).toEqual([
      expect.objectContaining({
        meet_id: "meet-2",
        field_key: "fitness",
        label: "Fitness",
        field_type: "text",
      }),
    ]);

    const clonedImageInsertArg = imagesBuilder.insert.mock.calls[0][0];
    expect(clonedImageInsertArg).toEqual([
      expect.objectContaining({
        meet_id: "meet-2",
        object_key: "meets/meet-1/image.jpg",
        url: "https://cdn.example.com/meet.jpg",
        is_primary: true,
      }),
    ]);

    expect(cloned.id).toBe("meet-2");
  });

  it("uses overlap filtering for calendar view and excludes draft/cancelled", async () => {
    const meetsBuilder = buildBuilder();
    meetsBuilder.limit.mockReturnValue(meetsBuilder);
    meetsBuilder.offset.mockResolvedValue([]);

    const totalBuilder = buildBuilder();
    totalBuilder.count.mockReturnValue(totalBuilder);
    totalBuilder.then = (resolve: (value: { count: string }[]) => void) =>
      resolve([{ count: "0" }]);

    const client: any = (table: string) => {
      if (table === "meets as m") return meetsBuilder;
      if (table === "meets") return totalBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    const startDate = new Date("2026-04-24T00:00:00Z");
    const endDate = new Date("2026-06-07T23:59:59Z");

    await service.findAll(
      "calendar",
      1,
      200,
      ["org-1"],
      true,
      "user-1",
      startDate,
      endDate,
      null,
    );

    expect(meetsBuilder.whereNotIn).toHaveBeenCalledWith("status_id", [1, 5]);
    expect(totalBuilder.whereNotIn).toHaveBeenCalledWith("status_id", [1, 5]);
    expect(meetsBuilder.whereRaw).toHaveBeenCalledWith(
      "coalesce(m.end_time, m.start_time) >= ?",
      [startDate.toISOString()],
    );
    expect(totalBuilder.whereRaw).toHaveBeenCalledWith(
      "coalesce(end_time, start_time) >= ?",
      [startDate.toISOString()],
    );
    expect(meetsBuilder.where).toHaveBeenCalledWith(
      "m.start_time",
      "<=",
      endDate.toISOString(),
    );
    expect(totalBuilder.where).toHaveBeenCalledWith(
      "start_time",
      "<=",
      endDate.toISOString(),
    );
  });

  it("rejects duplicate adult attendee inserts with a conflict error", async () => {
    const meetBuilder = buildBuilder();
    meetBuilder.first.mockResolvedValue({
      capacity: null,
      waitlist_size: 0,
      auto_placement: false,
    });

    const attendeeBuilder = buildBuilder();
    attendeeBuilder.first.mockResolvedValue({ max: 0 });
    attendeeBuilder.insert.mockRejectedValue({
      code: "23505",
      constraint: "meet_attendees_meet_id_user_id_non_minor_unique",
    });

    const client: any = (table: string) => {
      if (table === "meets") return meetBuilder;
      if (table === "meet_attendees") return attendeeBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");
    client.transaction = jest.fn(async (cb: any) => cb(client));

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.addAttendee("meet-1", {
        userId: "user-1",
        isMinor: false,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("rejects duplicate adult attendee updates with a conflict error", async () => {
    const attendeeBuilder = buildBuilder();
    attendeeBuilder.update.mockRejectedValue({
      code: "23505",
      constraint: "meet_attendees_meet_id_user_id_non_minor_unique",
    });

    const client: any = (table: string) => {
      if (table === "meet_attendees") return attendeeBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");
    client.transaction = jest.fn(async (cb: any) => cb(client));

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.updateAttendee("meet-1", "attendee-1", {
        userId: "user-1",
        isMinor: false,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
