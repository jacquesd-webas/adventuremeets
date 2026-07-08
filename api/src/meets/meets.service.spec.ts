import { MeetsService } from "./meets.service";
import { DatabaseService } from "../database/database.service";
import { MinioService } from "../storage/minio.service";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";

const buildBuilder = () => {
  const builder: any = {};
  builder.select = jest.fn().mockReturnValue(builder);
  builder.count = jest.fn().mockReturnValue(builder);
  builder.groupBy = jest.fn().mockReturnValue(builder);
  builder.as = jest.fn().mockReturnValue(builder);
  builder.join = jest.fn().mockReturnValue(builder);
  builder.leftJoin = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.whereNot = jest.fn().mockReturnValue(builder);
  builder.orWhere = jest.fn().mockReturnValue(builder);
  builder.andWhere = jest.fn().mockReturnValue(builder);
  builder.andWhereNot = jest.fn().mockReturnValue(builder);
  builder.whereIn = jest.fn().mockReturnValue(builder);
  builder.whereNotIn = jest.fn().mockReturnValue(builder);
  builder.whereNotNull = jest.fn().mockReturnValue(builder);
  builder.whereRaw = jest.fn().mockReturnValue(builder);
  builder.orWhereRaw = jest.fn().mockReturnValue(builder);
  builder.orderByRaw = jest.fn().mockReturnValue(builder);
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
  builder.onConflict = jest.fn().mockReturnValue(builder);
  builder.ignore = jest.fn().mockReturnValue(builder);
  builder.merge = jest.fn().mockReturnValue(builder);
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
      allowSelfCheckin: true,
      allowWalkins: true,
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
    expect(typeof insertArg.checkin_pin).toBe("string");
    expect(insertArg.checkin_pin).toHaveLength(6);
    expect(insertArg.allow_walkins).toBe(true);
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
      id: "image-1",
      meet_id: "meet-1",
      url: "https://cdn.example.com/meet.jpg",
      is_primary: true,
      aspect: "W",
    };

    const meetBuilder = buildBuilder();
    meetBuilder.first.mockResolvedValue(meetRow);

    const imageBuilder = buildBuilder();
    imageBuilder.select.mockResolvedValue([imageRow]);

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
    expect(result.images).toEqual([
      expect.objectContaining({
        id: "image-1",
        meetId: "meet-1",
        url: "https://cdn.example.com/meet.jpg",
        isPrimary: true,
        aspect: "W",
      }),
    ]);
  });

  it("returns attending attendee previews only for logged-in attendees who are going", async () => {
    const meetRow = {
      id: "meet-1",
      name: "Meet",
      organizer_id: "org-1",
      organization_id: "org-2",
      status_id: 2,
      my_attendee_status: "confirmed",
    };

    const meetBuilder = buildBuilder();
    meetBuilder.first.mockResolvedValue(meetRow);

    const attendeeCountsBuilder = buildBuilder();

    const attendingAttendeesBuilder = buildBuilder();
    attendingAttendeesBuilder.select.mockResolvedValue([
      {
        id: "attendee-1",
        name: "Guest Person",
        first_name: null,
        last_name: null,
        avatar_url: null,
      },
      {
        id: "attendee-2",
        name: null,
        first_name: "Alice",
        last_name: "Walker",
        avatar_url: "https://cdn.example.com/alice.jpg",
      },
    ]);

    const imageBuilder = buildBuilder();
    imageBuilder.select.mockResolvedValue([]);

    const metaBuilder = buildBuilder();
    metaBuilder.select = jest.fn().mockResolvedValue([]);

    let meetAttendeesCalls = 0;
    const client: any = (table: string) => {
      if (table === "meets as m") return meetBuilder;
      if (table === "meet_images") return imageBuilder;
      if (table === "meet_meta_definitions") return metaBuilder;
      if (table === "meet_attendees") {
        meetAttendeesCalls += 1;
        return meetAttendeesCalls === 1
          ? attendeeCountsBuilder
          : attendingAttendeesBuilder;
      }
      if (table === "meet_attendees as ma") return attendingAttendeesBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    const result = await service.findOne("meet-1", "user-1");

    expect(result.attendingAttendees).toEqual([
      { id: "attendee-1", name: "Guest Person", avatarUrl: undefined },
      {
        id: "attendee-2",
        name: "Alice Walker",
        avatarUrl: "https://cdn.example.com/alice.jpg",
      },
    ]);
  });

  it("returns attending attendee previews on attendee status only for attendees who are going", async () => {
    const meetRow = {
      id: "meet-1",
      name: "Meet",
      organizer_id: "org-1",
      organization_id: "org-2",
      status_id: 2,
    };

    const meetBuilder = buildBuilder();
    meetBuilder.first.mockResolvedValue(meetRow);

    const attendeeCountsBuilder = buildBuilder();

    const statusAttendeeBuilder = buildBuilder();
    statusAttendeeBuilder.first.mockResolvedValue({
      id: "attendee-1",
      status: "checked-in",
    });

    const attendingAttendeesBuilder = buildBuilder();
    attendingAttendeesBuilder.select.mockResolvedValue([
      {
        id: "attendee-1",
        name: "Alice Walker",
        first_name: null,
        last_name: null,
        avatar_url: "https://cdn.example.com/alice.jpg",
      },
    ]);

    const imageBuilder = buildBuilder();
    imageBuilder.select.mockResolvedValue([]);

    const metaBuilder = buildBuilder();
    metaBuilder.select = jest.fn().mockResolvedValue([]);

    let meetAttendeesCalls = 0;
    const client: any = (table: string) => {
      if (table === "meets as m") return meetBuilder;
      if (table === "meet_images") return imageBuilder;
      if (table === "meet_meta_definitions") return metaBuilder;
      if (table === "meet_attendees") {
        meetAttendeesCalls += 1;
        if (meetAttendeesCalls === 1) return attendeeCountsBuilder;
        return statusAttendeeBuilder;
      }
      if (table === "meet_attendees as ma") return attendingAttendeesBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    const result = await service.findAttendeeStatus("meet-1", "attendee-1");

    expect(result.attendingAttendees).toEqual([
      {
        id: "attendee-1",
        name: "Alice Walker",
        avatarUrl: "https://cdn.example.com/alice.jpg",
      },
    ]);
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
      checkin_pin: "ABC123",
      allow_walkins: true,
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
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ field_key: "fitness" }])
      .mockResolvedValueOnce([{ id: "meta-2", field_key: "fitness" }]);

    const imagesBuilder = buildBuilder();
    imagesBuilder.select.mockResolvedValue([
      {
        object_key: "meets/meet-1/image.jpg",
        url: "https://cdn.example.com/meet.jpg",
        content_type: "image/jpeg",
        size_bytes: 12345,
        aspect: "O",
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
    expect(clonedInsertArg.checkin_pin).not.toBe(sourceMeet.checkin_pin);
    expect(clonedInsertArg.checkin_pin).toHaveLength(6);

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
        aspect: "O",
        is_primary: true,
      }),
    ]);

    expect(cloned.id).toBe("meet-2");
  });

  it("uses overlap filtering for calendar view and excludes drafts", async () => {
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

    expect(meetsBuilder.whereNotIn).toHaveBeenCalledWith("status_id", [1]);
    expect(totalBuilder.whereNotIn).toHaveBeenCalledWith("status_id", [1]);
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

  it("shows all non-draft meets to members when the organization allows it", async () => {
    const organizationsBuilder = buildBuilder();
    organizationsBuilder.select.mockResolvedValue([
      { id: "org-1", can_view_all_meets: true },
    ]);

    const meetsBuilder = buildBuilder();
    meetsBuilder.limit.mockReturnValue(meetsBuilder);
    meetsBuilder.offset.mockResolvedValue([]);

    const totalBuilder = buildBuilder();
    totalBuilder.count.mockReturnValue(totalBuilder);
    totalBuilder.then = (resolve: (value: { count: string }[]) => void) =>
      resolve([{ count: "0" }]);

    const client: any = (table: string) => {
      if (table === "organizations") return organizationsBuilder;
      if (table === "meets as m") return meetsBuilder;
      if (table === "meets") return totalBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await service.findAll("all", 1, 20, ["org-1"], false, "user-1");

    expect(organizationsBuilder.whereIn).toHaveBeenCalledWith("id", ["org-1"]);
    expect(meetsBuilder.where).toHaveBeenCalledWith("m.status_id", "!=", 1);
    expect(totalBuilder.where).toHaveBeenCalledWith("status_id", "!=", 1);
    expect(meetsBuilder.where).not.toHaveBeenCalledWith("m.is_hidden", false);
    expect(totalBuilder.where).not.toHaveBeenCalledWith("is_hidden", false);
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

  it("creates a checked-in attendee when a valid check-in pin is supplied", async () => {
    const meetBuilder = buildBuilder();
    meetBuilder.first.mockResolvedValue({
      capacity: null,
      waitlist_size: 0,
      auto_placement: false,
      checkin_pin: "PIN123",
    });

    const attendeeBuilder = buildBuilder();
    attendeeBuilder.first.mockResolvedValue({ max: 0 });
    attendeeBuilder.insert.mockResolvedValue([
      { id: "attendee-1", status: "checked-in" },
    ]);

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

    await service.addAttendee("meet-1", {
      name: "Walk In",
      org1Value: "Club 42",
      org2Value: "North",
      checkinPin: "PIN123",
    });

    expect(attendeeBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        meet_id: "meet-1",
        name: "Walk In",
        org1_value: "Club 42",
        org2_value: "North",
        status: "checked-in",
      }),
      ["*"],
    );
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

  it("resets confirmed attendees to invited while excluding the organizer attendee", async () => {
    const attendeeBuilder = buildBuilder();
    attendeeBuilder.update.mockResolvedValue(3);

    const client: any = (table: string) => {
      if (table === "meet_attendees") return attendeeBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    const result = await service.resetConfirmedAttendeesToInvited(
      "meet-1",
      "organizer-1",
    );

    expect(attendeeBuilder.where).toHaveBeenCalledWith({
      meet_id: "meet-1",
      status: "confirmed",
    });
    expect(attendeeBuilder.andWhere).toHaveBeenCalledWith(expect.any(Function));

    const filterBuilder = {
      whereNull: jest.fn().mockReturnThis(),
      orWhereNot: jest.fn().mockReturnThis(),
    };
    const filterCallback = (attendeeBuilder.andWhere as jest.Mock).mock
      .calls[0][0];
    filterCallback(filterBuilder);

    expect(filterBuilder.whereNull).toHaveBeenCalledWith("user_id");
    expect(filterBuilder.orWhereNot).toHaveBeenCalledWith(
      "user_id",
      "organizer-1",
    );
    expect(attendeeBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "invited",
        updated_at: expect.any(String),
      }),
    );
    expect(result).toEqual({ updated: 3 });
  });

  it("detects missing attendee fields for required reconfirmation details", async () => {
    const meetBuilder = buildBuilder();
    meetBuilder.first.mockResolvedValue({
      id: "meet-1",
      name: "Meet",
      has_indemnity: true,
    });

    const attendeeBuilder = buildBuilder();
    attendeeBuilder.first.mockResolvedValue({
      id: "attendee-1",
      meet_id: "meet-1",
      name: "Sam",
      email: "sam@example.com",
      phone: "",
      indemnity_accepted: false,
    });

    const metaValuesBuilder = buildBuilder();
    metaValuesBuilder.select.mockResolvedValue([]);

    const metaDefinitionsBuilder = buildBuilder();
    metaDefinitionsBuilder.select.mockResolvedValue([
      {
        id: "meta-1",
        field_key: "fitness",
        label: "Fitness",
        field_type: "text",
        required: true,
        position: 1,
        config: null,
      },
    ]);

    const client: any = (table: string) => {
      if (table === "meets as m") return meetBuilder;
      if (table === "meet_attendees") return attendeeBuilder;
      if (table === "meet_meta_values as mv") return metaValuesBuilder;
      if (table === "meet_meta_definitions") return metaDefinitionsBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.attendeeHasMissingFields("meet-1", "attendee-1"),
    ).resolves.toBe(true);
  });

  it("skips duplicate invited attendees by name, email, and phone", async () => {
    const attendeeBuilder = buildBuilder();
    attendeeBuilder.select.mockResolvedValue([
      {
        name: "Existing Person",
        email: "existing@example.com",
        phone: "+27110000000",
      },
    ]);
    attendeeBuilder.first.mockResolvedValue({ max: 4 });
    attendeeBuilder.insert.mockResolvedValue([{ id: "attendee-new-1" }]);

    const metaValuesBuilder = buildBuilder();

    const client: any = (table: string) => {
      if (table === "meet_attendees") return attendeeBuilder;
      if (table === "meet_meta_values") return metaValuesBuilder;
      return buildBuilder();
    };
    client.transaction = jest.fn(async (cb: any) => cb(client));

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.addInvitedAttendees("meet-1", [
        {
          name: "Existing Person",
          email: "EXISTING@example.com",
          phone: "+27110000000",
        },
        {
          name: "New Person",
          email: "new@example.com",
          phone: "+27220000000",
        },
        {
          name: " new person ",
          email: "NEW@example.com",
          phone: "+27220000000",
        },
      ]),
    ).resolves.toEqual({
      created: 1,
      skipped: 2,
    });

    expect(attendeeBuilder.insert).toHaveBeenCalledTimes(1);
    expect(attendeeBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        meet_id: "meet-1",
        name: "New Person",
        email: "new@example.com",
        phone: "+27220000000",
        status: "invited",
        sequence: 5,
      }),
      ["id"],
    );
    expect(metaValuesBuilder.insert).not.toHaveBeenCalled();
  });

  it("matches attendees by name and sorts unchecked matches before checked-in ones", async () => {
    const attendeeBuilder = buildBuilder();
    attendeeBuilder.select.mockResolvedValue([
      {
        id: "attendee-checked",
        meet_id: "meet-1",
        name: "Sam Trail",
        email: null,
        phone: null,
        status: "checked-in",
      },
      {
        id: "attendee-confirmed",
        meet_id: "meet-1",
        name: "Sam Trail",
        email: null,
        phone: null,
        status: "confirmed",
      },
    ]);

    const client: any = (table: string) => {
      if (table === "meet_attendees") return attendeeBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    const result = await service.findAttendeeByContact(
      "meet-1",
      undefined,
      undefined,
      "Sam Trail",
      { includeInvited: false },
    );

    expect(result.attendee?.id).toBe("attendee-confirmed");
    expect(result.attendees?.map((attendee) => attendee.id)).toEqual([
      "attendee-confirmed",
      "attendee-checked",
    ]);
  });

  it("preserves existing meet meta definition ids when editing questions", async () => {
    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue({ id: "meet-1", checkin_pin: null });
    meetsBuilder.update.mockResolvedValue([{ id: "meet-1" }]);

    const metaDefinitionsBuilder = buildBuilder();
    metaDefinitionsBuilder.select.mockResolvedValue([
      { id: "meta-1", field_key: "fitness" },
      { id: "meta-2", field_key: "dietary" },
    ]);
    metaDefinitionsBuilder.update.mockResolvedValue([]);
    metaDefinitionsBuilder.insert.mockResolvedValue([]);
    metaDefinitionsBuilder.del.mockResolvedValue(1);

    const client: any = (table: string) => {
      if (table === "meets") return meetsBuilder;
      if (table === "meet_meta_definitions") return metaDefinitionsBuilder;
      return buildBuilder();
    };
    client.transaction = jest.fn(async (cb: any) => cb(client));
    client.raw = jest.fn(() => "raw");
    client.fn = { now: jest.fn(() => "now") };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await service.update("meet-1", {
      metaDefinitions: [
        {
          id: "meta-1",
          fieldKey: "fitness",
          label: "Fitness",
          fieldType: "text",
          required: true,
        },
        {
          fieldKey: "pace",
          label: "Pace",
          fieldType: "select",
          required: false,
          config: { options: ["Slow", "Fast"] },
        },
      ],
    } as any);

    expect(metaDefinitionsBuilder.whereIn).toHaveBeenCalledWith("id", [
      "meta-2",
    ]);
    expect(metaDefinitionsBuilder.del).toHaveBeenCalled();
    expect(metaDefinitionsBuilder.update).toHaveBeenNthCalledWith(1, {
      field_key: "tmp_sync_meta-1",
      updated_at: "now",
    });
    expect(metaDefinitionsBuilder.update).toHaveBeenNthCalledWith(2, {
      field_key: "fitness",
      label: "Fitness",
      field_type: "text",
      required: true,
      position: 0,
      config: {},
      updated_at: "now",
    });
    expect(metaDefinitionsBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        meet_id: "meet-1",
        field_key: "pace",
        label: "Pace",
        field_type: "select",
        required: false,
        position: 1,
        config: { options: ["Slow", "Fast"] },
      }),
    ]);
  });

  it("returns a user-friendly error when removing a question that already has answers", async () => {
    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue({ id: "meet-1", checkin_pin: null });
    meetsBuilder.update.mockResolvedValue([{ id: "meet-1" }]);

    const metaDefinitionsBuilder = buildBuilder();
    metaDefinitionsBuilder.select.mockResolvedValue([
      { id: "meta-1", field_key: "fitness" },
      { id: "meta-2", field_key: "dietary" },
    ]);

    const metaValuesBuilder = buildBuilder();
    metaValuesBuilder.first.mockResolvedValue({
      meta_definition_id: "meta-2",
    });

    const client: any = (table: string) => {
      if (table === "meets") return meetsBuilder;
      if (table === "meet_meta_definitions") return metaDefinitionsBuilder;
      if (table === "meet_meta_values") return metaValuesBuilder;
      return buildBuilder();
    };
    client.transaction = jest.fn(async (cb: any) => cb(client));
    client.raw = jest.fn(() => "raw");
    client.fn = { now: jest.fn(() => "now") };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.update("meet-1", {
        metaDefinitions: [
          {
            id: "meta-1",
            fieldKey: "fitness",
            label: "Fitness",
            fieldType: "text",
            required: true,
          },
        ],
      } as any),
    ).rejects.toThrow(
      new BadRequestException(
        "You cannot remove a meet question that already has attendee answers.",
      ),
    );

    expect(metaValuesBuilder.whereIn).toHaveBeenCalledWith(
      "meta_definition_id",
      ["meta-2"],
    );
    expect(metaDefinitionsBuilder.del).not.toHaveBeenCalled();
  });

  it("lists meet images with the primary image first", async () => {
    const imageBuilder = buildBuilder();
    imageBuilder.select.mockResolvedValue([
      {
        id: "image-1",
        meet_id: "meet-1",
        url: "https://cdn.example.com/primary.jpg",
        is_primary: true,
        aspect: "W",
        content_type: "image/jpeg",
        size_bytes: 123,
      },
      {
        id: "image-2",
        meet_id: "meet-1",
        url: "https://cdn.example.com/secondary.jpg",
        is_primary: false,
        aspect: "O",
        content_type: "image/jpeg",
        size_bytes: 456,
      },
    ]);

    const client: any = (table: string) => {
      if (table === "meet_images") return imageBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(service.listImages("meet-1")).resolves.toEqual({
      images: [
        expect.objectContaining({
          id: "image-1",
          meetId: "meet-1",
          isPrimary: true,
          aspect: "W",
        }),
        expect.objectContaining({
          id: "image-2",
          meetId: "meet-1",
          isPrimary: false,
          aspect: "O",
        }),
      ],
    });
  });

  it("promotes a meet image to primary", async () => {
    const imageBuilder = buildBuilder();
    imageBuilder.first.mockResolvedValue({
      id: "image-2",
      meet_id: "meet-1",
      is_primary: false,
      aspect: "O",
      url: "https://cdn.example.com/secondary.jpg",
    });
    imageBuilder.update.mockResolvedValueOnce(1).mockResolvedValueOnce([
      {
        id: "image-2",
        meet_id: "meet-1",
        is_primary: true,
        aspect: "O",
        url: "https://cdn.example.com/secondary.jpg",
      },
    ]);

    const client: any = (table: string) => {
      if (table === "meet_images") return imageBuilder;
      return buildBuilder();
    };
    client.transaction = jest.fn(async (cb: any) => cb(client));

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.updateImage("meet-1", "image-2", { isPrimary: true }),
    ).resolves.toEqual({
      image: expect.objectContaining({
        id: "image-2",
        meetId: "meet-1",
        isPrimary: true,
        aspect: "O",
      }),
    });

    expect(imageBuilder.update).toHaveBeenNthCalledWith(1, {
      is_primary: false,
    });
    expect(imageBuilder.update).toHaveBeenNthCalledWith(
      2,
      { is_primary: true },
      ["*"],
    );
  });

  it("deletes a meet image and promotes a replacement when needed", async () => {
    const imageBuilder = buildBuilder();
    imageBuilder.first
      .mockResolvedValueOnce({
        id: "image-1",
        meet_id: "meet-1",
        is_primary: true,
        object_key: "meets/meet-1/primary.jpg",
      })
      .mockResolvedValueOnce({
        id: "image-2",
      });
    imageBuilder.del.mockResolvedValue(1);

    const client: any = (table: string) => {
      if (table === "meet_images") return imageBuilder;
      return buildBuilder();
    };
    client.transaction = jest.fn(async (cb: any) => cb(client));

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {
      remove: jest.fn().mockResolvedValue(undefined),
    } as unknown as MinioService;
    const service = new MeetsService(db, minio);

    await expect(service.removeImage("meet-1", "image-1")).resolves.toEqual({
      removed: true,
    });

    expect(imageBuilder.del).toHaveBeenCalled();
    expect(imageBuilder.update).toHaveBeenCalledWith({ is_primary: true });
    expect(minio.remove as jest.Mock).toHaveBeenCalledWith(
      "meets/meet-1/primary.jpg",
    );
  });

  it("detects and stores the uploaded image aspect", async () => {
    const imageBuilder = buildBuilder();
    imageBuilder.first.mockResolvedValue({ id: "image-existing" });
    imageBuilder.insert.mockResolvedValue([
      {
        id: "image-3",
        meet_id: "meet-1",
        url: "https://cdn.example.com/uploaded.png",
        is_primary: false,
        aspect: "P",
      },
    ]);

    const client: any = (table: string) => {
      if (table === "meet_images") return imageBuilder;
      return buildBuilder();
    };
    client.transaction = jest.fn(async (cb: any) => cb(client));

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {
      upload: jest.fn().mockResolvedValue({
        objectKey: "meets/meet-1/uploaded.png",
        url: "https://cdn.example.com/uploaded.png",
      }),
    } as unknown as MinioService;
    const service = new MeetsService(db, minio);

    const portraitPng = Buffer.from(
      "89504e470d0a1a0a0000000d494844520000012c00000258080600000072b60d240000000049454e44ae426082",
      "hex",
    );

    await expect(
      service.addImage(
        "meet-1",
        {
          mimetype: "image/png",
          size: portraitPng.length,
          buffer: portraitPng,
        },
        { isPrimary: false },
      ),
    ).resolves.toEqual({
      image: expect.objectContaining({
        id: "image-3",
        meetId: "meet-1",
        aspect: "P",
      }),
    });

    expect(imageBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        meet_id: "meet-1",
        aspect: "P",
      }),
      ["*"],
    );
  });

  it("creates a wall item with a photo upload and detected aspect", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.first.mockResolvedValue({
      id: "wall-1",
      meet_id: "meet-1",
      created_by: "user-1",
      attendee_id: "attendee-1",
      attendee_name: "Alice",
      comment: "Great day out",
      stars: 5,
      url: "https://cdn.example.com/wall.png",
      object_key: "wall/meet-1/item.png",
      content_type: "image/png",
      size_bytes: 1234,
      aspect: "P",
      favourite: 0,
    });
    wallItemBuilder.insert.mockResolvedValue([
      {
        id: "wall-1",
        meet_id: "meet-1",
        created_by: "user-1",
        attendee_id: "attendee-1",
        attendee_name: "Alice",
        comment: "Great day out",
        stars: 5,
        url: "https://cdn.example.com/wall.png",
        object_key: "wall/meet-1/item.png",
        content_type: "image/png",
        size_bytes: 1234,
        aspect: "P",
        favourite: 0,
      },
    ]);

    const client: any = (table: string) => {
      if (table === "wall_item" || table === "wall_item as wi") {
        return wallItemBuilder;
      }
      if (table === "wall_item_likes") {
        const likesBuilder = buildBuilder();
        likesBuilder.select.mockResolvedValue([]);
        return likesBuilder;
      }
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {
      upload: jest.fn().mockResolvedValue({
        objectKey: "wall/meet-1/item.png",
        url: "https://cdn.example.com/wall.png",
      }),
    } as unknown as MinioService;
    const service = new MeetsService(db, minio);

    const portraitPng = Buffer.from(
      "89504e470d0a1a0a0000000d494844520000012c00000258080600000072b60d240000000049454e44ae426082",
      "hex",
    );

    await expect(
      service.createWallItem(
        "meet-1",
        { comment: "Great day out", stars: 5 },
        {
          originalname: "item.png",
          mimetype: "image/png",
          size: portraitPng.length,
          buffer: portraitPng,
        },
        {
          userId: "user-1",
          attendeeId: "attendee-1",
        },
      ),
    ).resolves.toEqual({
      wallItem: expect.objectContaining({
        id: "wall-1",
        meetId: "meet-1",
        createdBy: "user-1",
        attendeeId: "attendee-1",
        authorName: "Alice",
        stars: 5,
        aspect: "P",
        likesCount: 0,
        dislikesCount: 0,
        heartsCount: 0,
        likedByMe: false,
      }),
    });

    expect(minio.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^wall\/meet-1\//),
      portraitPng,
      "image/png",
    );
    expect(wallItemBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        meet_id: "meet-1",
        created_by: "user-1",
        attendee_id: "attendee-1",
        comment: "Great day out",
        stars: 5,
        aspect: "P",
      }),
      ["*"],
    );
  });

  it("lists wall items with separate reaction counts and reaction state", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.select.mockResolvedValue([
      {
        id: "wall-1",
        meet_id: "meet-1",
        comment: "Nice route",
        favourite: 2,
        attendee_name: "Alice",
        created_at: "2026-04-29T08:00:00.000Z",
      },
      {
        id: "wall-2",
        meet_id: "meet-1",
        stars: 4,
        favourite: 0,
        author_first_name: "Bob",
        author_last_name: "Stone",
        created_at: "2026-04-29T07:00:00.000Z",
      },
    ]);

    const likesBuilder = buildBuilder();
    likesBuilder.select.mockResolvedValue([
      { wall_item_id: "wall-1", user_id: "user-1", reaction: "like" },
      { wall_item_id: "wall-1", user_id: "user-2", reaction: "like" },
      { wall_item_id: "wall-1", user_id: "user-4", reaction: "dislike" },
      { wall_item_id: "wall-1", user_id: "user-5", reaction: "heart" },
      { wall_item_id: "wall-2", user_id: "user-3", reaction: "dislike" },
    ]);

    const client: any = (table: string) => {
      if (table === "wall_item as wi") return wallItemBuilder;
      if (table === "wall_item_likes") return likesBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.listWallItems("meet-1", { userId: "user-1" }),
    ).resolves.toEqual({
      wallItems: [
        expect.objectContaining({
          id: "wall-1",
          attendeeId: null,
          authorName: "Alice",
          likesCount: 2,
          dislikesCount: 1,
          heartsCount: 1,
          likedByMe: true,
          myReaction: "like",
          favourite: 2,
        }),
        expect.objectContaining({
          id: "wall-2",
          authorName: "Bob Stone",
          likesCount: 0,
          dislikesCount: 1,
          heartsCount: 0,
          likedByMe: false,
          stars: 4,
        }),
      ],
    });
  });

  it("only returns attendeeId on wall items that belong to the current actor", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.select.mockResolvedValue([
      {
        id: "wall-1",
        meet_id: "meet-1",
        attendee_id: "attendee-1",
        attendee_name: "Alice",
        favourite: 0,
        created_at: "2026-04-29T08:00:00.000Z",
      },
      {
        id: "wall-2",
        meet_id: "meet-1",
        attendee_id: "attendee-2",
        attendee_name: "Bob",
        favourite: 0,
        created_at: "2026-04-29T07:00:00.000Z",
      },
    ]);

    const likesBuilder = buildBuilder();
    likesBuilder.select.mockResolvedValue([]);

    const client: any = (table: string) => {
      if (table === "wall_item as wi") return wallItemBuilder;
      if (table === "wall_item_likes") return likesBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.listWallItems("meet-1", { attendeeId: "attendee-1" }),
    ).resolves.toEqual({
      wallItems: [
        expect.objectContaining({
          id: "wall-1",
          attendeeId: "attendee-1",
        }),
        expect.objectContaining({
          id: "wall-2",
          attendeeId: null,
        }),
      ],
    });
  });

  it("reorders meet wall favourites and resets previous favourite ranks", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.pluck.mockResolvedValue(["wall-2", "wall-1"]);

    const transactionBuilder = buildBuilder();
    transactionBuilder.update.mockResolvedValue(1);

    const transactionClient: any = (table: string) => {
      if (table === "wall_item") return transactionBuilder;
      return buildBuilder();
    };

    const client: any = (table: string) => {
      if (table === "wall_item") return wallItemBuilder;
      return buildBuilder();
    };
    client.transaction = jest.fn(async (callback: any) =>
      callback(transactionClient),
    );

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);
    const listWallItemsSpy = jest
      .spyOn(service, "listWallItems")
      .mockResolvedValue({
        wallItems: [
          { id: "wall-2", favourite: 2 } as any,
          { id: "wall-1", favourite: 1 } as any,
          { id: "wall-3", favourite: 0 } as any,
        ],
      });

    await expect(
      service.orderWallItemFavourites("meet-1", ["wall-2", "wall-1"]),
    ).resolves.toEqual({
      wallItems: [
        { id: "wall-2", favourite: 2 },
        { id: "wall-1", favourite: 1 },
      ],
    });

    expect(transactionBuilder.update).toHaveBeenNthCalledWith(1, {
      favourite: 0,
    });
    expect(transactionBuilder.update).toHaveBeenNthCalledWith(2, {
      favourite: 2,
    });
    expect(transactionBuilder.update).toHaveBeenNthCalledWith(3, {
      favourite: 1,
    });
    expect(listWallItemsSpy).toHaveBeenCalledWith("meet-1");
  });

  it("updates a wall item comment for the original author", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.first
      .mockResolvedValueOnce({
        id: "wall-1",
        meet_id: "meet-1",
        created_by: "user-1",
        attendee_id: "attendee-1",
        comment: "Original comment",
      })
      .mockResolvedValueOnce({
        id: "wall-1",
        meet_id: "meet-1",
        created_by: "user-1",
        attendee_id: "attendee-1",
        attendee_name: "Alice",
        comment: "Updated comment",
        favourite: 0,
      });

    const likesBuilder = buildBuilder();
    likesBuilder.select.mockResolvedValue([]);

    const client: any = (table: string) => {
      if (table === "wall_item" || table === "wall_item as wi") {
        return wallItemBuilder;
      }
      if (table === "wall_item_likes") {
        return likesBuilder;
      }
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.updateWallItemComment("meet-1", "wall-1", "  Updated comment  ", {
        userId: "user-1",
        attendeeId: "attendee-1",
      }),
    ).resolves.toEqual({
      wallItem: expect.objectContaining({
        id: "wall-1",
        comment: "Updated comment",
      }),
    });

    expect(wallItemBuilder.update).toHaveBeenCalledWith({
      comment: "Updated comment",
    });
  });

  it("rejects wall item comment editing for non-authors", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.first.mockResolvedValue({
      id: "wall-1",
      meet_id: "meet-1",
      created_by: "user-1",
      attendee_id: "attendee-1",
      comment: "Original comment",
    });

    const client: any = (table: string) => {
      if (table === "wall_item") {
        return wallItemBuilder;
      }
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.updateWallItemComment("meet-1", "wall-1", "Updated comment", {
        userId: "user-2",
      }),
    ).rejects.toThrow("You do not have permission to edit this wall item");
  });

  it("removes a wall item for the original author", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.first.mockResolvedValue({
      id: "wall-1",
      meet_id: "meet-1",
      created_by: "user-1",
      attendee_id: "attendee-1",
    });
    wallItemBuilder.del.mockResolvedValue(1);

    const client: any = (table: string) => {
      if (table === "wall_item") {
        return wallItemBuilder;
      }
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.removeWallItem("meet-1", "wall-1", { userId: "user-1" }),
    ).resolves.toEqual({
      deleted: true,
    });
  });

  it("rejects wall item deletion for non-authors", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.first.mockResolvedValue({
      id: "wall-1",
      meet_id: "meet-1",
      created_by: "user-1",
      attendee_id: "attendee-1",
    });

    const client: any = (table: string) => {
      if (table === "wall_item") {
        return wallItemBuilder;
      }
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.removeWallItem("meet-1", "wall-1", { userId: "user-2" }),
    ).rejects.toThrow("You do not have permission to remove this wall item");
  });

  it("updates a wall item reaction idempotently and returns the updated reaction", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.first
      .mockResolvedValueOnce({
        id: "wall-1",
        meet_id: "meet-1",
        comment: "Solid hike",
        favourite: 0,
        author_first_name: "Sam",
        author_last_name: "Trail",
      })
      .mockResolvedValueOnce({
        id: "wall-1",
        meet_id: "meet-1",
        comment: "Solid hike",
        favourite: 0,
        author_first_name: "Sam",
        author_last_name: "Trail",
      });

    const likesBuilder = buildBuilder();
    likesBuilder.select.mockResolvedValue([
      { wall_item_id: "wall-1", user_id: "user-1", reaction: "heart" },
      { wall_item_id: "wall-1", user_id: "user-2", reaction: "like" },
    ]);
    likesBuilder.first.mockResolvedValue({ id: "like-1" });

    const client: any = (table: string) => {
      if (table === "wall_item" || table === "wall_item as wi") {
        return wallItemBuilder;
      }
      if (table === "wall_item_likes") return likesBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.updateWallItemReaction(
        "meet-1",
        "wall-1",
        { userId: "user-1" },
        "heart",
      ),
    ).resolves.toEqual({
      wallItem: expect.objectContaining({
        id: "wall-1",
        authorName: "Sam Trail",
        likesCount: 1,
        dislikesCount: 0,
        heartsCount: 1,
        likedByMe: false,
        myReaction: "heart",
      }),
    });

    expect(likesBuilder.update).toHaveBeenCalledWith({ reaction: "heart" });
  });

  it("creates attendee-based reactions and returns attendee reaction state", async () => {
    const wallItemBuilder = buildBuilder();
    wallItemBuilder.first
      .mockResolvedValueOnce({
        id: "wall-1",
        meet_id: "meet-1",
        comment: "Solid hike",
        favourite: 0,
        author_first_name: "Sam",
        author_last_name: "Trail",
      })
      .mockResolvedValueOnce({
        id: "wall-1",
        meet_id: "meet-1",
        comment: "Solid hike",
        favourite: 0,
        author_first_name: "Sam",
        author_last_name: "Trail",
      });

    const likesBuilder = buildBuilder();
    likesBuilder.first.mockResolvedValue(undefined);
    likesBuilder.insert.mockResolvedValue([{ id: "like-1" }]);
    likesBuilder.select.mockResolvedValue([
      {
        wall_item_id: "wall-1",
        attendee_id: "attendee-1",
        reaction: "dislike",
      },
      { wall_item_id: "wall-1", user_id: "user-2", reaction: "like" },
    ]);

    const client: any = (table: string) => {
      if (table === "wall_item" || table === "wall_item as wi") {
        return wallItemBuilder;
      }
      if (table === "wall_item_likes") return likesBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.updateWallItemReaction(
        "meet-1",
        "wall-1",
        { attendeeId: "attendee-1" },
        "dislike",
      ),
    ).resolves.toEqual({
      wallItem: expect.objectContaining({
        id: "wall-1",
        likesCount: 1,
        dislikesCount: 1,
        likedByMe: false,
        myReaction: "dislike",
      }),
    });

    expect(likesBuilder.insert).toHaveBeenCalledWith(
      {
        wall_item_id: "wall-1",
        user_id: null,
        attendee_id: "attendee-1",
        reaction: "dislike",
      },
      ["id"],
    );
  });

  it("returns attendee history by matching email across other meets", async () => {
    const attendeeBuilder = buildBuilder();
    attendeeBuilder.first.mockResolvedValue({
      email: "alex@example.com",
    });

    const historyBuilder = buildBuilder();
    historyBuilder.select.mockResolvedValue([
      {
        meet_id: "meet-2",
        status_id: 7,
        start_time: "2026-03-20T08:00:00.000Z",
        name: "Cliff Walk",
        status: "confirmed",
      },
      {
        meet_id: "meet-3",
        status_id: 3,
        start_time: "2026-02-01T09:00:00.000Z",
        name: "Trail Run",
        status: "waitlisted",
      },
    ]);

    const client: any = (table: string) => {
      if (table === "meet_attendees") return attendeeBuilder;
      if (table === "meet_attendees as ma") return historyBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.listAttendeeHistory("meet-1", "attendee-1"),
    ).resolves.toEqual([
      {
        meetId: "meet-2",
        date: "2026-03-20T08:00:00.000Z",
        meetName: "Cliff Walk",
        attendeeStatus: "no-show",
      },
      {
        meetId: "meet-3",
        date: "2026-02-01T09:00:00.000Z",
        meetName: "Trail Run",
        attendeeStatus: "waitlisted",
      },
    ]);
  });

  it("returns empty attendee history when the attendee has no email address", async () => {
    const attendeeBuilder = buildBuilder();
    attendeeBuilder.first.mockResolvedValue({
      email: null,
    });

    const historyBuilder = buildBuilder();

    const client: any = (table: string) => {
      if (table === "meet_attendees") return attendeeBuilder;
      if (table === "meet_attendees as ma") return historyBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.listAttendeeHistory("meet-1", "attendee-1"),
    ).resolves.toEqual([]);

    expect(historyBuilder.select).not.toHaveBeenCalled();
  });

  it("throws when attendee history is requested for a missing attendee", async () => {
    const attendeeBuilder = buildBuilder();
    attendeeBuilder.first.mockResolvedValue(undefined);

    const client: any = (table: string) => {
      if (table === "meet_attendees") return attendeeBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await expect(
      service.listAttendeeHistory("meet-1", "missing-attendee"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("excludes the current attendee row when listing attendee history", async () => {
    const attendeeBuilder = buildBuilder();
    attendeeBuilder.first.mockResolvedValue({
      email: "alex@example.com",
    });

    const historyBuilder = buildBuilder();
    historyBuilder.select.mockResolvedValue([]);

    const client: any = (table: string) => {
      if (table === "meet_attendees") return attendeeBuilder;
      if (table === "meet_attendees as ma") return historyBuilder;
      return buildBuilder();
    };
    client.raw = jest.fn(() => "raw");

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new MeetsService(db, minio);

    await service.listAttendeeHistory("meet-1", "attendee-1");

    expect(historyBuilder.andWhereNot).toHaveBeenCalledWith(
      "ma.id",
      "attendee-1",
    );
  });
});
