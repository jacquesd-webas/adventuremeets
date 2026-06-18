import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { EmailService } from "../email/email.service";
import { OrganizationsService } from "./organizations.service";
import { MinioService } from "../storage/minio.service";

const buildBuilder = () => {
  const builder: any = {};
  builder.__resolvedValue = [];
  builder.leftJoin = jest.fn().mockReturnValue(builder);
  builder.join = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.andWhere = jest.fn().mockReturnValue(builder);
  builder.whereRaw = jest.fn().mockReturnValue(builder);
  builder.modify = jest
    .fn()
    .mockImplementation((callback: (qb: any) => void) => {
      callback(builder);
      return builder;
    });
  builder.distinct = jest.fn().mockReturnValue(builder);
  builder.groupBy = jest.fn().mockReturnValue(builder);
  builder.select = jest.fn().mockReturnValue(builder);
  builder.count = jest.fn().mockReturnValue(builder);
  builder.countDistinct = jest.fn().mockReturnValue(builder);
  builder.sum = jest.fn().mockReturnValue(builder);
  builder.orderBy = jest.fn().mockReturnValue(builder);
  builder.first = jest.fn();
  builder.insert = jest.fn().mockReturnValue(builder);
  builder.returning = jest.fn();
  builder.update = jest.fn();
  builder.del = jest.fn();
  builder.then = (
    onFulfilled: (value: any) => any,
    onRejected?: (error: any) => any,
  ) => Promise.resolve(builder.__resolvedValue).then(onFulfilled, onRejected);
  return builder;
};

const createTransaction = (builders: Record<string, any>) => {
  const trx: any = (table: string) => builders[table] ?? buildBuilder();
  trx.commit = jest.fn().mockResolvedValue(undefined);
  trx.rollback = jest.fn().mockResolvedValue(undefined);
  return trx;
};

