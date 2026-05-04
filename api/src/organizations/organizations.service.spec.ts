import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { EmailService } from "../email/email.service";
import { OrganizationsService } from "./organizations.service";

const buildBuilder = () => {
  const builder: any = {};
  builder.leftJoin = jest.fn().mockReturnValue(builder);
  builder.where = jest.fn().mockReturnValue(builder);
  builder.select = jest.fn().mockReturnValue(builder);
  builder.first = jest.fn();
  builder.insert = jest.fn();
  builder.update = jest.fn();
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
    const service = new OrganizationsService(db, emailService);

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
    const service = new OrganizationsService(db, emailService);

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
    const service = new OrganizationsService(db, emailService);

    await service.acceptInvite("invite-1", "user-1", "alice@example.com");

    expect(membershipBuilder.insert).not.toHaveBeenCalled();
    expect(membershipBuilder.update).not.toHaveBeenCalled();
    expect(inviteLinksBuilder.update).not.toHaveBeenCalled();
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
    const service = new OrganizationsService(db, emailService);

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
    const service = new OrganizationsService(db, emailService);

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
    const service = new OrganizationsService(db, emailService);

    await expect(
      service.acceptInvite("invite-1", "user-1", "alice@example.com"),
    ).rejects.toThrow(new NotFoundException("Invite not found"));
    expect(trx.rollback).toHaveBeenCalled();
  });
});
