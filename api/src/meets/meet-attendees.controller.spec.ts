jest.mock("../email/email.templates", () => ({
  renderEmailTemplate: jest.fn((name: string) => ({
    subject: `subject:${name}`,
    text: `text:${name}`,
    html: `html:${name}`,
  })),
}));

import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { MeetAttendeesController } from "./meet-attendees.controller";
import { MeetsService } from "./meets.service";
import { AuthService } from "../auth/auth.service";
import { EmailService } from "../email/email.service";
import { renderEmailTemplate } from "../email/email.templates";
import { UserProfile } from "../users/dto/user-profile.dto";
import { UsersService } from "../users/users.service";
import { AuditLogService } from "../audit/audit-log.service";
import { OrganizationsService } from "../organizations/organizations.service";

describe("MeetAttendeesController", () => {
  let controller: MeetAttendeesController;

  const meetsService = {
    findOne: jest.fn(),
    listAttendees: jest.fn(),
    listAttendeeHistory: jest.fn(),
    findAttendeeByContact: jest.fn(),
    addAttendee: jest.fn(),
    autoPlaceAttendees: jest.fn(),
    updateAttendeesNotified: jest.fn(),
    findAttendeeForEdit: jest.fn(),
    updateAttendee: jest.fn(),
    removeAttendee: jest.fn(),
  } as unknown as MeetsService;

  const authService = {
    hasRole: jest.fn(),
  } as unknown as AuthService;

  const emailService = {
    sendEmail: jest.fn(),
    saveMessage: jest.fn(),
  } as unknown as EmailService;

  const usersService = {
    findIceInfoByUserId: jest.fn(),
  } as unknown as UsersService;

  const auditLogService = {
    addRecord: jest.fn(),
  } as unknown as AuditLogService;

  const organizationsService = {
    findLogoUrlById: jest.fn(),
  } as unknown as OrganizationsService;

  const user: UserProfile = {
    id: "user-1",
    email: "organizer@example.com",
    organizations: { "org-1": "organizer" },
    pendingInvites: [],
  };

  const adminUser: UserProfile = {
    id: "admin-1",
    email: "admin@example.com",
    organizations: { "org-1": "admin" },
    pendingInvites: [],
  };

  const meet = {
    id: "meet-1",
    organizationId: "org-1",
    organizerId: "user-1",
    name: "Sunrise Hike",
    shareCode: "share-123",
    autoPlacement: false,
    confirmMessage: "You are in",
    waitlistMessage: "Wait a bit",
    rejectMessage: "Sorry",
    startTime: "2026-04-14T08:00:00.000Z",
    endTime: "2026-04-14T10:00:00.000Z",
    timeZone: "Africa/Johannesburg",
    location: "Trailhead",
    organizerName: "Taylor",
    organizerEmail: "taylor@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MeetAttendeesController(
      meetsService,
      authService,
      emailService,
      usersService,
      auditLogService,
      organizationsService,
    );
    (organizationsService.findLogoUrlById as jest.Mock).mockResolvedValue(
      "https://cdn.example.com/logos/org-1.webp",
    );
  });

  it("rejects unauthenticated attendee listing", async () => {
    await expect(controller.list("meet-1", "accepted")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects attendee listing for non-organizers", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.list("meet-1", "accepted", user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("lists attendees for organizers using the requested filter", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (meetsService.listAttendees as jest.Mock).mockResolvedValue({
      attendees: [{ id: "attendee-1", status: "confirmed" }],
    });

    await expect(controller.list("meet-1", "confirmed", user)).resolves.toEqual(
      {
        attendees: [{ id: "attendee-1", status: "confirmed" }],
      },
    );

    expect(meetsService.listAttendees).toHaveBeenCalledWith(
      "meet-1",
      "confirmed",
    );
  });

  it("rejects attendee listing for another organizer in the same organization", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "user-2",
    });
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer",
    );

    await expect(controller.list("meet-1", "confirmed", user)).rejects.toThrow(
      "You cannot access attendees for a meet you do not organize",
    );
  });

  it("allows attendee listing for admins on another organizer's meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "user-2",
    });
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer" || role === "admin",
    );
    (meetsService.listAttendees as jest.Mock).mockResolvedValue({
      attendees: [{ id: "attendee-1", status: "confirmed" }],
    });

    await expect(
      controller.list("meet-1", "confirmed", adminUser),
    ).resolves.toEqual({
      attendees: [{ id: "attendee-1", status: "confirmed" }],
    });
  });

  it("returns ICE info for the meet organizer on the meet day", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-14T06:00:00.000Z"));
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findAttendeeForEdit as jest.Mock).mockResolvedValue({
      attendee: { userId: "user-2" },
    });
    (usersService.findIceInfoByUserId as jest.Mock).mockResolvedValue({
      iceName: "Jordan Contact",
    });

    await expect(
      controller.getIceInfo("meet-1", "attendee-1", user),
    ).resolves.toEqual({
      iceInfo: { iceName: "Jordan Contact" },
    });

    jest.useRealTimers();
  });

  it("returns attendee history for the meet organizer", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (meetsService.listAttendeeHistory as jest.Mock).mockResolvedValue([
      {
        meetId: "meet-2",
        date: "2026-03-20T08:00:00.000Z",
        meetName: "Cliff Walk",
        attendeeStatus: "confirmed",
      },
    ]);

    await expect(
      controller.getHistory("meet-1", "attendee-1", user),
    ).resolves.toEqual({
      history: [
        {
          meetId: "meet-2",
          date: "2026-03-20T08:00:00.000Z",
          meetName: "Cliff Walk",
          attendeeStatus: "confirmed",
        },
      ],
    });

    expect(meetsService.listAttendeeHistory).toHaveBeenCalledWith(
      "meet-1",
      "attendee-1",
    );
  });

  it("rejects attendee history access for non-organizers", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.getHistory("meet-1", "attendee-1", user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects attendee history access for another organizer in the same organization", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "user-2",
    });
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer",
    );

    await expect(
      controller.getHistory("meet-1", "attendee-1", user),
    ).rejects.toThrow(
      "You cannot access attendees for a meet you do not organize",
    );
  });

  it("allows attendee history access for admins on another organizer's meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "user-2",
    });
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer" || role === "admin",
    );
    (meetsService.listAttendeeHistory as jest.Mock).mockResolvedValue([]);

    await expect(
      controller.getHistory("meet-1", "attendee-1", adminUser),
    ).resolves.toEqual({ history: [] });
  });

  it("rejects ICE info access for an org admin who is not the meet organizer", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);

    await expect(
      controller.getIceInfo("meet-1", "attendee-1", adminUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns null ICE info when the attendee is not linked to a user", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-14T06:00:00.000Z"));
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.findAttendeeForEdit as jest.Mock).mockResolvedValue({
      attendee: { userId: null },
    });

    await expect(
      controller.getIceInfo("meet-1", "attendee-1", user),
    ).resolves.toEqual({
      iceInfo: null,
    });

    expect(usersService.findIceInfoByUserId).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("rejects ICE info access outside the meet day", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-15T06:00:00.000Z"));
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);

    await expect(
      controller.getIceInfo("meet-1", "attendee-1", user),
    ).rejects.toBeInstanceOf(ForbiddenException);

    jest.useRealTimers();
  });

  it("checks duplicates without including invited attendees", async () => {
    (meetsService.findAttendeeByContact as jest.Mock).mockResolvedValue({
      attendee: null,
      attendees: [],
    });

    await expect(
      controller.check(
        "meet-1",
        "Person Example",
        "person@example.com",
        "+27123456789",
      ),
    ).resolves.toEqual({ attendee: null, attendees: [] });

    expect(meetsService.findAttendeeByContact).toHaveBeenCalledWith(
      "meet-1",
      "person@example.com",
      "+27123456789",
      "Person Example",
      { includeInvited: false },
    );
  });

  it("throws when adding an attendee to a missing meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      controller.add("missing-meet", {}, {
        headers: {},
        ip: "127.0.0.1",
      } as unknown as Request),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("sets respondedAt for auto-accepted attendees by marking them notified", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      autoPlacement: true,
    });
    (meetsService.addAttendee as jest.Mock).mockResolvedValue({
      attendee: { id: "attendee-1", status: "pending" },
    });
    (meetsService.autoPlaceAttendees as jest.Mock).mockResolvedValue({
      attendee: { id: "attendee-1", status: "confirmed" },
    });
    (meetsService.updateAttendeesNotified as jest.Mock).mockResolvedValue({
      updated: 1,
    });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);
    (emailService.saveMessage as jest.Mock).mockResolvedValue(undefined);

    const dto = {
      name: "Sam Trail",
      email: "sam@example.com",
      phone: "+27123456789",
    };
    const req = {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "user-agent": "Mobile Safari",
        "accept-language": "en-ZA",
      },
      ip: "127.0.0.1",
    } as unknown as Request;

    await expect(controller.add("meet-1", dto, req)).resolves.toEqual({
      attendee: { id: "attendee-1", status: "confirmed" },
    });

    expect(meetsService.addAttendee).toHaveBeenCalledWith("meet-1", dto, {
      ip: "203.0.113.10",
      userAgent: "Mobile Safari",
      locale: "en-ZA",
    });
    expect(meetsService.autoPlaceAttendees).toHaveBeenCalledWith(
      "meet-1",
      "attendee-1",
    );
    expect(renderEmailTemplate).toHaveBeenCalledWith(
      "meet-confirm",
      expect.objectContaining({
        meetName: meet.name,
        attendeeName: dto.name,
        logoUrl: "https://cdn.example.com/logos/org-1.webp",
      }),
    );
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: dto.email,
        subject: "subject:meet-confirm",
        attendeeId: "attendee-1",
        meetId: "meet-1",
      }),
    );
    expect(emailService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: dto.email,
        subject: "subject:meet-confirm",
      }),
    );
    expect(meetsService.updateAttendeesNotified).toHaveBeenCalledWith(
      "meet-1",
      ["attendee-1"],
    );
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      attendeeId: "attendee-1",
      meetId: "meet-1",
      action: "signed up for",
      target: "meet Sunrise Hike",
    });
  });

  it("does not set respondedAt for plain signup acknowledgements without auto-placement", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.addAttendee as jest.Mock).mockResolvedValue({
      attendee: { id: "attendee-2", status: "pending" },
    });
    (meetsService.updateAttendeesNotified as jest.Mock).mockResolvedValue({
      updated: 1,
    });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);
    (emailService.saveMessage as jest.Mock).mockResolvedValue(undefined);

    const dto = {
      name: "Riley Peaks",
      email: "riley@example.com",
      phone: "+27129876543",
    };

    await controller.add("meet-1", dto, {
      headers: {},
      ip: "127.0.0.1",
    } as unknown as Request);

    expect(meetsService.autoPlaceAttendees).not.toHaveBeenCalled();
    expect(renderEmailTemplate).toHaveBeenCalledWith(
      "meet-signup",
      expect.objectContaining({
        meetName: meet.name,
        attendeeName: dto.name,
        logoUrl: "https://cdn.example.com/logos/org-1.webp",
      }),
    );
    expect(meetsService.updateAttendeesNotified).not.toHaveBeenCalled();
  });

  it("skips email side effects when the attendee has no email address", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.addAttendee as jest.Mock).mockResolvedValue({
      attendee: { id: "attendee-3", status: "pending" },
    });

    await expect(
      controller.add("meet-1", { name: "Phone Only", phone: "+27123400000" }, {
        headers: {},
        ip: "127.0.0.1",
      } as unknown as Request),
    ).resolves.toEqual({
      attendee: { id: "attendee-3", status: "pending" },
    });

    expect(renderEmailTemplate).not.toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
    expect(emailService.saveMessage).not.toHaveBeenCalled();
    expect(meetsService.updateAttendeesNotified).not.toHaveBeenCalled();
  });

  it("verifies attendee email with a case-insensitive match", async () => {
    (meetsService.findAttendeeForEdit as jest.Mock).mockResolvedValue({
      attendee: { email: "Sam@example.com" },
    });

    await expect(
      controller.verifyEmail("meet-1", "attendee-1", {
        email: "sam@example.com",
      }),
    ).resolves.toEqual({ valid: true });
  });

  it("returns false when attendee email verification does not match", async () => {
    (meetsService.findAttendeeForEdit as jest.Mock).mockResolvedValue({
      attendee: { email: "sam@example.com" },
    });

    await expect(
      controller.verifyEmail("meet-1", "attendee-1", {
        email: "other@example.com",
      }),
    ).resolves.toEqual({ valid: false });
  });

  it("rejects unauthenticated attendee updates", async () => {
    await expect(
      controller.update("meet-1", "attendee-1", {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects attendee updates for non-organizers", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.update("meet-1", "attendee-1", {}, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("delegates attendee updates for the meet organizer", async () => {
    const dto = { status: "checked-in" };
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (meetsService.updateAttendee as jest.Mock).mockResolvedValue({
      attendee: { id: "attendee-1", status: "checked-in" },
    });

    await expect(
      controller.update("meet-1", "attendee-1", dto, user),
    ).resolves.toEqual({
      attendee: { id: "attendee-1", status: "checked-in" },
    });

    expect(meetsService.updateAttendee).toHaveBeenCalledWith(
      "meet-1",
      "attendee-1",
      dto,
    );
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "user-1",
      attendeeId: "attendee-1",
      meetId: "meet-1",
      action: "updated attendee for",
      target: "meet Sunrise Hike",
    });
  });

  it("rejects attendee updates from another organizer in the same organization", async () => {
    const dto = { status: "confirmed" };
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "user-2",
    });
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer",
    );

    await expect(
      controller.update("meet-1", "attendee-1", dto, user),
    ).rejects.toThrow(
      "You cannot access attendees for a meet you do not organize",
    );
  });

  it("allows attendee updates from an admin who is not the meet organizer", async () => {
    const dto = { status: "checked-in" };
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "user-2",
    });
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer" || role === "admin",
    );
    (meetsService.updateAttendee as jest.Mock).mockResolvedValue({
      attendee: { id: "attendee-1", status: "checked-in" },
    });

    await expect(
      controller.update("meet-1", "attendee-1", dto, user),
    ).resolves.toEqual({
      attendee: { id: "attendee-1", status: "checked-in" },
    });

    expect(meetsService.updateAttendee).toHaveBeenCalledWith(
      "meet-1",
      "attendee-1",
      dto,
    );
  });

  it("rejects unauthenticated attendee removal", async () => {
    await expect(
      controller.remove("meet-1", "attendee-1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects attendee removal for non-organizers", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(false);

    await expect(
      controller.remove("meet-1", "attendee-1", user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("delegates attendee removal for organizers", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (authService.hasRole as jest.Mock).mockReturnValue(true);
    (meetsService.removeAttendee as jest.Mock).mockResolvedValue({
      deleted: true,
    });

    await expect(
      controller.remove("meet-1", "attendee-1", user),
    ).resolves.toEqual({
      deleted: true,
    });

    expect(meetsService.removeAttendee).toHaveBeenCalledWith(
      "meet-1",
      "attendee-1",
    );
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "user-1",
      attendeeId: "attendee-1",
      meetId: "meet-1",
      action: "removed attendee from",
      target: "meet Sunrise Hike",
    });
  });

  it("rejects attendee removal by another organizer in the same organization", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "user-2",
    });
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer",
    );

    await expect(
      controller.remove("meet-1", "attendee-1", user),
    ).rejects.toThrow(
      "You cannot access attendees for a meet you do not organize",
    );
  });

  it("allows attendee removal by an admin on another organizer's meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "user-2",
    });
    (authService.hasRole as jest.Mock).mockImplementation(
      (_user, _orgId, role) => role === "organizer" || role === "admin",
    );
    (meetsService.removeAttendee as jest.Mock).mockResolvedValue({
      deleted: true,
    });

    await expect(
      controller.remove("meet-1", "attendee-1", adminUser),
    ).resolves.toEqual({
      deleted: true,
    });
  });
});
