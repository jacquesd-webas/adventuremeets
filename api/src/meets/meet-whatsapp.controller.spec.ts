import { ForbiddenException } from "@nestjs/common";
import { MeetWhatsappController } from "./meet-whatsapp.controller";
import { MeetWhatsappService } from "./meet-whatsapp.service";
import { MeetsService } from "./meets.service";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";

describe("MeetWhatsappController", () => {
  const meet = {
    id: "meet-1",
    organizationId: "org-1",
    organizerId: "organizer-1",
  };
  const chats = jest.fn().mockResolvedValue([]);
  const send = jest.fn().mockResolvedValue({ sent: true });
  const createGroup = jest
    .fn()
    .mockResolvedValue({ chatId: "new-group@g.us", organizerAdded: true });
  const connectionStatus = jest.fn().mockResolvedValue({ connected: true });
  const groupInviteLink = jest
    .fn()
    .mockResolvedValue({ url: "https://chat.whatsapp.com/InviteCode123" });
  const findOne = jest.fn().mockResolvedValue(meet);
  const hasRole = jest.fn().mockReturnValue(false);
  const controller = new MeetWhatsappController(
    { hasRole } as unknown as AuthService,
    { findOne } as unknown as MeetsService,
    {
      listChats: chats,
      send,
      createGroup,
      connectionStatus,
      groupInviteLink,
    } as unknown as MeetWhatsappService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    hasRole.mockReturnValue(false);
  });

  it("allows the meet organiser to choose chats and send", async () => {
    const user = { id: "organizer-1" } as UserProfile;
    await controller.chats("meet-1", user);
    await controller.send(
      "meet-1",
      { chatId: "group@g.us", message: "Hello" },
      user,
    );
    expect(chats).toHaveBeenCalledWith(meet);
    expect(send).toHaveBeenCalledWith(meet, {
      chatId: "group@g.us",
      message: "Hello",
    });
  });

  it("rejects another member, including another organiser", async () => {
    const user = { id: "other-user" } as UserProfile;
    await expect(controller.chats("meet-1", user)).rejects.toThrow(
      ForbiddenException,
    );
    expect(chats).not.toHaveBeenCalled();
  });

  it("allows an organisation admin", async () => {
    hasRole.mockReturnValue(true);
    await controller.chats("meet-1", { id: "admin-1" } as UserProfile);
    expect(chats).toHaveBeenCalledWith(meet);
  });

  it("allows the organiser to create a group and rejects another member", async () => {
    await controller.createGroup("meet-1", {
      id: "organizer-1",
    } as UserProfile);
    expect(createGroup).toHaveBeenCalledWith(meet);
    await expect(
      controller.createGroup("meet-1", { id: "other-user" } as UserProfile),
    ).rejects.toThrow(ForbiddenException);
    expect(createGroup).toHaveBeenCalledTimes(1);
  });

  it("lets the organiser check whether the linked number is ready", async () => {
    expect(
      await controller.connection("meet-1", {
        id: "organizer-1",
      } as UserProfile),
    ).toEqual({ connected: true });
    expect(connectionStatus).toHaveBeenCalledWith(meet);
    await expect(
      controller.connection("meet-1", { id: "other-user" } as UserProfile),
    ).rejects.toThrow(ForbiddenException);
  });

  it("shows the group invite only to the organiser or an admin", async () => {
    const organizer = { id: "organizer-1" } as UserProfile;
    expect(await controller.groupInvite("meet-1", organizer)).toEqual({
      url: "https://chat.whatsapp.com/InviteCode123",
    });
    expect(groupInviteLink).toHaveBeenCalledWith(meet);
    await expect(
      controller.groupInvite("meet-1", { id: "other-user" } as UserProfile),
    ).rejects.toThrow(ForbiddenException);
    expect(groupInviteLink).toHaveBeenCalledTimes(1);
  });
});
