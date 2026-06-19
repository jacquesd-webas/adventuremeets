import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "./dto/user-profile.dto";
import { AuditLogService } from "../audit/audit-log.service";

describe("UsersController", () => {
  let controller: UsersController;

  const usersService = {
    findAllByOrganizations: jest.fn(),
    findById: jest.fn(),
    findIceInfoByUserId: jest.fn(),
    upsertIceInfo: jest.fn(),
    uploadAvatar: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    copyUserMetaValuesFromAttendee: jest.fn(),
    listUserMetaValues: jest.fn(),
    saveUserMetaValues: jest.fn(),
    remove: jest.fn(),
  } as unknown as UsersService;

  const authService = {
    getUserOrganizationIds: jest.fn(),
    hasAtLeastOneRole: jest.fn(),
    hasRole: jest.fn(),
  } as unknown as AuthService;

  const auditLogService = {
    addRecord: jest.fn(),
  } as unknown as AuditLogService;

  const adminUser: UserProfile = {
    id: "admin-1",
    email: "admin@example.com",
    organizations: { "org-1": "admin" },
    pendingInvites: [],
  };

  const memberUser: UserProfile = {
    id: "member-1",
    email: "member@example.com",
    organizations: { "org-1": "member" },
    pendingInvites: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService, authService, auditLogService);
  });

  it.each([
    ["getMyIceInfo", () => controller.getMyIceInfo()],
    ["updateMyIceInfo", () => controller.updateMyIceInfo({})],
    [
      "uploadMyAvatar",
      () => controller.uploadMyAvatar({ mimetype: "image/png" } as any),
    ],
    ["findOne", () => controller.findOne("user-1")],
    ["create", () => controller.create({ organizationId: "org-1" } as any)],
    ["update", () => controller.update("user-1", {} as any)],
    ["listMetaValues", () => controller.listMetaValues("user-1", "org-1")],
    [
      "saveMetaValues",
      () =>
        controller.saveMetaValues(
          "user-1",
          { organizationId: "org-1", values: [] } as any,
        ),
    ],
    ["remove", () => controller.remove("user-1")],
  ])("rejects unauthenticated %s access", async (_name, action) => {
    await expect(action()).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns the caller's own ICE info", async () => {
    (usersService.findIceInfoByUserId as jest.Mock).mockResolvedValue({
      iceName: "Alex",
      icePhone: "+27123456789",
    });

    await expect(controller.getMyIceInfo(memberUser)).resolves.toEqual({
      iceInfo: {
        iceName: "Alex",
        icePhone: "+27123456789",
      },
    });
  });

  it("updates the caller's own ICE info", async () => {
    (usersService.upsertIceInfo as jest.Mock).mockResolvedValue({
      iceMedicalHistory: "Asthma",
    });

    await expect(
      controller.updateMyIceInfo(
        { iceMedicalHistory: "Asthma" },
        memberUser,
      ),
    ).resolves.toEqual({
      iceInfo: { iceMedicalHistory: "Asthma" },
    });
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "member-1",
      attendeeId: null,
      meetId: null,
      action: "updated",
      target: "ice info",
    });
  });

  it("copies the caller's meta values from an attendee submission", async () => {
    (usersService.copyUserMetaValuesFromAttendee as jest.Mock).mockResolvedValue(
      {
        organizationId: "org-1",
        values: [{ key: "gear", value: "Helmet" }],
      },
    );

    await expect(
      controller.copyMyMetaValuesFromAttendee(
        { meetId: "meet-1", attendeeId: "5f4da8b4-b217-4fd0-99aa-bf10f1ef5a1e" },
        memberUser,
      ),
    ).resolves.toEqual({
      organizationId: "org-1",
      metaValues: [{ key: "gear", value: "Helmet" }],
    });
    expect(usersService.copyUserMetaValuesFromAttendee).toHaveBeenCalledWith(
      memberUser.id,
      "meet-1",
      "5f4da8b4-b217-4fd0-99aa-bf10f1ef5a1e",
    );
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "member-1",
      attendeeId: "5f4da8b4-b217-4fd0-99aa-bf10f1ef5a1e",
      meetId: "meet-1",
      action: "saved",
      target: "signup answers",
    });
  });

  it("rejects unauthenticated remember-my-answers copying", async () => {
    await expect(
      controller.copyMyMetaValuesFromAttendee({
        meetId: "meet-1",
        attendeeId: "5f4da8b4-b217-4fd0-99aa-bf10f1ef5a1e",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("uploads the caller's avatar", async () => {
    (usersService.uploadAvatar as jest.Mock).mockResolvedValue({
      id: "member-1",
      avatarUrl: "https://cdn.example.com/avatar.jpg",
    });

    await expect(
      controller.uploadMyAvatar(
        {
          mimetype: "image/jpeg",
          buffer: Buffer.from("image"),
          originalname: "avatar.jpg",
        },
        memberUser,
      ),
    ).resolves.toEqual({
      user: {
        id: "member-1",
        avatarUrl: "https://cdn.example.com/avatar.jpg",
      },
    });
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "member-1",
      attendeeId: null,
      meetId: null,
      action: "updated",
      target: "avatar",
    });
  });

  it("rejects unauthenticated user listing", async () => {
    await expect(controller.findAll()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("lists users for admin organizations", async () => {
    (authService.getUserOrganizationIds as jest.Mock).mockReturnValue([
      "org-1",
      "org-2",
    ]);
    (usersService.findAllByOrganizations as jest.Mock).mockResolvedValue([
      { id: "user-1" },
    ]);

    await expect(controller.findAll(adminUser)).resolves.toEqual({
      users: [{ id: "user-1" }],
    });
    expect(authService.getUserOrganizationIds).toHaveBeenCalledWith(
      adminUser,
      "admin",
    );
    expect(usersService.findAllByOrganizations).toHaveBeenCalledWith([
      "org-1",
      "org-2",
    ]);
  });

  it("rejects user listing when the caller is not admin anywhere", async () => {
    (authService.getUserOrganizationIds as jest.Mock).mockReturnValue([]);

    await expect(controller.findAll(memberUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("returns a single user for an admin", async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({ id: "user-2" });
    (authService.getUserOrganizationIds as jest.Mock).mockReturnValue([
      "org-1",
    ]);
    (authService.hasAtLeastOneRole as jest.Mock).mockReturnValue(true);

    await expect(controller.findOne("user-2", adminUser)).resolves.toEqual({
      user: { id: "user-2" },
    });
  });

  it("rejects create when organizationId is missing", async () => {
    await expect(
      controller.create({ email: "new@example.com" }, adminUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates a user when the caller is admin for the target organization", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (usersService.create as jest.Mock).mockResolvedValue({ id: "user-3" });

    await expect(
      controller.create(
        { email: "new@example.com", organizationId: "org-1" },
        adminUser,
      ),
    ).resolves.toEqual({
      user: { id: "user-3" },
    });
    expect(usersService.create).toHaveBeenCalledWith({
      email: "new@example.com",
      organizationId: "org-1",
    });
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "admin-1",
      attendeeId: null,
      meetId: null,
      action: "created",
      target: "user",
    });
  });

  it("allows users to update their own profile without organizationId", async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({ id: "member-1" });
    (usersService.update as jest.Mock).mockResolvedValue({
      id: "member-1",
      firstName: "Updated",
    });

    await expect(
      controller.update("member-1", { firstName: "Updated" }, memberUser),
    ).resolves.toEqual({
      user: { id: "member-1", firstName: "Updated" },
    });

    expect(authService.getUserOrganizationIds).not.toHaveBeenCalled();
    expect(authService.hasRole).not.toHaveBeenCalled();
  });

  it("rejects updating another user without organizationId", async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({ id: "user-2" });

    await expect(
      controller.update("user-2", { firstName: "Updated" }, adminUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("lists meta values for organization members", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (usersService.listUserMetaValues as jest.Mock).mockResolvedValue([
      { key: "pace", value: "Moderate" },
    ]);

    await expect(
      controller.listMetaValues("user-1", "org-1", memberUser),
    ).resolves.toEqual({
      metaValues: [{ key: "pace", value: "Moderate" }],
    });
  });

  it("rejects meta value reads without organization membership", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.listMetaValues("user-1", "org-1", memberUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("saves meta values for organization members", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (usersService.saveUserMetaValues as jest.Mock).mockResolvedValue([
      { key: "gear", value: "Helmet" },
    ]);

    await expect(
      controller.saveMetaValues(
        "user-1",
        {
          organizationId: "org-1",
          values: [{ key: "gear", value: "Helmet" }],
        },
        memberUser,
      ),
    ).resolves.toEqual({
      metaValues: [{ key: "gear", value: "Helmet" }],
    });
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "member-1",
      attendeeId: null,
      meetId: null,
      action: "saved",
      target: "user meta values",
    });
  });

  it("rejects delete when the target user does not exist", async () => {
    (usersService.findById as jest.Mock).mockResolvedValue(null);

    await expect(controller.remove("missing-user", adminUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("deletes a user when the caller is admin for one of the target organizations", async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({ id: "user-2" });
    (authService.getUserOrganizationIds as jest.Mock).mockReturnValue([
      "org-1",
    ]);
    (authService.hasAtLeastOneRole as jest.Mock).mockReturnValue(true);
    (usersService.remove as jest.Mock).mockResolvedValue({ deleted: true });

    await expect(controller.remove("user-2", adminUser)).resolves.toEqual({
      deleted: true,
    });
    expect(usersService.remove).toHaveBeenCalledWith("user-2");
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "admin-1",
      attendeeId: null,
      meetId: null,
      action: "deleted",
      target: "user",
    });
  });
});
