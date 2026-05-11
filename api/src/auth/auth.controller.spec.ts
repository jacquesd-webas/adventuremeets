import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { UserProfile } from "../users/dto/user-profile.dto";

describe("AuthController", () => {
  let controller: AuthController;

  const authService = {
    login: jest.fn(),
    refresh: jest.fn(),
    ensureOrganizationJoinable: jest.fn(),
    register: jest.fn(),
    requestEmailVerification: jest.fn(),
    verifyEmailCode: jest.fn(),
  } as unknown as AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findOrganizationRoles: jest.fn(),
    listPendingInvitesByEmail: jest.fn(),
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

  it("delegates login to auth service", async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const dto = {
      email: "jane@example.com",
      password: "Password123!",
    };

    await expect(controller.login(dto as any)).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it("delegates refresh to auth service", async () => {
    (authService.refresh as jest.Mock).mockResolvedValue({
      accessToken: "next-access",
      refreshToken: "next-refresh",
    });

    await expect(
      controller.refresh({ refreshToken: "refresh-token" } as any),
    ).resolves.toEqual({
      accessToken: "next-access",
      refreshToken: "next-refresh",
    });
    expect(authService.refresh).toHaveBeenCalledWith({
      refreshToken: "refresh-token",
    });
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

  it("requires an organizationId for registerOrganizationCheck", async () => {
    await expect(controller.registerOrganizationCheck()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("delegates registerOrganizationCheck to auth service", async () => {
    (authService.ensureOrganizationJoinable as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(
      controller.registerOrganizationCheck("org-1"),
    ).resolves.toEqual({ allowed: true });
    expect(authService.ensureOrganizationJoinable).toHaveBeenCalledWith(
      "org-1",
    );
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

  it("rejects verification confirmation without an authenticated user", async () => {
    await expect(
      controller.confirmEmailVerification({ code: "123456" } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("delegates email verification confirmation for authenticated users", async () => {
    (authService.verifyEmailCode as jest.Mock).mockResolvedValue(undefined);

    await expect(
      controller.confirmEmailVerification({ code: "123456" } as any, user),
    ).resolves.toEqual({
      ok: true,
    });
    expect(authService.verifyEmailCode).toHaveBeenCalledWith(
      user.id,
      "123456",
    );
  });

  it("returns the authenticated user profile from auth/me", async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({
      id: "user-1",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
    });
    (usersService.findOrganizationRoles as jest.Mock).mockResolvedValue([
      { organizationId: "org-1", role: "admin" },
      { organizationId: "org-2", role: "member" },
    ]);
    (usersService.listPendingInvitesByEmail as jest.Mock).mockResolvedValue([
      { id: "invite-1" },
    ]);

    await expect(controller.me(user)).resolves.toEqual({
      id: "user-1",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
      organizations: { "org-1": "admin", "org-2": "member" },
      pendingInvites: [{ id: "invite-1" }],
    });
  });
});
