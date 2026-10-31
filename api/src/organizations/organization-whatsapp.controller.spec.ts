import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { OrganizationWhatsappController } from "./organization-whatsapp.controller";
import { OrganizationWhatsappService } from "./organization-whatsapp.service";

describe("OrganizationWhatsappController", () => {
  const auth = { hasRole: jest.fn() } as unknown as AuthService;
  const whatsapp = {
    getConnection: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as OrganizationWhatsappService;
  const user = { id: "admin-1" } as UserProfile;
  const controller = new OrganizationWhatsappController(auth, whatsapp);

  beforeEach(() => jest.clearAllMocks());

  it("keeps the QR code and connection controls private to organization admins", async () => {
    await expect(controller.get("org-1")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    (auth.hasRole as jest.Mock).mockReturnValue(false);
    await expect(controller.get("org-1", user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(controller.connect("org-1", user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(controller.disconnect("org-1", user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(whatsapp.getConnection).not.toHaveBeenCalled();
    expect(whatsapp.connect).not.toHaveBeenCalled();
    expect(whatsapp.disconnect).not.toHaveBeenCalled();
  });

  it("lets an organization admin connect, inspect, and disconnect its number", async () => {
    (auth.hasRole as jest.Mock).mockReturnValue(true);
    (whatsapp.getConnection as jest.Mock).mockResolvedValue({
      status: "qr",
      qr: "code",
    });
    (whatsapp.connect as jest.Mock).mockResolvedValue({ status: "connecting" });
    (whatsapp.disconnect as jest.Mock).mockResolvedValue({
      status: "disconnecting",
    });

    await expect(controller.get("org-1", user)).resolves.toEqual({
      status: "qr",
      qr: "code",
    });
    await expect(controller.connect("org-1", user)).resolves.toEqual({
      status: "connecting",
    });
    await expect(controller.disconnect("org-1", user)).resolves.toEqual({
      status: "disconnecting",
    });
    expect(auth.hasRole).toHaveBeenCalledWith(user, "org-1", "admin");
  });
});