describe("OrganizationsService", () => {
  const emailService = {} as EmailService;
  const minioService = {
    upload: jest.fn(),
    remove: jest.fn(),
  } as unknown as MinioService;

  beforeEach(() => {
    (minioService.upload as jest.Mock).mockReset();
    (minioService.remove as jest.Mock).mockReset();
  });

  it("returns whether the organization allows members to view all meets", async () => {
    const organizationsBuilder = buildBuilder();
    organizationsBuilder.first.mockResolvedValue({
      can_view_all_meets: true,
    });

    const client: any = (table: string) => {
      if (table === "organizations" || table === "organizations as o") {
        return organizationsBuilder;
      }
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(service.canOrganizationShareMeets("org-1")).resolves.toBe(
      true,
    );
    expect(organizationsBuilder.where).toHaveBeenCalledWith({ id: "org-1" });
  });

  it("returns false when the organization does not allow members to view all meets", async () => {
    const organizationsBuilder = buildBuilder();
    organizationsBuilder.first.mockResolvedValue({
      can_view_all_meets: false,
    });

    const client: any = (table: string) => {
      if (table === "organizations") return organizationsBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(service.canOrganizationShareMeets("org-1")).resolves.toBe(
      false,
    );
  });

  it("throws when checking meet sharing for a missing organization", async () => {
    const organizationsBuilder = buildBuilder();
    organizationsBuilder.first.mockResolvedValue(undefined);

    const client: any = (table: string) => {
      if (table === "organizations") return organizationsBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(service.canOrganizationShareMeets("org-1")).rejects.toThrow(
      new NotFoundException("Organization not found"),
    );
  });

  it("creates an invite link with a normalized email and sends the register URL", async () => {
    process.env.FRONTEND_URL = "http://localhost:5173/";

    const organizationsBuilder = buildBuilder();
    organizationsBuilder.first.mockResolvedValue({
      id: "org-1",
      name: "Trail Club",
    });

    const rolesBuilder = buildBuilder();
    rolesBuilder.first.mockResolvedValue({
      id: 3,
      name: "organizer",
    });

    const inviteLinksBuilder = buildBuilder();
    inviteLinksBuilder.returning.mockResolvedValue([
      {
        id: "invite-1",
        org_id: "org-1",
        email: "alice@example.com",
        token: "TOKEN123",
        role_id: 3,
        created_at: "2026-05-01T00:00:00.000Z",
        expires_at: "2099-01-01T00:00:00.000Z",
        accepted_at: null,
        declined_at: null,
        created_by: "user-1",
      },
    ]);

    const client: any = (table: string) => {
      if (table === "organizations") return organizationsBuilder;
      if (table === "roles") return rolesBuilder;
      if (table === "invite_links") return inviteLinksBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const sendEmail = jest.fn().mockResolvedValue(undefined);
    const service = new OrganizationsService(
      db,
      {
        sendEmail,
      } as unknown as EmailService,
      minioService,
    );

    const result = await service.createInviteLink(
      "org-1",
      {
        email: " Alice@Example.com ",
        roleId: 3,
      },
      "user-1",
    );

    expect(inviteLinksBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "org-1",
        email: "alice@example.com",
        role_id: 3,
        created_by: "user-1",
      }),
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        email: "alice@example.com",
        roleName: "organizer",
        inviteUrl: expect.any(String),
      }),
    );
  });

  it("creates a private organization and admin membership for a user", async () => {
    const organizationsBuilder = buildBuilder();
    organizationsBuilder.returning.mockResolvedValue([{ id: "org-9" }]);

    const membershipsBuilder = buildBuilder();

    const trx = createTransaction({
      organizations: organizationsBuilder,
      user_organization_memberships: membershipsBuilder,
    });

    const client: any = (table: string) => buildBuilder();
    client.transaction = jest.fn().mockResolvedValue(trx);

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);
    jest.spyOn(service, "findById").mockResolvedValue({
      id: "org-9",
      name: "Summit Club",
      created_at: "2026-06-11T08:00:00.000Z",
      updated_at: "2026-06-11T08:00:00.000Z",
    } as any);

    const result = await service.createPrivateOrganization(
      " Summit Club ",
      "user-1",
    );

    expect(organizationsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Summit Club",
        is_private: true,
      }),
    );
    expect(membershipsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        organization_id: "org-9",
        role: "admin",
        role_id: 2,
        status: "active",
      }),
    );
    expect(trx.commit).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: "org-9",
        name: "Summit Club",
      }),
    );
  });

  it("marks a non-final active membership inactive when a user leaves an organization", async () => {
    const membershipBuilder = buildBuilder();
    membershipBuilder.first
      .mockResolvedValueOnce({
        organization_id: "org-2",
        user_id: "user-1",
        status: "active",
      })
      .mockResolvedValueOnce({ count: "2" })
      .mockResolvedValueOnce({ count: "1" });

    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue({ count: "3" });

    const organizationsBuilder = buildBuilder();

    const client: any = (table: string) => {
      if (table === "user_organization_memberships") return membershipBuilder;
      if (table === "meets") return meetsBuilder;
      if (table === "organizations") return organizationsBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(service.leaveOrganization("org-2", "user-1")).resolves.toBe(
      undefined,
    );

    expect(membershipBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "inactive",
      }),
    );
    expect(organizationsBuilder.del).not.toHaveBeenCalled();
  });

  it("rejects leaving the last active organization", async () => {
    const membershipBuilder = buildBuilder();
    membershipBuilder.first
      .mockResolvedValueOnce({
        organization_id: "org-1",
        user_id: "user-1",
        status: "active",
      })
      .mockResolvedValueOnce({ count: "1" });

    const client: any = (table: string) => {
      if (table === "user_organization_memberships") return membershipBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(service.leaveOrganization("org-1", "user-1")).rejects.toThrow(
      new BadRequestException("You cannot leave your last active organization"),
    );
  });

  it("deletes the organization after leaving when it has no active users and no meets", async () => {
    const membershipBuilder = buildBuilder();
    membershipBuilder.first
      .mockResolvedValueOnce({
        organization_id: "org-2",
        user_id: "user-1",
        status: "active",
      })
      .mockResolvedValueOnce({ count: "2" })
      .mockResolvedValueOnce({ count: "0" });

    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue({ count: "0" });

    const organizationsBuilder = buildBuilder();

    const client: any = (table: string) => {
      if (table === "user_organization_memberships") return membershipBuilder;
      if (table === "meets") return meetsBuilder;
      if (table === "organizations") return organizationsBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(service.leaveOrganization("org-2", "user-1")).resolves.toBe(
      undefined,
    );

    expect(organizationsBuilder.where).toHaveBeenCalledWith({ id: "org-2" });
    expect(organizationsBuilder.del).toHaveBeenCalledTimes(1);
  });

  it("removes empty private organizations for a user while keeping the joined organization", async () => {
    const privateOrganizationsBuilder = buildBuilder();
    privateOrganizationsBuilder.__resolvedValue = [{ id: "org-private" }];

    const membershipCountBuilder = buildBuilder();
    membershipCountBuilder.first.mockResolvedValue({ count: "1" });

    const meetsBuilder = buildBuilder();
    meetsBuilder.first.mockResolvedValue({ count: "0" });

    const organizationsBuilder = buildBuilder();

    const client: any = (table: string) => {
      if (table === "organizations as o") return privateOrganizationsBuilder;
      if (table === "user_organization_memberships")
        return membershipCountBuilder;
      if (table === "meets") return meetsBuilder;
      if (table === "organizations") return organizationsBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(
      service.removeEmptyPrivateOrganizationsForUser("user-1", "org-joined"),
    ).resolves.toBeUndefined();

    expect(privateOrganizationsBuilder.where).toHaveBeenCalledWith(
      "uom.user_id",
      "user-1",
    );
    expect(privateOrganizationsBuilder.andWhere).toHaveBeenCalledWith(
      "o.id",
      "!=",
      "org-joined",
    );
    expect(organizationsBuilder.where).toHaveBeenCalledWith({
      id: "org-private",
    });
    expect(organizationsBuilder.andWhere).toHaveBeenCalledWith(
      "is_private",
      true,
    );
    expect(organizationsBuilder.del).toHaveBeenCalledTimes(1);
  });

  it("lists non-expired invite links in descending created order", async () => {
    const organizationsBuilder = buildBuilder();
    organizationsBuilder.first.mockResolvedValue({
      id: "org-1",
    });

    const inviteLinksBuilder = buildBuilder();
    inviteLinksBuilder.select.mockResolvedValue([
      {
        id: "invite-2",
        org_id: "org-1",
        email: "newer@example.com",
        token: "TOKEN456",
        role_id: 4,
        role_name: "member",
        created_at: "2026-05-04T10:00:00.000Z",
        expires_at: "2099-01-01T00:00:00.000Z",
        accepted_at: null,
        declined_at: null,
        created_by: "user-1",
      },
      {
        id: "invite-1",
        org_id: "org-1",
        email: "older@example.com",
        token: "TOKEN123",
        role_id: 3,
        role_name: "organizer",
        created_at: "2026-05-03T10:00:00.000Z",
        expires_at: "2099-01-01T00:00:00.000Z",
        accepted_at: null,
        declined_at: null,
        created_by: "user-2",
      },
    ]);

    const client: any = (table: string) => {
      if (table === "organizations") return organizationsBuilder;
      if (table === "invite_links as il") return inviteLinksBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(service.listInviteLinks("org-1")).resolves.toEqual([
      expect.objectContaining({
        id: "invite-2",
        email: "newer@example.com",
        inviteUrl: "TOKEN456",
      }),
      expect.objectContaining({
        id: "invite-1",
        email: "older@example.com",
        inviteUrl: "TOKEN123",
      }),
    ]);

    expect(inviteLinksBuilder.andWhere).toHaveBeenCalledWith(
      "il.expires_at",
      ">",
      expect.any(String),
    );
    expect(inviteLinksBuilder.orderBy).toHaveBeenCalledWith(
      "il.created_at",
      "desc",
    );
  });

  it("creates a membership and marks the invite accepted", async () => {
    const inviteBuilder = buildBuilder();
    inviteBuilder.first
      .mockResolvedValueOnce({
        id: "invite-1",
        org_id: "org-1",
        email: "alice@example.com",
        token: "TOKEN123",
        role_id: 3,
        role_name: "organizer",
        expires_at: "2099-01-01T00:00:00.000Z",
        declined_at: null,
        accepted_at: null,
        created_at: "2026-05-01T00:00:00.000Z",
        created_by: "user-9",
      })
      .mockResolvedValueOnce({
        id: "invite-1",
        org_id: "org-1",
        email: "alice@example.com",
        token: "TOKEN123",
        role_id: 3,
        role_name: "organizer",
        expires_at: "2099-01-01T00:00:00.000Z",
        declined_at: null,
        accepted_at: "2026-05-04T10:00:00.000Z",
        created_at: "2026-05-01T00:00:00.000Z",
        created_by: "user-9",
      });

    const membershipBuilder = buildBuilder();
    membershipBuilder.first.mockResolvedValue(undefined);
    membershipBuilder.insert.mockResolvedValue([{ id: "membership-1" }]);

    const inviteLinksBuilder = buildBuilder();
    inviteLinksBuilder.update.mockResolvedValue(1);

    const trx = createTransaction({
      "invite_links as il": inviteBuilder,
      user_organization_memberships: membershipBuilder,
      invite_links: inviteLinksBuilder,
    });

    const client: any = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    const result = await service.acceptInvite(
      "invite-1",
      "user-1",
      "Alice@Example.com",
    );

    expect(membershipBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        organization_id: "org-1",
        role: "organizer",
        role_id: 3,
        status: "active",
      }),
    );
    expect(inviteLinksBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        accepted_at: expect.any(String),
      }),
    );
    expect(trx.commit).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: "invite-1",
        organizationId: "org-1",
        roleId: 3,
        roleName: "organizer",
        inviteUrl: "TOKEN123",
      }),
    );
  });

  it("reactivates an inactive membership instead of inserting a new one", async () => {
    const inviteBuilder = buildBuilder();
    inviteBuilder.first
      .mockResolvedValueOnce({
        id: "invite-1",
        org_id: "org-1",
        email: "alice@example.com",
        token: "TOKEN123",
        role_id: 4,
        role_name: "member",
        expires_at: "2099-01-01T00:00:00.000Z",
        declined_at: null,
        accepted_at: null,
        created_at: "2026-05-01T00:00:00.000Z",
        created_by: "user-9",
      })
      .mockResolvedValueOnce({
        id: "invite-1",
        org_id: "org-1",
        email: "alice@example.com",
        token: "TOKEN123",
        role_id: 4,
        role_name: "member",
        expires_at: "2099-01-01T00:00:00.000Z",
        declined_at: null,
        accepted_at: "2026-05-04T10:00:00.000Z",
        created_at: "2026-05-01T00:00:00.000Z",
        created_by: "user-9",
      });

    const membershipBuilder = buildBuilder();
    membershipBuilder.first.mockResolvedValue({
      user_id: "user-1",
      organization_id: "org-1",
      status: "inactive",
    });
    membershipBuilder.update.mockResolvedValue(1);

    const inviteLinksBuilder = buildBuilder();
    inviteLinksBuilder.update.mockResolvedValue(1);

    const trx = createTransaction({
      "invite_links as il": inviteBuilder,
      user_organization_memberships: membershipBuilder,
      invite_links: inviteLinksBuilder,
    });

    const client: any = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await service.acceptInvite("invite-1", "user-1", "alice@example.com");

    expect(membershipBuilder.insert).not.toHaveBeenCalled();
    expect(membershipBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "member",
        role_id: 4,
        status: "active",
        updated_at: expect.any(String),
      }),
    );
  });

  it("does not insert or update when the membership is already active", async () => {
    const inviteBuilder = buildBuilder();
    inviteBuilder.first
      .mockResolvedValueOnce({
        id: "invite-1",
        org_id: "org-1",
        email: "alice@example.com",
        token: "TOKEN123",
        role_id: 4,
        role_name: "member",
        expires_at: "2099-01-01T00:00:00.000Z",
        declined_at: null,
        accepted_at: "2026-05-02T10:00:00.000Z",
        created_at: "2026-05-01T00:00:00.000Z",
        created_by: "user-9",
      })
      .mockResolvedValueOnce({
        id: "invite-1",
        org_id: "org-1",
        email: "alice@example.com",
        token: "TOKEN123",
        role_id: 4,
        role_name: "member",
        expires_at: "2099-01-01T00:00:00.000Z",
        declined_at: null,
        accepted_at: "2026-05-02T10:00:00.000Z",
        created_at: "2026-05-01T00:00:00.000Z",
        created_by: "user-9",
      });

    const membershipBuilder = buildBuilder();
    membershipBuilder.first.mockResolvedValue({
      user_id: "user-1",
      organization_id: "org-1",
      status: "active",
    });

    const inviteLinksBuilder = buildBuilder();

    const trx = createTransaction({
      "invite_links as il": inviteBuilder,
      user_organization_memberships: membershipBuilder,
      invite_links: inviteLinksBuilder,
    });

    const client: any = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await service.acceptInvite("invite-1", "user-1", "alice@example.com");

    expect(membershipBuilder.insert).not.toHaveBeenCalled();
    expect(membershipBuilder.update).not.toHaveBeenCalled();
    expect(inviteLinksBuilder.update).not.toHaveBeenCalled();
  });

  it("uploads an organization logo and stores the object metadata", async () => {
    const tinyPngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0xkAAAAASUVORK5CYII=",
      "base64",
    );
    const organizationsBuilder = buildBuilder();
    organizationsBuilder.first.mockResolvedValue({
      id: "org-1",
      name: "Trail Club",
      logo_object_key: "logos/org-1/old.webp",
    });
    organizationsBuilder.update.mockResolvedValue(1);

    const organizationDetailsBuilder = buildBuilder();
    organizationDetailsBuilder.first.mockResolvedValue({
      id: "org-1",
      name: "Trail Club",
      logo_url: "https://cdn.example.com/logos/new.webp",
      logo_object_key: "logos/org-1/new.webp",
      created_at: "2026-06-10T10:00:00.000Z",
      updated_at: "2026-06-10T11:00:00.000Z",
      user_count: 0,
      template_count: 0,
    });

    const client: any = (table: string) => {
      if (table === "organizations") return organizationsBuilder;
      if (table === "organizations as o") return organizationDetailsBuilder;
      return buildBuilder();
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    (minioService.upload as jest.Mock).mockResolvedValue({
      objectKey: "logos/org-1/new.webp",
      url: "https://cdn.example.com/logos/new.webp",
    });
    (minioService.remove as jest.Mock).mockResolvedValue(undefined);

    const service = new OrganizationsService(db, emailService, minioService);

    const result = await service.uploadLogo("org-1", {
      buffer: tinyPngBuffer,
      mimetype: "image/png",
    });

    expect(minioService.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^logos\/org-1\/.+\.webp$/),
      expect.any(Buffer),
      "image/webp",
    );
    expect(minioService.remove).toHaveBeenCalledWith("logos/org-1/old.webp");
    expect(organizationsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        logo_object_key: "logos/org-1/new.webp",
        logo_url: "https://cdn.example.com/logos/new.webp",
        updated_at: expect.any(String),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: "org-1",
        logoUrl: "https://cdn.example.com/logos/new.webp",
      }),
    );
  });

  it("rejects invites that belong to a different email", async () => {
    const inviteBuilder = buildBuilder();
    inviteBuilder.first.mockResolvedValue({
      id: "invite-1",
      org_id: "org-1",
      email: "alice@example.com",
      token: "TOKEN123",
      role_id: 4,
      role_name: "member",
      expires_at: "2099-01-01T00:00:00.000Z",
      declined_at: null,
      accepted_at: null,
      created_at: "2026-05-01T00:00:00.000Z",
      created_by: "user-9",
    });

    const trx = createTransaction({
      "invite_links as il": inviteBuilder,
    });

    const client: any = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(
      service.acceptInvite("invite-1", "user-1", "bob@example.com"),
    ).rejects.toThrow(
      new BadRequestException("Invite does not belong to this user"),
    );
    expect(trx.rollback).toHaveBeenCalled();
  });

  it("rejects expired invites", async () => {
    const inviteBuilder = buildBuilder();
    inviteBuilder.first.mockResolvedValue({
      id: "invite-1",
      org_id: "org-1",
      email: "alice@example.com",
      token: "TOKEN123",
      role_id: 4,
      role_name: "member",
      expires_at: "2000-01-01T00:00:00.000Z",
      declined_at: null,
      accepted_at: null,
      created_at: "2026-05-01T00:00:00.000Z",
      created_by: "user-9",
    });

    const trx = createTransaction({
      "invite_links as il": inviteBuilder,
    });

    const client: any = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(
      service.acceptInvite("invite-1", "user-1", "alice@example.com"),
    ).rejects.toThrow(new BadRequestException("Invite has expired"));
    expect(trx.rollback).toHaveBeenCalled();
  });

  it("throws when the invite does not exist", async () => {
    const inviteBuilder = buildBuilder();
    inviteBuilder.first.mockResolvedValue(undefined);

    const trx = createTransaction({
      "invite_links as il": inviteBuilder,
    });

    const client: any = {
      transaction: jest.fn().mockResolvedValue(trx),
    };

    const db = { getClient: () => client } as unknown as DatabaseService;
    const service = new OrganizationsService(db, emailService, minioService);

    await expect(
      service.acceptInvite("invite-1", "user-1", "alice@example.com"),
    ).rejects.toThrow(new NotFoundException("Invite not found"));
    expect(trx.rollback).toHaveBeenCalled();
  });
});
