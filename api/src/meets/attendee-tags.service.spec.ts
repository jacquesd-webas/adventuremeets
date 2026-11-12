import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AttendeeTagsService } from "./attendee-tags.service";

describe("AttendeeTagsService", () => {
  const meetId = "meet-id";
  const attendeeId = "attendee-id";
  const first = jest.fn();
  const distinct = jest.fn();
  const select = jest.fn();
  const where = jest.fn();
  const orderBy = jest.fn();
  const insert = jest.fn();
  const ignore = jest.fn();
  const onConflict = jest.fn();
  const forUpdate = jest.fn();
  const update = jest.fn();
  const del = jest.fn();
  const query = {
    first,
    distinct,
    select,
    where,
    orderBy,
    insert,
    ignore,
    onConflict,
    forUpdate,
    update,
    del,
  };
  const client = Object.assign(jest.fn().mockReturnValue(query), {
    transaction: jest.fn(),
  });
  const database = { getClient: () => client } as unknown as DatabaseService;
  const service = new AttendeeTagsService(database);

  beforeEach(() => {
    jest.clearAllMocks();
    where.mockReturnValue(query);
    distinct.mockReturnValue(query);
    select.mockReturnValue(query);
    insert.mockReturnValue(query);
    onConflict.mockReturnValue(query);
    forUpdate.mockReturnValue(query);
    update.mockResolvedValue(1);
    del.mockResolvedValue(1);
    client.transaction.mockImplementation(async (callback) => callback(client));
    first.mockResolvedValue({ id: attendeeId, notes: "Bring a spare map" });
    orderBy.mockResolvedValue([{ tag: "First aid" }]);
    ignore.mockResolvedValue(1);
  });

  it("lists distinct tags used in the meet", async () => {
    await expect(service.listMeetTags(meetId)).resolves.toEqual(["First aid"]);
    expect(client).toHaveBeenCalledWith("attendee_tags");
    expect(distinct).toHaveBeenCalledWith("tag");
    expect(where).toHaveBeenCalledWith({ meet_id: meetId });
  });

  it("refuses tags for an attendee outside the meet", async () => {
    first.mockResolvedValueOnce(undefined);
    await expect(
      service.listAttendeeTags(meetId, attendeeId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(where).toHaveBeenCalledWith({ id: attendeeId, meet_id: meetId });
    expect(select).not.toHaveBeenCalledWith("tag");
  });

  it("trims and inserts a tag without creating duplicates", async () => {
    await expect(
      service.createTag(meetId, attendeeId, "  First aid  "),
    ).resolves.toBe("First aid");
    expect(insert).toHaveBeenCalledWith({
      meet_id: meetId,
      attendee_id: attendeeId,
      tag: "First aid",
    });
    expect(onConflict).toHaveBeenCalledWith(["attendee_id", "tag"]);
    expect(ignore).toHaveBeenCalled();
  });

  it("returns saved notes with an attendee's tags", async () => {
    await expect(
      service.getAttendeeNotesAndTags(meetId, attendeeId),
    ).resolves.toEqual({
      notes: "Bring a spare map",
      tags: ["First aid"],
    });
    expect(where).toHaveBeenCalledWith({ id: attendeeId, meet_id: meetId });
  });

  it("replaces notes and selected tags in one transaction", async () => {
    await expect(
      service.updateNotesAndTags(meetId, attendeeId, {
        notes: "  Bring a spare map  ",
        tags: [" First aid ", "Transport", "Transport"],
      }),
    ).resolves.toEqual({
      notes: "Bring a spare map",
      tags: ["First aid", "Transport"],
    });
    expect(client.transaction).toHaveBeenCalledTimes(1);
    expect(forUpdate).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({ notes: "Bring a spare map" });
    expect(del).toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith([
      { meet_id: meetId, attendee_id: attendeeId, tag: "First aid" },
      { meet_id: meetId, attendee_id: attendeeId, tag: "Transport" },
    ]);
  });

  it("does not write if the attendee belongs to another meet", async () => {
    first.mockResolvedValueOnce(undefined);
    await expect(
      service.updateNotesAndTags(meetId, attendeeId, { notes: "", tags: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(update).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it("rejects blank tags", async () => {
    await expect(
      service.createTag(meetId, attendeeId, "   "),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(first).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});
