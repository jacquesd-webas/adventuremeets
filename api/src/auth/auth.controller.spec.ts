import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { UserProfile } from "../users/dto/user-profile.dto";

describe("AuthController", () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    requestEmailVerification: jest.fn(),
  } as unknown as AuthService;

  const usersService = {
    findByEmail: jest.fn(),
  } as unknown as UsersService;

  const user: UserProfile = {
    id: "user-1",
    email: "jane@example.com",
    organizations: {},
    pendingInvites: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService, usersService);
  });

  it("delegates register to auth service", async () => {
    (authService.register as jest.Mock).mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const dto = {
      email: "jane@example.com",
      password: "Password123!",
    };

    await expect(controller.register(dto as any)).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it("requires an email for registerCheck", async () => {
    await expect(controller.registerCheck()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("returns whether a registration email already exists", async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({ id: "user-1" });

    await expect(
      controller.registerCheck("jane@example.com"),
    ).resolves.toEqual({ exists: true });
  });

  it("rejects verification requests without an authenticated user", async () => {
    await expect(controller.requestEmailVerification()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("delegates explicit verification requests for authenticated users", async () => {
    (authService.requestEmailVerification as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(controller.requestEmailVerification(user)).resolves.toEqual({
      ok: true,
    });
    expect(authService.requestEmailVerification).toHaveBeenCalledWith(user.id);
  });
});
