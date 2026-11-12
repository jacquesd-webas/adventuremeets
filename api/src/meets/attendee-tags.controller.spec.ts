import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { AttendeeTagsController } from "./attendee-tags.controller";
import { AttendeeTagsService } from "./attendee-tags.service";
import { MeetsService } from "./meets.service";

describe("AttendeeTagsController", () => {
  const meetId = "b8be20ef-7120-49ae-a5eb-b36de64d56aa";
  const attendeeId = "5fbe1b0e-6ab9-49c5-8c7d-e768208c073d";
  const user = { id: "organizer" } as UserProfile;
  const meets = {
    findOne: jest.fn().mockResolvedValue({
      id: meetId,
      organizationId: "organization",
      organizerId: user.id,
    }),
  } as unknown as MeetsService;
  const auth = {
    hasRole: jest.fn().mockReturnValue(true),
  } as unknown as AuthService;
  const tags = {
    listMeetTags: jest.fn().mockResolvedValue(["First aid"]),
    listAttendeeTags: jest.fn().mockResolvedValue(["First aid"]),
    getAttendeeNotesAndTags: jest.fn().mockResolvedValue({
      notes: "Bring a spare map",
      tags: ["First aid"],
    }),
    updateNotesAndTags: jest.fn().mockResolvedValue({
      notes: "Bring a spare map",
      tags: ["First aid"],
    }),
    createTag: jest.fn().mockResolvedValue("First aid"),
  } as unknown as AttendeeTagsService;
  const controller = new AttendeeTagsController(meets, auth, tags);

  beforeEach(() => jest.clearAllMocks());

  it("lists meet tags and attendee tags for the organiser", async () => {
    await expect(controller.listMeetTags(meetId, user)).resolves.toEqual({
      tags: ["First aid"],
    });
    await expect(
      controller.listAttendeeTags(meetId, attendeeId, user),
    ).resolves.toEqual({ notes: "Bring a spare map", tags: ["First aid"] });
    expect(tags.getAttendeeNotesAndTags).toHaveBeenCalledWith(
      meetId,
      attendeeId,
    );
  });

  it("saves notes and a complete tag selection", async () => {
    const body = { notes: "Bring a spare map", tags: ["First aid"] };
    await expect(
      controller.updateNotesAndTags(meetId, attendeeId, body, user),
    ).resolves.toEqual(body);
    expect(tags.updateNotesAndTags).toHaveBeenCalledWith(
      meetId,
      attendeeId,
      body,
    );
  });

  it("adds a tag for an attendee", async () => {
    await expect(
      controller.createTag(meetId, attendeeId, { tag: "First aid" }, user),
    ).resolves.toEqual({ tag: "First aid" });
    expect(tags.createTag).toHaveBeenCalledWith(
      meetId,
      attendeeId,
      "First aid",
    );
  });

  it("requires authentication and meet management permission", async () => {
    await expect(controller.listMeetTags(meetId)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    jest.spyOn(auth, "hasRole").mockReturnValue(false);
    await expect(
      controller.createTag(meetId, attendeeId, { tag: "First aid" }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tags.createTag).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing meet", async () => {
    jest.spyOn(meets, "findOne").mockResolvedValueOnce(undefined as never);
    await expect(controller.listMeetTags(meetId, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
