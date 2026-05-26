import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { MeetWallController } from "./meet-wall.controller";
import { MeetsService } from "./meets.service";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";

describe("MeetWallController", () => {
  let controller: MeetWallController;

  const meetsService = {
    findOne: jest.fn(),
    findMeetAttendeeByUser: jest.fn(),
    findMeetAttendeeById: jest.fn(),
    createWallItem: jest.fn(),
    listWallItems: jest.fn(),
    updateWallItemComment: jest.fn(),
    updateWallItemFavourite: jest.fn(),
    orderWallItemFavourites: jest.fn(),
    updateWallItemReaction: jest.fn(),
    removeWallItem: jest.fn(),
  } as unknown as MeetsService;

  const authService = {
    hasRole: jest.fn(),
  } as unknown as AuthService;

  const user: UserProfile = {
    id: "user-1",
    email: "user@example.com",
    organizations: { "org-1": "organizer" },
    pendingInvites: [],
  };

  const meet = {
    id: "meet-1",
    organizationId: "org-1",
    organizerId: "organizer-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MeetWallController(meetsService, authService);
  });

  it("returns not found for anonymous wall listing without an attendee id", async () => {
    await expect(controller.list("meet-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("allows attendee wall listing even without organization membership", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (authService.hasRole as jest.Mock).mockReturnValue(false);
    (meetsService.listWallItems as jest.Mock).mockResolvedValue({
      wallItems: [{ id: "wall-1" }],
    });

    await expect(controller.list("meet-1", undefined, user)).resolves.toEqual({
      wallItems: [{ id: "wall-1" }],
    });

    expect(meetsService.listWallItems).toHaveBeenCalledWith("meet-1", {
      userId: "user-1",
      attendeeId: "attendee-1",
    });
  });

  it("allows attendee wall listing by attendee id without login", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeById as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (meetsService.listWallItems as jest.Mock).mockResolvedValue({
      wallItems: [{ id: "wall-1" }],
    });

    await expect(controller.list("meet-1", "attendee-1")).resolves.toEqual({
      wallItems: [{ id: "wall-1" }],
    });

    expect(meetsService.listWallItems).toHaveBeenCalledWith("meet-1", {
      userId: undefined,
      attendeeId: "attendee-1",
    });
  });

  it("returns not found for anonymous wall listing with an invalid attendee id", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeById as jest.Mock).mockResolvedValue(null);

    await expect(
      controller.list("meet-1", "attendee-1"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects favourite updates for non-organizers", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.updateFavourite("meet-1", "wall-1", { favourite: 2 }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows a logged-in author to edit their wall comment", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (authService.hasRole as jest.Mock).mockReturnValue(false);
    (meetsService.updateWallItemComment as jest.Mock).mockResolvedValue({
      wallItem: { id: "wall-1", comment: "Updated comment" },
    });

    await expect(
      controller.update(
        "meet-1",
        "wall-1",
        { comment: "Updated comment" },
        user,
      ),
    ).resolves.toEqual({
      wallItem: { id: "wall-1", comment: "Updated comment" },
    });

    expect(meetsService.updateWallItemComment).toHaveBeenCalledWith(
      "meet-1",
      "wall-1",
      "Updated comment",
      {
        userId: "user-1",
        attendeeId: "attendee-1",
      },
    );
  });

  it("allows attendee comment editing by attendee id without login", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeById as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (meetsService.updateWallItemComment as jest.Mock).mockResolvedValue({
      wallItem: { id: "wall-1", comment: "Updated comment" },
    });

    await expect(
      controller.update(
        "meet-1",
        "wall-1",
        { comment: "Updated comment", attendeeId: "attendee-1" },
      ),
    ).resolves.toEqual({
      wallItem: { id: "wall-1", comment: "Updated comment" },
    });

    expect(meetsService.updateWallItemComment).toHaveBeenCalledWith(
      "meet-1",
      "wall-1",
      "Updated comment",
      {
        userId: undefined,
        attendeeId: "attendee-1",
      },
    );
  });

  it("allows the meet organiser to mark a wall item as favourite", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(false);
    (meetsService.updateWallItemFavourite as jest.Mock).mockResolvedValue({
      wallItem: { id: "wall-1", favourite: 3 },
    });

    await expect(
      controller.updateFavourite(
        "meet-1",
        "wall-1",
        { favourite: 3 },
        { ...user, id: "organizer-1" },
      ),
    ).resolves.toEqual({
      wallItem: { id: "wall-1", favourite: 3 },
    });
  });

  it("allows admins to reorder favourites", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _organizationId, role) => role === "admin",
    );
    (meetsService.orderWallItemFavourites as jest.Mock).mockResolvedValue({
      wallItems: [
        { id: "wall-2", favourite: 2 },
        { id: "wall-1", favourite: 1 },
      ],
    });

    await expect(
      controller.orderFavourites(
        "meet-1",
        { wallItemIds: ["wall-2", "wall-1"] },
        user,
      ),
    ).resolves.toEqual({
      wallItems: [
        { id: "wall-2", favourite: 2 },
        { id: "wall-1", favourite: 1 },
      ],
    });

    expect(meetsService.orderWallItemFavourites).toHaveBeenCalledWith(
      "meet-1",
      ["wall-2", "wall-1"],
    );
  });

  it("allows a logged-in organization member to react to a wall item", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue(null);
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _organizationId, role) => role === "member",
    );
    (meetsService.updateWallItemReaction as jest.Mock).mockResolvedValue({
      wallItem: { id: "wall-1" },
    });

    await expect(
      controller.updateReaction(
        "meet-1",
        "wall-1",
        { reaction: "dislike" },
        user,
      ),
    ).resolves.toEqual({
      wallItem: { id: "wall-1" },
    });
  });

  it("passes the reaction through to the service", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (meetsService.updateWallItemReaction as jest.Mock).mockResolvedValue({
      wallItem: { id: "wall-1" },
    });

    await expect(
      controller.updateReaction(
        "meet-1",
        "wall-1",
        { reaction: "heart" },
        user,
      ),
    ).resolves.toEqual({
      wallItem: { id: "wall-1" },
    });

    expect(meetsService.updateWallItemReaction).toHaveBeenCalledWith(
      "meet-1",
      "wall-1",
      {
        userId: "user-1",
        attendeeId: "attendee-1",
      },
      "heart",
    );
  });

  it("allows attendee reactions by attendee id without login", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeById as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (meetsService.updateWallItemReaction as jest.Mock).mockResolvedValue({
      wallItem: { id: "wall-1" },
    });

    await expect(
      controller.updateReaction(
        "meet-1",
        "wall-1",
        { reaction: "like", attendeeId: "attendee-1" },
        undefined,
      ),
    ).resolves.toEqual({
      wallItem: { id: "wall-1" },
    });

    expect(meetsService.updateWallItemReaction).toHaveBeenCalledWith(
      "meet-1",
      "wall-1",
      {
        userId: undefined,
        attendeeId: "attendee-1",
      },
      "like",
    );
  });

  it("passes createdBy and attendeeId when creating a wall item", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (authService.hasRole as jest.Mock).mockReturnValue(false);
    (meetsService.createWallItem as jest.Mock).mockResolvedValue({
      wallItem: { id: "wall-1" },
    });

    await expect(
      controller.create(
        "meet-1",
        { comment: "Great session" },
        undefined,
        user,
      ),
    ).resolves.toEqual({
      wallItem: { id: "wall-1" },
    });

    expect(meetsService.createWallItem).toHaveBeenCalledWith(
      "meet-1",
      { comment: "Great session" },
      undefined,
      {
        userId: "user-1",
        attendeeId: "attendee-1",
      },
    );
  });

  it("allows attendee wall posting by attendee id without login", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeById as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (meetsService.createWallItem as jest.Mock).mockResolvedValue({
      wallItem: { id: "wall-1" },
    });

    await expect(
      controller.create(
        "meet-1",
        { comment: "Great session", attendeeId: "attendee-1" },
        undefined,
        undefined,
      ),
    ).resolves.toEqual({
      wallItem: { id: "wall-1" },
    });

    expect(meetsService.createWallItem).toHaveBeenCalledWith(
      "meet-1",
      { comment: "Great session", attendeeId: "attendee-1" },
      undefined,
      {
        userId: undefined,
        attendeeId: "attendee-1",
      },
    );
  });

  it("rejects wall posting when the caller is neither a member nor an attendee", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue(null);
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.create("meet-1", { comment: "No access" }, undefined, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects non-image wall uploads", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.create(
        "meet-1",
        { comment: "Bad file" },
        { mimetype: "application/pdf" },
        user,
      ),
    ).rejects.toThrow("Only image uploads are allowed");
  });

  it("rejects wall reactions when the caller is neither a member nor an attendee", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue(null);
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.updateReaction("meet-1", "wall-1", { reaction: "like" }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects wall item deletion for non-authors and non-admins", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue(null);
    (authService.hasRole as jest.Mock).mockReturnValue(false);
    (meetsService.removeWallItem as jest.Mock).mockRejectedValue(
      new ForbiddenException("You do not have permission to remove this wall item"),
    );

    await expect(
      controller.remove("meet-1", "wall-1", undefined, user),
    ).rejects.toThrow(
      "You do not have permission to remove this wall item",
    );
  });

  it("allows admins to remove wall items", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _organizationId, role) => role === "admin",
    );
    (meetsService.removeWallItem as jest.Mock).mockResolvedValue({
      deleted: true,
    });

    await expect(
      controller.remove("meet-1", "wall-1", undefined, user),
    ).resolves.toEqual({
      deleted: true,
    });

    expect(meetsService.removeWallItem).toHaveBeenCalledWith(
      "meet-1",
      "wall-1",
      {
        userId: "user-1",
        attendeeId: undefined,
        canAdminDelete: true,
      },
    );
  });

  it("allows attendee wall item deletion by attendee id without login", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeById as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (meetsService.removeWallItem as jest.Mock).mockResolvedValue({
      deleted: true,
    });

    await expect(
      controller.remove("meet-1", "wall-1", "attendee-1"),
    ).resolves.toEqual({
      deleted: true,
    });

    expect(meetsService.removeWallItem).toHaveBeenCalledWith(
      "meet-1",
      "wall-1",
      {
        userId: undefined,
        attendeeId: "attendee-1",
        canAdminDelete: false,
      },
    );
  });

  it("allows logged-in authors to remove their own wall items", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findMeetAttendeeByUser as jest.Mock).mockResolvedValue({
      id: "attendee-1",
    });
    (authService.hasRole as jest.Mock).mockReturnValue(false);
    (meetsService.removeWallItem as jest.Mock).mockResolvedValue({
      deleted: true,
    });

    await expect(
      controller.remove("meet-1", "wall-1", undefined, user),
    ).resolves.toEqual({
      deleted: true,
    });

    expect(meetsService.removeWallItem).toHaveBeenCalledWith(
      "meet-1",
      "wall-1",
      {
        userId: "user-1",
        attendeeId: "attendee-1",
        canAdminDelete: false,
      },
    );
  });

  it("throws when the meet does not exist", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      controller.list("meet-1", undefined, user),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
