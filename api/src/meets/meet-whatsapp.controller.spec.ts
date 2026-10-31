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
  const findOne = jest.fn().mockResolvedValue(meet);
  const hasRole = jest.fn().mockReturnValue(false);
  const controller = new MeetWhatsappController(
    { hasRole } as unknown as AuthService,
    { findOne } as unknown as MeetsService,
    { listChats: chats, send } as unknown as MeetWhatsappService,
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
});
