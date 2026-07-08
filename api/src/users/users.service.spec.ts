import { NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { MinioService } from "../storage/minio.service";
import { UsersService } from "./users.service";

const buildBuilder = () => {
  const builder: any = {};
  builder.where = jest.fn().mockReturnValue(builder);
  builder.whereIn = jest.fn().mockReturnValue(builder);
  builder.orderBy = jest.fn().mockReturnValue(builder);
  builder.select = jest.fn();
  builder.first = jest.fn();
  builder.del = jest.fn();
  builder.insert = jest.fn();
  return builder;
};

describe("UsersService", () => {
  it("copies attendee answers into user autofill values and clears omitted keys", async () => {
    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
    });

    const attendeesBuilder = buildBuilder();
    attendeesBuilder.first.mockResolvedValue({
      id: "attendee-1",
      user_id: "user-1",
    });

    const definitionsBuilder = buildBuilder();
    definitionsBuilder.select.mockResolvedValue([
      { id: "definition-1", field_key: "fitness" },
      { id: "definition-2", field_key: "dietary" },
    ]);

    const valuesBuilder = buildBuilder();
    valuesBuilder.select.mockResolvedValue([
      { meta_definition_id: "definition-1", value: "Strong hiker" },
    ]);

    const client: any = (table: string) => {
      if (table === "meets") return meetsBuilder;
      if (table === "meet_attendees") return attendeesBuilder;
      if (table === "meet_meta_definitions") return definitionsBuilder;
      if (table === "meet_meta_values") return valuesBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new UsersService(db, minio);
    const saveUserMetaValuesSpy = jest
      .spyOn(service, "saveUserMetaValues")
      .mockResolvedValue([
        { key: "dietary", value: null },
        { key: "fitness", value: "Strong hiker" },
      ]);

    const result = await service.copyUserMetaValuesFromAttendee(
      "user-1",
      "meet-1",
      "attendee-1",
    );

    expect(saveUserMetaValuesSpy).toHaveBeenCalledWith("user-1", "org-1", [
      { key: "fitness", value: "Strong hiker" },
      { key: "dietary", value: null },
    ]);
    expect(result).toEqual({
      organizationId: "org-1",
      values: [
        { key: "dietary", value: null },
        { key: "fitness", value: "Strong hiker" },
      ],
    });
  });

  it("throws when the meet does not exist", async () => {
    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue(undefined);

    const client: any = (table: string) => {
      if (table === "meets") return meetsBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new UsersService(db, minio);

    await expect(
      service.copyUserMetaValuesFromAttendee("user-1", "meet-1", "attendee-1"),
    ).rejects.toThrow(new NotFoundException("Meet not found"));
  });

  it("throws when the attendee does not exist", async () => {
    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
    });

    const attendeesBuilder = buildBuilder();
    attendeesBuilder.first.mockResolvedValue(undefined);

    const client: any = (table: string) => {
      if (table === "meets") return meetsBuilder;
      if (table === "meet_attendees") return attendeesBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new UsersService(db, minio);

    await expect(
      service.copyUserMetaValuesFromAttendee("user-1", "meet-1", "attendee-1"),
    ).rejects.toThrow(new NotFoundException("Attendee not found"));
  });

  it("throws when the attendee belongs to a different user", async () => {
    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
    });

    const attendeesBuilder = buildBuilder();
    attendeesBuilder.first.mockResolvedValue({
      id: "attendee-1",
      user_id: "other-user",
    });

    const client: any = (table: string) => {
      if (table === "meets") return meetsBuilder;
      if (table === "meet_attendees") return attendeesBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const minio = {} as MinioService;
    const service = new UsersService(db, minio);

    await expect(
      service.copyUserMetaValuesFromAttendee("user-1", "meet-1", "attendee-1"),
    ).rejects.toThrow(new NotFoundException("Attendee not found"));
  });
});
