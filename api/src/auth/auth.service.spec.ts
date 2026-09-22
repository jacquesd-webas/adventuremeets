import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { EmailService } from "../email/email.service";
import { RegisterDto } from "./dto/register.dto";
import { UserProfile } from "../users/dto/user-profile.dto";
import { OrganizationsService } from "../organizations/organizations.service";

describe("AuthService", () => {
  let service: AuthService;

  const usersService = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updateLogin: jest.fn(),
    ensureOrganizationMembership: jest.fn(),
    isOrganizationPrivate: jest.fn(),
    linkByEmail: jest.fn(),
    getEmailVerificationInfo: jest.fn(),
    setEmailVerificationToken: jest.fn(),
    clearEmailVerificationToken: jest.fn(),
    incrementEmailVerificationAttempts: jest.fn(),
    lockEmailVerification: jest.fn(),
    markEmailVerified: jest.fn(),
  } as unknown as UsersService;

  const jwtService = {
    sign: jest.fn(),
  } as unknown as JwtService;

  const emailService = {
    sendEmail: jest.fn(),
  } as unknown as EmailService;

  const organizationsService = {
    removeEmptyPrivateOrganizationsForUser: jest.fn(),
  } as unknown as OrganizationsService;

  const baseUser: UserProfile = {
    id: "user-1",
    email: "jane@example.com",
    organizations: {},
    pendingInvites: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersService,
      jwtService,
      emailService,
      organizationsService,
    );
    (jwtService.sign as jest.Mock)
      .mockReturnValueOnce("access-token")
      .mockReturnValueOnce("refresh-token");
  });

  it("registers a user without sending a verification email", async () => {
    const previousDisable = process.env.RECAPTCHA_DISABLE;
    process.env.RECAPTCHA_DISABLE = "true";

    (usersService.create as jest.Mock).mockResolvedValue({ id: baseUser.id });
    (usersService.findById as jest.Mock).mockResolvedValue(baseUser);
    (usersService.linkByEmail as jest.Mock).mockResolvedValue(undefined);

    const dto: RegisterDto = {
      email: baseUser.email,
      password: "Password123!",
      firstName: "Jane",
      lastName: "Doe",
    };

    try {
      await expect(service.register(dto)).resolves.toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    } finally {
      process.env.RECAPTCHA_DISABLE = previousDisable;
    }

    expect(usersService.create).toHaveBeenCalledWith(dto);
    expect(usersService.linkByEmail).toHaveBeenCalledWith(
      baseUser.email,
      baseUser.id,
    );
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it("rejects refresh tokens with the wrong token type", async () => {
    (jwtService.sign as jest.Mock).mockReset();
    (jwtService as any).verify = jest.fn().mockReturnValue({
      sub: baseUser.id,
      type: "access",
    });

    await expect(
      service.refresh({ refreshToken: "wrong-type-token" }),
    ).rejects.toThrow("Invalid refresh token");
  });

  it("rejects refresh when the user no longer exists", async () => {
    (jwtService.sign as jest.Mock).mockReset();
    (jwtService as any).verify = jest.fn().mockReturnValue({
      sub: "missing-user",
      type: "refresh",
    });
    (usersService.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      service.refresh({ refreshToken: "refresh-token" }),
    ).rejects.toThrow("User not found");
  });

  it("returns incorrect email or password when credentials do not match", async () => {
    jest
      .spyOn(service, "validateUser")
      .mockResolvedValue({ user: baseUser, isValid: false });
    (usersService.updateLogin as jest.Mock).mockResolvedValue(undefined);

    await expect(
      service.login({ email: baseUser.email, password: "bad" } as any),
    ).rejects.toThrow("Incorrect email or password");

    expect(usersService.updateLogin).toHaveBeenCalledWith(baseUser.id, {
      isSuccess: false,
    });
  });

  it("joins a public organization during login when organizationId is provided", async () => {
    jest
      .spyOn(service, "validateUser")
      .mockResolvedValue({ user: baseUser, isValid: true });
    jest
      .spyOn(service, "ensureOrganizationJoinable")
      .mockResolvedValue(undefined);
    (usersService.updateLogin as jest.Mock).mockResolvedValue(undefined);
    (usersService.ensureOrganizationMembership as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      organizationsService.removeEmptyPrivateOrganizationsForUser as jest.Mock
    ).mockResolvedValue(undefined);
    (usersService.findById as jest.Mock).mockResolvedValue({
      ...baseUser,
      organizations: { "org-1": "member" },
    });

    await expect(
      service.login({
        email: baseUser.email,
        password: "Password123!",
        organizationId: "org-1",
      } as any),
    ).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    expect(service.ensureOrganizationJoinable).toHaveBeenCalledWith("org-1");
    expect(usersService.ensureOrganizationMembership).toHaveBeenCalledWith(
      baseUser.id,
      "org-1",
    );
    expect(
      organizationsService.removeEmptyPrivateOrganizationsForUser,
    ).toHaveBeenCalledWith(baseUser.id, "org-1");
    expect(usersService.findById).toHaveBeenCalledWith(baseUser.id);
  });

  it("rejects private organizations in ensureOrganizationJoinable", async () => {
    (usersService.isOrganizationPrivate as jest.Mock).mockResolvedValue(true);

    await expect(service.ensureOrganizationJoinable("org-1")).rejects.toThrow(
      "Invalid organisation invitation link",
    );
  });

  it("sends a verification email when explicitly requested", async () => {
    (usersService.getEmailVerificationInfo as jest.Mock).mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      email_verified_at: null,
    });
    (usersService.setEmailVerificationToken as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(
      service.requestEmailVerification(baseUser.id),
    ).resolves.toBeUndefined();

    expect(usersService.setEmailVerificationToken).toHaveBeenCalledWith(
      baseUser.id,
      expect.any(String),
      expect.any(String),
    );
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: baseUser.email,
        subject: expect.any(String),
        text: expect.any(String),
        html: expect.any(String),
      }),
    );
  });

  it("does nothing when explicit verification is requested for an already verified user", async () => {
    (usersService.getEmailVerificationInfo as jest.Mock).mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      email_verified_at: "2026-04-14T08:00:00.000Z",
    });

    await expect(
      service.requestEmailVerification(baseUser.id),
    ).resolves.toBeUndefined();

    expect(usersService.setEmailVerificationToken).not.toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it("rejects explicit verification requests for missing users", async () => {
    (usersService.getEmailVerificationInfo as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      service.requestEmailVerification("missing-user"),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(usersService.setEmailVerificationToken).not.toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it("verifies the email when the provided code matches", async () => {
    const code = "123456";
    const token = require("crypto")
      .createHash("sha256")
      .update(code)
      .digest("hex");

    (usersService.getEmailVerificationInfo as jest.Mock).mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      email_verified_at: null,
      email_verification_token: token,
      email_verification_expires_at: "2099-01-01T00:00:00.000Z",
      email_verification_attempts: 0,
      email_verification_locked_until: null,
    });
    (usersService.markEmailVerified as jest.Mock).mockResolvedValue(undefined);

    await expect(
      service.verifyEmailCode(baseUser.id, code),
    ).resolves.toBeUndefined();

    expect(usersService.markEmailVerified).toHaveBeenCalledWith(baseUser.id);
    expect(
      usersService.incrementEmailVerificationAttempts,
    ).not.toHaveBeenCalled();
    expect(usersService.lockEmailVerification).not.toHaveBeenCalled();
  });

  it("rejects email verification when the code is missing", async () => {
    (usersService.getEmailVerificationInfo as jest.Mock).mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      email_verified_at: null,
      email_verification_token: null,
      email_verification_expires_at: null,
      email_verification_attempts: 0,
      email_verification_locked_until: null,
    });

    await expect(
      service.verifyEmailCode(baseUser.id, "123456"),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(usersService.markEmailVerified).not.toHaveBeenCalled();
  });

  it("clears expired verification codes", async () => {
    (usersService.getEmailVerificationInfo as jest.Mock).mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      email_verified_at: null,
      email_verification_token: "hash",
      email_verification_expires_at: "2000-01-01T00:00:00.000Z",
      email_verification_attempts: 0,
      email_verification_locked_until: null,
    });
    (usersService.clearEmailVerificationToken as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(
      service.verifyEmailCode(baseUser.id, "123456"),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(usersService.clearEmailVerificationToken).toHaveBeenCalledWith(
      baseUser.id,
    );
    expect(usersService.markEmailVerified).not.toHaveBeenCalled();
  });

  it("increments attempts and locks verification after too many invalid codes", async () => {
    const validToken = require("crypto")
      .createHash("sha256")
      .update("654321")
      .digest("hex");

    (usersService.getEmailVerificationInfo as jest.Mock).mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      email_verified_at: null,
      email_verification_token: validToken,
      email_verification_expires_at: "2099-01-01T00:00:00.000Z",
      email_verification_attempts: 4,
      email_verification_locked_until: null,
    });
    (
      usersService.incrementEmailVerificationAttempts as jest.Mock
    ).mockResolvedValue(undefined);
    (usersService.lockEmailVerification as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(
      service.verifyEmailCode(baseUser.id, "123456"),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(
      usersService.incrementEmailVerificationAttempts,
    ).toHaveBeenCalledWith(baseUser.id);
    expect(usersService.lockEmailVerification).toHaveBeenCalledWith(
      baseUser.id,
      expect.any(String),
    );
    expect(usersService.markEmailVerified).not.toHaveBeenCalled();
  });

  it("rejects verification while the code is temporarily locked", async () => {
    (usersService.getEmailVerificationInfo as jest.Mock).mockResolvedValue({
      id: baseUser.id,
      email: baseUser.email,
      email_verified_at: null,
      email_verification_token: "hash",
      email_verification_expires_at: "2099-01-01T00:00:00.000Z",
      email_verification_attempts: 2,
      email_verification_locked_until: "2099-01-01T00:15:00.000Z",
    });

    await expect(
      service.verifyEmailCode(baseUser.id, "123456"),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(
      usersService.incrementEmailVerificationAttempts,
    ).not.toHaveBeenCalled();
    expect(usersService.lockEmailVerification).not.toHaveBeenCalled();
    expect(usersService.markEmailVerified).not.toHaveBeenCalled();
  });
});
