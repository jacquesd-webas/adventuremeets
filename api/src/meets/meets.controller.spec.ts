import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
const workbookState: {
  rows: Record<string, any>[];
  columns: Record<string, any>[];
} = {
  rows: [],
  columns: [],
};

jest.mock("exceljs", () => ({
  Workbook: class MockWorkbook {
    addWorksheet() {
      workbookState.rows = [];
      workbookState.columns = [];
      return {
        get columns() {
          return workbookState.columns;
        },
        set columns(value: Record<string, any>[]) {
          workbookState.columns = value;
        },
        addRow: (row: Record<string, any>) => {
          workbookState.rows.push(row);
        },
      };
    }

    xlsx = {
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from("xlsx")),
    };
  },
}));

import { MeetsController } from "./meets.controller";
import { MeetsService } from "./meets.service";
import { AuthService } from "../auth/auth.service";
import { EmailService } from "../email/email.service";
import { DatabaseService } from "../database/database.service";
import { UserProfile } from "../users/dto/user-profile.dto";

describe("MeetsController", () => {
  let controller: MeetsController;

  const meetsService = {
    findOne: jest.fn(),
    listImages: jest.fn(),
    addImage: jest.fn(),
    updateImage: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    resetConfirmedAttendeesToInvited: jest.fn(),
    listAttendees: jest.fn(),
    updateAttendeesNotified: jest.fn(),
    updateAttendee: jest.fn(),
    attendeeHasMissingFields: jest.fn(),
    getAttendeeContactById: jest.fn(),
    getOrganizerEmail: jest.fn(),
    getReportData: jest.fn(),
  } as unknown as MeetsService;

  const emailService = {
    sendEmail: jest.fn(),
    saveMessage: jest.fn(),
  } as unknown as EmailService;

  const db = {
    getClient: jest.fn(),
  } as unknown as DatabaseService;

  const authService = {
    hasRole: jest.fn(),
    getUserOrganizationIds: jest.fn(),
  } as unknown as AuthService;

  const user: UserProfile = {
    id: "organizer-1",
    email: "organizer@example.com",
    organizations: { "org-1": "organizer" },
    pendingInvites: [],
  };

  const meet = {
    id: "meet-1",
    organizationId: "org-1",
    organizerId: "organizer-1",
    name: "Sunrise Hike",
    shareCode: "share-123",
    startTime: "2026-04-14T08:00:00.000Z",
    endTime: "2026-04-14T10:00:00.000Z",
    timeZone: "Africa/Johannesburg",
    location: "Trailhead",
    organizerName: "Taylor",
    organizerEmail: "taylor@example.com",
  };

  const setRoles = ({
    organizer = false,
    admin = false,
  }: {
    organizer?: boolean;
    admin?: boolean;
  }) => {
    (authService.hasRole as jest.Mock).mockImplementation(
      (_currentUser, _organizationId, role) => {
        if (role === "organizer") return organizer;
        if (role === "admin") return admin;
        return false;
      },
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    workbookState.rows = [];
    workbookState.columns = [];
    controller = new MeetsController(
      meetsService,
      emailService,
      db,
      authService,
    );
  });

  it("rejects unauthenticated status updates", async () => {
    await expect(
      controller.updateStatus("meet-1", { statusId: 2 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects status updates for non-organizers", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    setRoles({});

    await expect(
      controller.updateStatus("meet-1", { statusId: 2 }, undefined, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects status updates from another organizer who is not an admin", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "organizer-2",
    });
    setRoles({ organizer: true, admin: false });

    await expect(
      controller.updateStatus("meet-1", { statusId: 2 }, undefined, user),
    ).rejects.toThrow("Cannot update a meet you are not the organizer of");
  });

  it("allows status updates from an admin who is not the organizer", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "organizer-2",
    });
    setRoles({ organizer: true, admin: true });
    (meetsService.updateStatus as jest.Mock).mockResolvedValue({
      id: "meet-1",
      status_id: 2,
    });

    await expect(
      controller.updateStatus("meet-1", { statusId: 2 }, undefined, user),
    ).resolves.toEqual({
      id: "meet-1",
      status_id: 2,
    });
  });

  it("throws when updating a missing meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      controller.updateStatus("meet-1", { statusId: 2 }, undefined, user),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("notifies attendees when closing a meet with notifyAttendees enabled", async () => {
    process.env.MAIL_DOMAIN = "example.com";
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    setRoles({ organizer: true });
    (meetsService.updateStatus as jest.Mock).mockResolvedValue({
      id: "meet-1",
      status_id: 4,
    });
    (meetsService.listAttendees as jest.Mock).mockResolvedValue({
      attendees: [
        {
          id: "attendee-1",
          email: "confirmed@example.com",
          name: "Confirmed Casey",
          status: "confirmed",
        },
        {
          id: "attendee-2",
          email: "waitlisted@example.com",
          name: "Waitlisted Wren",
          status: "waitlisted",
        },
        {
          id: "attendee-3",
          email: "invited@example.com",
          name: "Invited Ian",
          status: "invited",
        },
      ],
    });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);
    (emailService.saveMessage as jest.Mock).mockResolvedValue(undefined);

    await expect(
      controller.updateStatus(
        "meet-1",
        { statusId: 4, notifyAttendees: true },
        undefined,
        user,
      ),
    ).resolves.toEqual({
      id: "meet-1",
      status_id: 4,
    });

    expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    expect(emailService.saveMessage).toHaveBeenCalledTimes(2);
    expect(meetsService.updateAttendeesNotified).toHaveBeenCalledWith(
      "meet-1",
      ["attendee-1", "attendee-2"],
    );
  });

  it("allows worker-api status updates without a user session", async () => {
    const previousWorkerApiKey = process.env.WORKER_API_KEY;
    process.env.WORKER_API_KEY = "worker-secret";
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.updateStatus as jest.Mock).mockResolvedValue({
      id: "meet-1",
      status_id: 4,
    });

    await expect(
      controller.updateStatus(
        "meet-1",
        { statusId: 4 },
        "worker-secret",
      ),
    ).resolves.toEqual({
      id: "meet-1",
      status_id: 4,
    });

    expect(meetsService.updateStatus).toHaveBeenCalledWith("meet-1", 4);
    process.env.WORKER_API_KEY = previousWorkerApiKey;
  });

  it("lists images for an editable meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.listImages as jest.Mock).mockResolvedValue({
      images: [{ id: "image-1", isPrimary: true, url: "https://cdn/img.jpg" }],
    });
    setRoles({ organizer: true });

    await expect(controller.listImages("meet-1", user)).resolves.toEqual({
      images: [{ id: "image-1", isPrimary: true, url: "https://cdn/img.jpg" }],
    });

    expect(meetsService.listImages).toHaveBeenCalledWith("meet-1");
  });

  it("updates the main image for an editable meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.updateImage as jest.Mock).mockResolvedValue({
      image: { id: "image-1", isPrimary: true },
    });
    setRoles({ organizer: true });

    await expect(
      controller.updateImage("meet-1", "image-1", { isPrimary: true }, user),
    ).resolves.toEqual({
      image: { id: "image-1", isPrimary: true },
    });

    expect(meetsService.updateImage).toHaveBeenCalledWith(
      "meet-1",
      "image-1",
      { isPrimary: true },
    );
  });

  it("resets confirmed attendees to invited when reconfirmAttendees is true", async () => {
    process.env.MAIL_DOMAIN = "example.com";
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    setRoles({ organizer: true });
    (meetsService.listAttendees as jest.Mock).mockResolvedValue({
      attendees: [
        {
          id: "attendee-1",
          userId: "member-1",
          status: "confirmed",
          email: "member@example.com",
          name: "Casey Trail",
        },
        {
          id: "attendee-2",
          userId: "organizer-1",
          status: "confirmed",
          email: "organizer@example.com",
          name: "Taylor",
        },
      ],
    });
    (meetsService.updateStatus as jest.Mock).mockResolvedValue({
      id: "meet-1",
      status_id: 2,
    });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);
    (emailService.saveMessage as jest.Mock).mockResolvedValue(undefined);

    await expect(
      controller.updateStatus(
        "meet-1",
        { statusId: 2, reconfirmAttendees: true },
        undefined,
        user,
      ),
    ).resolves.toEqual({
      id: "meet-1",
      status_id: 2,
    });

    expect(meetsService.updateStatus).toHaveBeenCalledWith("meet-1", 2);
    expect(
      meetsService.resetConfirmedAttendeesToInvited,
    ).toHaveBeenCalledWith("meet-1", "organizer-1");
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "member@example.com",
        attendeeId: "attendee-1",
        meetId: "meet-1",
      }),
    );
    expect(emailService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "member@example.com",
        attendeeId: "attendee-1",
        meetId: "meet-1",
      }),
    );
    expect(meetsService.updateAttendeesNotified).toHaveBeenCalledWith(
      "meet-1",
      ["attendee-1"],
    );
  });

  it("rejects deleting a draft meet owned by another organizer", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      organizerId: "organizer-2",
      statusId: 1,
    });
    setRoles({ organizer: true, admin: false });

    await expect(controller.remove("meet-1", user)).rejects.toThrow(
      "Cannot delete a meet you are not the organizer of",
    );
  });

  it("returns hasMissingFields when confirming an attendee by code", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.updateAttendee as jest.Mock).mockResolvedValue({
      attendee: { id: "attendee-1", status: "confirmed" },
    });
    (meetsService.attendeeHasMissingFields as jest.Mock).mockResolvedValue(
      true,
    );

    await expect(
      controller.updateAttendeeByCode("share-123", "attendee-1", {
        status: "confirmed",
      }),
    ).resolves.toEqual({
      attendee: { id: "attendee-1", status: "confirmed" },
      hasMissingFields: true,
    });

    expect(meetsService.updateAttendee).toHaveBeenCalledWith(
      "meet-1",
      "attendee-1",
      { status: "confirmed" },
      { resetCancelledToPending: true },
    );
    expect(meetsService.attendeeHasMissingFields).toHaveBeenCalledWith(
      "meet-1",
      "attendee-1",
    );
  });

  it("creates a final report that maps confirmed attendees to no-show", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.getOrganizerEmail as jest.Mock).mockResolvedValue(
      "organizer@example.com",
    );
    (meetsService.getReportData as jest.Mock).mockResolvedValue({
      attendees: [
        {
          id: "attendee-1",
          name: "Alex",
          email: "alex@example.com",
          phone: "+27123456789",
          status: "confirmed",
          guests: 0,
          metaValues: [],
        },
        {
          id: "attendee-2",
          name: "Jamie",
          email: "jamie@example.com",
          phone: "+27123456780",
          status: "attended",
          guests: 1,
          metaValues: [],
        },
      ],
      metaDefinitions: [],
    });
    setRoles({ organizer: true });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

    await expect(
      controller.createReport(
        "meet-1",
        user,
        { sendEmail: true, downloadReport: false, isFinalReport: true },
      ),
    ).resolves.toEqual({
      status: "sent",
      to: "organizer@example.com",
    });

    expect(workbookState.rows).toEqual([
      expect.objectContaining({
        name: "Alex",
        status: "no-show",
      }),
      expect.objectContaining({
        name: "Jamie",
        status: "attended",
      }),
    ]);
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "organizer@example.com",
        attachments: [
          expect.objectContaining({
            filename: `${meet.name}-report.xlsx`,
          }),
        ],
      }),
    );
  });

  it("creates an interim report without remapping confirmed attendees", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.getOrganizerEmail as jest.Mock).mockResolvedValue(
      "organizer@example.com",
    );
    (meetsService.getReportData as jest.Mock).mockResolvedValue({
      attendees: [
        {
          id: "attendee-1",
          name: "Alex",
          email: "alex@example.com",
          phone: "+27123456789",
          status: "confirmed",
          guests: 0,
          metaValues: [],
        },
      ],
      metaDefinitions: [],
    });
    setRoles({ organizer: true });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

    await controller.createReport(
      "meet-1",
      user,
      { sendEmail: true, downloadReport: false, isFinalReport: false },
    );

    expect(workbookState.rows).toEqual([
      expect.objectContaining({
        name: "Alex",
        status: "confirmed",
      }),
    ]);
  });

  it("rejects report generation when no delivery method is selected", async () => {
    await expect(
      controller.createReport(
        "meet-1",
        user,
        { sendEmail: false, downloadReport: false },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("sets respondedAt for attendees when an organizer manually sends a message", async () => {
    process.env.MAIL_DOMAIN = "example.com";
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    setRoles({ organizer: true });
    (meetsService.getAttendeeContactById as jest.Mock).mockImplementation(
      async (attendeeId: string) => ({
        id: attendeeId,
        name: attendeeId === "attendee-1" ? "Alex" : "Jamie",
        email:
          attendeeId === "attendee-1"
            ? "alex@example.com"
            : "jamie@example.com",
      }),
    );
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);
    (emailService.saveMessage as jest.Mock).mockResolvedValue(undefined);

    await expect(
      controller.messageAttendees(
        "meet-1",
        {
          subject: "Bring a shell",
          text: "Please bring a shell jacket.",
          attendeeIds: ["attendee-1", "attendee-2"],
        },
        user,
      ),
    ).resolves.toEqual({
      status: "sent",
      count: 2,
    });

    expect(meetsService.updateAttendeesNotified).toHaveBeenCalledWith(
      "meet-1",
      ["attendee-1", "attendee-2"],
    );
  });
});
