import {
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import { UserProfile } from "../users/dto/user-profile.dto";

describe("OrganizationsController", () => {
  let controller: OrganizationsController;

  const organizationsService = {
    findAllByIds: jest.fn(),
    findByIdMinimal: jest.fn(),
    findById: jest.fn(),
    findMembers: jest.fn(),
    findOrganizers: jest.fn(),
    listMetaDefinitions: jest.fn(),
    findTemplates: jest.fn(),
    findTemplateById: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    update: jest.fn(),
    listInviteLinks: jest.fn(),
    createInviteLink: jest.fn(),
    acceptInvite: jest.fn(),
    declineInvite: jest.fn(),
  } as unknown as OrganizationsService;

  const authService = {
    getUserOrganizationIds: jest.fn(),
    hasRole: jest.fn(),
  } as unknown as AuthService;

  const db = {
    getClient: jest.fn(),
  } as unknown as DatabaseService;

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
    controller = new OrganizationsController(
      organizationsService,
      authService,
      db,
    );
  });

  it("rejects unauthenticated organization listing", async () => {
    await expect(controller.findAll()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects unauthenticated invite acceptance", async () => {
    await expect(controller.acceptInvite("invite-1")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("accepts an invite for the signed-in user", async () => {
    const invite = {
      id: "invite-1",
      organizationId: "org-1",
      email: "member@example.com",
    };
    (organizationsService.acceptInvite as jest.Mock).mockResolvedValue(invite);
    const cleanupSpy = jest
      .spyOn(
        controller as unknown as {
          removeEmptyPrivateOrganizationsForUser: (
            userId: string,
            organizationId?: string,
          ) => Promise<void>;
        },
        "removeEmptyPrivateOrganizationsForUser",
      )
      .mockResolvedValue(undefined);

    await expect(
      controller.acceptInvite("invite-1", memberUser),
    ).resolves.toEqual({
      invite,
    });

    expect(organizationsService.acceptInvite).toHaveBeenCalledWith(
      "invite-1",
      "member-1",
      "member@example.com",
    );
    expect(cleanupSpy).toHaveBeenCalledWith("member-1", "org-1");
  });

  it("still returns the accepted invite when private-organization cleanup fails", async () => {
    const invite = {
      id: "invite-1",
      organizationId: "org-1",
      email: "member@example.com",
    };
    (organizationsService.acceptInvite as jest.Mock).mockResolvedValue(invite);
    jest
      .spyOn(
        controller as unknown as {
          removeEmptyPrivateOrganizationsForUser: (
            userId: string,
            organizationId?: string,
          ) => Promise<void>;
        },
        "removeEmptyPrivateOrganizationsForUser",
      )
      .mockRejectedValue(new Error("db unavailable"));
    const warnSpy = jest.spyOn((controller as any).logger, "warn");

    await expect(
      controller.acceptInvite("invite-1", memberUser),
    ).resolves.toEqual({
      invite,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("private org cleanup failed"),
    );
  });

  it("rejects unauthenticated invite decline", async () => {
    await expect(controller.declineInvite("invite-1")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("declines an invite for the signed-in user's email", async () => {
    const invite = {
      id: "invite-1",
      organizationId: "org-1",
      email: "member@example.com",
      declinedAt: "2026-05-11T08:00:00.000Z",
    };
    (organizationsService.declineInvite as jest.Mock).mockResolvedValue(invite);

    await expect(
      controller.declineInvite("invite-1", memberUser),
    ).resolves.toEqual({
      invite,
    });

    expect(organizationsService.declineInvite).toHaveBeenCalledWith(
      "invite-1",
      "member@example.com",
    );
  });

  it("returns an empty list when the caller has no organization memberships", async () => {
    (authService.getUserOrganizationIds as jest.Mock).mockReturnValue([]);

    await expect(controller.findAll(adminUser)).resolves.toEqual([]);
    expect(organizationsService.findAllByIds).not.toHaveBeenCalled();
  });

  it("lists organizations for the caller's organization ids", async () => {
    (authService.getUserOrganizationIds as jest.Mock).mockReturnValue([
      "org-1",
      "org-2",
    ]);
    (organizationsService.findAllByIds as jest.Mock).mockResolvedValue([
      { id: "org-1", name: "Hikers Club" },
      { id: "org-2", name: "Campers Club" },
    ]);

    await expect(controller.findAll(adminUser)).resolves.toEqual({
      organizations: [
        { id: "org-1", name: "Hikers Club" },
        { id: "org-2", name: "Campers Club" },
      ],
    });
    expect(authService.getUserOrganizationIds).toHaveBeenCalledWith(adminUser);
    expect(organizationsService.findAllByIds).toHaveBeenCalledWith([
      "org-1",
      "org-2",
    ]);
  });

  it("returns minimal organization data for anonymous callers", async () => {
    (organizationsService.findByIdMinimal as jest.Mock).mockResolvedValue({
      id: "org-1",
      theme: "mountain",
      isPrivate: false,
    });

    await expect(controller.findOne("org-1")).resolves.toEqual({
      organization: {
        id: "org-1",
        theme: "mountain",
        isPrivate: false,
      },
    });
    expect(organizationsService.findByIdMinimal).toHaveBeenCalledWith("org-1");
    expect(organizationsService.findById).not.toHaveBeenCalled();
  });

  it("rejects organization lookup for signed-in non-members", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.findOne("org-1", memberUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(organizationsService.findById).not.toHaveBeenCalled();
  });

  it("returns full organization data for members", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (organizationsService.findById as jest.Mock).mockResolvedValue({
      id: "org-1",
      name: "Hikers Club",
      theme: "mountain",
    });

    await expect(controller.findOne("org-1", memberUser)).resolves.toEqual({
      organization: {
        id: "org-1",
        name: "Hikers Club",
        theme: "mountain",
      },
    });
    expect(authService.hasRole).toHaveBeenCalledWith(
      memberUser,
      "org-1",
      "member",
    );
  });

  it("rejects member listing for non-admins", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.findMembers("org-1", memberUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns members for admins", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (organizationsService.findMembers as jest.Mock).mockResolvedValue([
      { id: "user-1", role: "member" },
    ]);

    await expect(controller.findMembers("org-1", adminUser)).resolves.toEqual({
      members: [{ id: "user-1", role: "member" }],
    });
    expect(organizationsService.findMembers).toHaveBeenCalledWith("org-1");
  });

  it("returns organizers for organizer-level users", async () => {
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer",
    );
    (organizationsService.findOrganizers as jest.Mock).mockResolvedValue([
      { id: "user-1", role: "organizer" },
    ]);

    await expect(
      controller.findOrganizers("org-1", memberUser),
    ).resolves.toEqual({
      organizers: [{ id: "user-1", role: "organizer" }],
    });
  });

  it("lists meta definitions for members", async () => {
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "member",
    );
    (organizationsService.listMetaDefinitions as jest.Mock).mockResolvedValue([
      { id: "meta-1", fieldKey: "gear" },
    ]);

    await expect(
      controller.listMetaDefinitions("org-1", memberUser),
    ).resolves.toEqual({
      metaDefinitions: [{ id: "meta-1", fieldKey: "gear" }],
    });
  });

  it("lists templates for organizers", async () => {
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer",
    );
    (organizationsService.findTemplates as jest.Mock).mockResolvedValue([
      { id: "template-1", name: "Default" },
    ]);

    await expect(controller.findTemplates("org-1", memberUser)).resolves.toEqual(
      {
        templates: [{ id: "template-1", name: "Default" }],
      },
    );
  });

  it("gets a single template for organizers", async () => {
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer",
    );
    (organizationsService.findTemplateById as jest.Mock).mockResolvedValue({
      id: "template-1",
      name: "Default",
    });

    await expect(
      controller.findTemplate("org-1", "template-1", memberUser),
    ).resolves.toEqual({
      template: { id: "template-1", name: "Default" },
    });
  });

  it("rejects single template fetch for non-organizers", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.findTemplate("org-1", "template-1", memberUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("creates templates for admins", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (organizationsService.createTemplate as jest.Mock).mockResolvedValue({
      id: "template-1",
      name: "New Template",
    });

    await expect(
      controller.createTemplate(
        "org-1",
        { name: "New Template", metaDefinitionIds: [] } as any,
        adminUser,
      ),
    ).resolves.toEqual({
      template: { id: "template-1", name: "New Template" },
    });
  });

  it("updates templates for admins", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (organizationsService.updateTemplate as jest.Mock).mockResolvedValue({
      id: "template-1",
      name: "Updated Template",
    });

    await expect(
      controller.updateTemplate(
        "org-1",
        "template-1",
        { name: "Updated Template" } as any,
        adminUser,
      ),
    ).resolves.toEqual({
      template: { id: "template-1", name: "Updated Template" },
    });
  });

  it("deletes templates for admins", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (organizationsService.deleteTemplate as jest.Mock).mockResolvedValue({
      deleted: true,
    });

    await expect(
      controller.deleteTemplate("org-1", "template-1", adminUser),
    ).resolves.toEqual({
      deleted: true,
    });
  });

  it("updates organizations for admins", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (organizationsService.update as jest.Mock).mockResolvedValue({
      id: "org-1",
      name: "Updated Org",
    });

    await expect(
      controller.update("org-1", { name: "Updated Org" } as any, adminUser),
    ).resolves.toEqual({
      organization: { id: "org-1", name: "Updated Org" },
    });
  });

  it("lists invites for admins", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (organizationsService.listInviteLinks as jest.Mock).mockResolvedValue([
      { id: "invite-1", email: "new@example.com" },
    ]);

    await expect(controller.listInvites("org-1", adminUser)).resolves.toEqual({
      invites: [{ id: "invite-1", email: "new@example.com" }],
    });
  });

  it("creates invites for admins with the calling user id", async () => {
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (organizationsService.createInviteLink as jest.Mock).mockResolvedValue({
      id: "invite-1",
      email: "new@example.com",
      role: "member",
    });

    await expect(
      controller.invite(
        "org-1",
        { email: "new@example.com", roleId: 4 },
        adminUser,
      ),
    ).resolves.toEqual({
      invite: {
        id: "invite-1",
        email: "new@example.com",
        role: "member",
      },
    });
    expect(organizationsService.createInviteLink).toHaveBeenCalledWith(
      "org-1",
      { email: "new@example.com", roleId: 4 },
      "admin-1",
    );
  });
});
