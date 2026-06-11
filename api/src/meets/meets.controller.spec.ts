import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
const workbookState: {
  rows: Record<string, any>[];
  columns: Record<string, any>[];
  uploadRows: Array<Array<any>>;
} = {
  rows: [],
  columns: [],
  uploadRows: [],
};

const createMockCell = (value: any) => ({
  text: value == null ? "" : String(value),
  value,
});

const createMockRow = (values: any[]) => ({
  eachCell: (callback: (cell: any, colNumber: number) => void) => {
    values.forEach((value, index) => {
      callback(createMockCell(value), index + 1);
    });
  },
  getCell: (colNumber: number) => createMockCell(values[colNumber - 1]),
});

const createMockWorksheet = (rows: Array<Array<any>>) => ({
  getRow: (rowNumber: number) => createMockRow(rows[rowNumber - 1] || []),
  eachRow: (callback: (row: any, rowNumber: number) => void) => {
    rows.forEach((rowValues, index) => {
      callback(createMockRow(rowValues), index + 1);
    });
  },
});

jest.mock("exceljs", () => ({
  Workbook: class MockWorkbook {
    worksheets: any[] = [];

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
      load: jest.fn().mockImplementation(async () => {
        this.worksheets =
          workbookState.uploadRows.length > 0
            ? [createMockWorksheet(workbookState.uploadRows)]
            : [];
      }),
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
import { OrganizationsService } from "../organizations/organizations.service";
import { AuditLogService } from "../audit/audit-log.service";

describe("MeetsController", () => {
  let controller: MeetsController;

  const meetsService = {
    create: jest.fn(),
    clone: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    listImages: jest.fn(),
    addImage: jest.fn(),
    addInvitedAttendees: jest.fn(),
    updateImage: jest.fn(),
    removeImage: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    resetConfirmedAttendeesToInvited: jest.fn(),
    listAttendees: jest.fn(),
    updateAttendeesNotified: jest.fn(),
    updateAttendee: jest.fn(),
    attendeeHasMissingFields: jest.fn(),
    markAttendeeMessageRead: jest.fn(),
    getAttendeeContactById: jest.fn(),
    getOrganizerEmail: jest.fn(),
    getReportData: jest.fn(),
  } as unknown as MeetsService;

  const emailService = {
    sendEmail: jest.fn(),
    saveMessage: jest.fn(),
  } as unknown as EmailService;

  const organizationService = {
    canOrganizationShareMeets: jest.fn(),
    findLogoUrlById: jest.fn(),
    findById: jest.fn(),
  } as unknown as OrganizationsService;

  const auditLogService = {
    addRecord: jest.fn(),
  } as unknown as AuditLogService;

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
    firstName: "Sally",
    lastName: "Jones",
    organizations: { "org-1": "organizer" },
    pendingInvites: [],
  };

  const memberUser: UserProfile = {
    id: "member-1",
    email: "member@example.com",
    organizations: { "org-1": "member" },
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
    member = false,
    organizer = false,
    admin = false,
  }: {
    member?: boolean;
    organizer?: boolean;
    admin?: boolean;
  }) => {
    (authService.hasRole as jest.Mock).mockImplementation(
      (_currentUser, _organizationId, role) => {
        if (role === "member") return member || organizer || admin;
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
    workbookState.uploadRows = [];
    controller = new MeetsController(
      meetsService,
      organizationService,
      auditLogService,
      emailService,
      db,
      authService,
    );
    (organizationService.findLogoUrlById as jest.Mock).mockResolvedValue(
      "https://cdn.example.com/logos/org-1.webp",
    );
    (organizationService.findById as jest.Mock).mockResolvedValue({
      id: "org-1",
      name: "Adventure Club",
      customField1Name: undefined,
      customField2Name: undefined,
    });
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
    ).rejects.toThrow("Cannot update a meet you are not the organiser of");
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

    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      meetId: "meet-1",
      action: "changed status of",
      target: "meet Sunrise Hike to Published",
    });
  });

  it("throws when updating a missing meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      controller.updateStatus("meet-1", { statusId: 2 }, undefined, user),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("creates a meet and writes an audit log", async () => {
    (authService.getUserOrganizationIds as jest.Mock).mockReturnValue([
      "org-1",
    ]);
    setRoles({ organizer: true });
    (meetsService.create as jest.Mock).mockResolvedValue({
      id: "meet-1",
      name: "Sunrise Hike",
    });

    await expect(
      controller.create(
        { name: "Sunrise Hike", organizationId: "org-1" } as any,
        user,
      ),
    ).resolves.toEqual({
      id: "meet-1",
      name: "Sunrise Hike",
    });

    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "created",
      target: "meet Sunrise Hike",
    });
  });

  it("clones a meet and writes an audit log", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.clone as jest.Mock).mockResolvedValue({
      id: "meet-2",
      name: "Sunrise Hike Copy",
    });
    setRoles({ organizer: true });

    await expect(
      controller.clone("meet-1", { name: "Sunrise Hike Copy" }, user),
    ).resolves.toEqual({
      id: "meet-2",
      name: "Sunrise Hike Copy",
    });

    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-2",
      action: "cloned",
      target: "meet Sunrise Hike Copy",
    });
  });

  it("updates a meet and writes an audit log", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.update as jest.Mock).mockResolvedValue({
      id: "meet-1",
      name: "Updated Hike",
    });
    setRoles({ organizer: true });

    await expect(
      controller.update("meet-1", { name: "Updated Hike" } as any, user),
    ).resolves.toEqual({
      id: "meet-1",
      name: "Updated Hike",
    });

    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "edited",
      target: "meet Updated Hike",
    });
  });

  it("writes an audit log for worker-driven status changes", async () => {
    process.env.WORKER_API_KEY = "worker-secret";
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      statusId: 3,
    });
    (meetsService.updateStatus as jest.Mock).mockResolvedValue({
      id: "meet-1",
      status_id: 4,
    });

    await expect(
      controller.updateStatus("meet-1", { statusId: 4 }, "worker-secret"),
    ).resolves.toEqual({
      id: "meet-1",
      status_id: 4,
    });

    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      meetId: "meet-1",
      description: "Worker changed status of Sunrise Hike to Closed",
    });
  });

  it('forces scope to "my" for members when the organization does not share meets', async () => {
    (
      organizationService.canOrganizationShareMeets as jest.Mock
    ).mockResolvedValue(false);
    (meetsService.findAll as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
    });
    setRoles({ member: true });

    await expect(
      controller.findAll(
        "all",
        "all",
        "1",
        "20",
        "org-1",
        undefined,
        undefined,
        undefined,
        memberUser,
      ),
    ).resolves.toEqual({
      items: [],
      total: 0,
    });

    expect(organizationService.canOrganizationShareMeets).toHaveBeenCalledWith(
      "org-1",
    );
    expect(meetsService.findAll).toHaveBeenCalledWith(
      "all",
      1,
      20,
      ["org-1"],
      false,
      "member-1",
      null,
      null,
      null,
      "my",
    );
  });

  it("preserves requested scope for members when the organization shares meets", async () => {
    (
      organizationService.canOrganizationShareMeets as jest.Mock
    ).mockResolvedValue(true);
    (meetsService.findAll as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
    });
    setRoles({ member: true });

    await controller.findAll(
      "all",
      "all",
      "1",
      "20",
      "org-1",
      undefined,
      undefined,
      undefined,
      memberUser,
    );

    expect(meetsService.findAll).toHaveBeenCalledWith(
      "all",
      1,
      20,
      ["org-1"],
      false,
      "member-1",
      null,
      null,
      null,
      "all",
    );
  });

  it("does not check organization sharing for organizers when listing meets", async () => {
    (meetsService.findAll as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
    });
    setRoles({ organizer: true });

    await controller.findAll(
      "all",
      "all",
      "1",
      "20",
      "org-1",
      undefined,
      undefined,
      undefined,
      user,
    );

    expect(
      organizationService.canOrganizationShareMeets,
    ).not.toHaveBeenCalled();
    expect(meetsService.findAll).toHaveBeenCalledWith(
      "all",
      1,
      20,
      ["org-1"],
      true,
      "organizer-1",
      null,
      null,
      null,
      "all",
    );
  });

  it("allows a member to fetch meet details when the organization allows viewing all meets", async () => {
    (
      organizationService.canOrganizationShareMeets as jest.Mock
    ).mockResolvedValue(true);
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      statusId: 4,
      isHidden: true,
      myAttendeeStatus: null,
    });
    setRoles({ member: true });

    await expect(controller.findOne("meet-1", memberUser)).resolves.toEqual(
      expect.objectContaining({
        id: "meet-1",
      }),
    );
  });

  it("rejects a member from fetching hidden non-public meet details when view-all is disabled", async () => {
    (
      organizationService.canOrganizationShareMeets as jest.Mock
    ).mockResolvedValue(false);
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      statusId: 4,
      isHidden: true,
      myAttendeeStatus: null,
    });
    setRoles({ member: true });

    await expect(
      controller.findOne("meet-1", memberUser),
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
      controller.updateStatus("meet-1", { statusId: 4 }, "worker-secret"),
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

  it("adds an image for an editable meet and writes an audit log", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.addImage as jest.Mock).mockResolvedValue({
      image: { id: "image-1", url: "https://cdn/img.jpg" },
    });
    setRoles({ organizer: true });

    await expect(
      controller.addImage(
        "meet-1",
        { mimetype: "image/png" },
        { isPrimary: true } as any,
        user,
      ),
    ).resolves.toEqual({
      image: { id: "image-1", url: "https://cdn/img.jpg" },
    });

    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "added image to",
      target: "meet Sunrise Hike",
    });
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

    expect(meetsService.updateImage).toHaveBeenCalledWith("meet-1", "image-1", {
      isPrimary: true,
    });
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "updated image for",
      target: "meet Sunrise Hike",
    });
  });

  it("deletes an image for an editable meet", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.removeImage as jest.Mock).mockResolvedValue({
      removed: true,
    });
    setRoles({ organizer: true });

    await expect(
      controller.removeImage("meet-1", "image-1", user),
    ).resolves.toEqual({
      removed: true,
    });

    expect(meetsService.removeImage).toHaveBeenCalledWith("meet-1", "image-1");
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "removed image from",
      target: "meet Sunrise Hike",
    });
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
    expect(meetsService.resetConfirmedAttendeesToInvited).toHaveBeenCalledWith(
      "meet-1",
      "organizer-1",
    );
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
      "Cannot delete a meet you are not the organiser of",
    );
  });

  it("deletes a draft meet for the organizer", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      statusId: 1,
    });
    (meetsService.remove as jest.Mock).mockResolvedValue({ deleted: true });
    setRoles({ organizer: true });

    await expect(controller.remove("meet-1", user)).resolves.toEqual({
      deleted: true,
    });

    expect(meetsService.remove).toHaveBeenCalledWith("meet-1");
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "deleted",
      target: "meet Sunrise Hike",
    });
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
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: null,
      attendeeId: "attendee-1",
      meetId: "meet-1",
      action: "updated application for",
      target: "meet Sunrise Hike",
    });
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
      controller.createReport("meet-1", user, {
        sendEmail: true,
        downloadReport: false,
        isFinalReport: true,
      }),
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
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "created report for",
      target: "meet Sunrise Hike",
    });
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

    await controller.createReport("meet-1", user, {
      sendEmail: true,
      downloadReport: false,
      isFinalReport: false,
    });

    expect(workbookState.rows).toEqual([
      expect.objectContaining({
        name: "Alex",
        status: "confirmed",
      }),
    ]);
  });

  it("omits paid columns when the meet has no costs configured", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue({
      ...meet,
      costCents: undefined,
      depositCents: undefined,
    });
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
          paidDepositAt: "2026-01-01T10:00:00.000Z",
          paidFullAt: "2026-01-02T10:00:00.000Z",
          metaValues: [],
        },
      ],
      metaDefinitions: [],
    });
    setRoles({ organizer: true });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

    await controller.createReport("meet-1", user, {
      sendEmail: true,
      downloadReport: false,
      isFinalReport: false,
    });

    expect(workbookState.columns).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ header: "Paid Deposit At" }),
        expect.objectContaining({ header: "Paid Full At" }),
      ]),
    );
  });

  it("includes named organization fields in report columns and rows", async () => {
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
          org1Value: "Trail Crew",
          org2Value: "Team Red",
          metaValues: [],
        },
      ],
      metaDefinitions: [],
    });
    (organizationService.findById as jest.Mock).mockResolvedValue({
      id: "org-1",
      name: "Adventure Club",
      customField1Name: "Club",
      customField2Name: "Group",
    });
    setRoles({ organizer: true });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

    await controller.createReport("meet-1", user, {
      sendEmail: true,
      downloadReport: false,
      isFinalReport: false,
    });

    expect(workbookState.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ header: "Club", key: "org1Value" }),
        expect.objectContaining({ header: "Group", key: "org2Value" }),
      ]),
    );
    expect(workbookState.rows).toEqual([
      expect.objectContaining({
        name: "Alex",
        org1Value: "Trail Crew",
        org2Value: "Team Red",
      }),
    ]);
  });

  it("only includes question columns marked for reports", async () => {
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
          metaValues: [
            {
              definitionId: "meta-1",
              value: "Vegetarian",
            },
            {
              definitionId: "meta-2",
              value: "Should not export",
            },
          ],
        },
      ],
      metaDefinitions: [
        {
          id: "meta-1",
          label: "Dietary requirements",
          config: { includeInReports: true },
        },
        {
          id: "meta-2",
          label: "Private note",
          config: { includeInReports: false },
        },
      ],
    });
    setRoles({ organizer: true });
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

    await controller.createReport("meet-1", user, {
      sendEmail: true,
      downloadReport: false,
      isFinalReport: false,
    });

    expect(workbookState.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          header: "Dietary requirements",
          key: "meta_meta-1",
        }),
      ]),
    );
    expect(workbookState.columns).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          header: "Private note",
          key: "meta_meta-2",
        }),
      ]),
    );
    expect(workbookState.rows).toEqual([
      expect.objectContaining({
        name: "Alex",
        "meta_meta-1": "Vegetarian",
      }),
    ]);
    expect(workbookState.rows[0]).not.toHaveProperty(
      "meta_meta-2",
      "Should not export",
    );
  });

  it("rejects report generation when no delivery method is selected", async () => {
    await expect(
      controller.createReport("meet-1", user, {
        sendEmail: false,
        downloadReport: false,
      }),
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

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alex@example.com",
        attendeeId: "attendee-1",
        meetId: "meet-1",
        replyTo: "meet+meet-1@example.com",
      }),
    );
    expect(meetsService.updateAttendeesNotified).toHaveBeenCalledWith(
      "meet-1",
      ["attendee-1", "attendee-2"],
    );
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "messaged attendees for",
      target: "meet Sunrise Hike",
    });
  });

  it("can send a grouped attendee message", async () => {
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
          subject: "Bring snacks",
          text: "Shared note.",
          attendeeIds: ["attendee-1", "attendee-2"],
          sendAsGroup: true,
        },
        user,
      ),
    ).resolves.toEqual({
      status: "sent",
      count: 2,
    });

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["alex@example.com", "jamie@example.com"],
        replyTo: "meet+meet-1@example.com",
      }),
    );
    expect(emailService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["alex@example.com", "jamie@example.com"],
      }),
    );
  });

  it("maps extra upload columns to matching meta field labels and field keys", async () => {
    workbookState.uploadRows = [
      [
        "Name",
        "Email",
        "Phone",
        "Fitness Level",
        "dietary requirements",
        "Q3",
        "Ignored Column",
      ],
      [
        "Alex",
        "alex@example.com",
        "+27123456789",
        "Strong",
        "Vegetarian",
        "Sam 0821234567",
        "unused",
      ],
    ];

    const metaDefinitionsBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        {
          id: "meta-1",
          field_key: "fitness_level",
          label: "Fitness Level",
          position: 1,
        },
        {
          id: "meta-2",
          field_key: "dietary_requirements",
          label: "Dietary Requirements",
          position: 2,
        },
        {
          id: "meta-3",
          field_key: "emergency_contact",
          label: "Emergency Contact",
          position: 3,
        },
      ]),
    };
    const client: any = (table: string) => {
      if (table === "meet_meta_definitions") return metaDefinitionsBuilder;
      throw new Error(`Unexpected table: ${table}`);
    };

    (db.getClient as jest.Mock).mockReturnValue(client);
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.addInvitedAttendees as jest.Mock).mockResolvedValue({
      created: 1,
      skipped: 0,
    });
    setRoles({ organizer: true });

    await expect(
      controller.uploadAttendees(
        "meet-1",
        { buffer: Buffer.from("xlsx") },
        user,
      ),
    ).resolves.toEqual({
      created: 1,
      skipped: 0,
    });

    expect(meetsService.addInvitedAttendees).toHaveBeenCalledWith("meet-1", [
      {
        name: "Alex",
        email: "alex@example.com",
        phone: "+27123456789",
        metaValues: [
          { definitionId: "meta-3", value: "Sam 0821234567" },
          { definitionId: "meta-1", value: "Strong" },
          { definitionId: "meta-2", value: "Vegetarian" },
        ],
      },
    ]);
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "uploaded attendees for",
      target: "meet Sunrise Hike",
    });
  });

  it("matches upload headings case-insensitively", async () => {
    workbookState.uploadRows = [
      ["NAME", "eMaIl", "pHoNe", "FITNESS LEVEL", "DiEtArY_ReQuIrEmEnTs"],
      ["Jamie", "jamie@example.com", "+27129876543", "Easy", "Vegan"],
    ];

    const metaDefinitionsBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        {
          id: "meta-1",
          field_key: "fitness_level",
          label: "Fitness Level",
          position: 1,
        },
        {
          id: "meta-2",
          field_key: "dietary_requirements",
          label: "Dietary Requirements",
          position: 2,
        },
      ]),
    };
    const client: any = (table: string) => {
      if (table === "meet_meta_definitions") return metaDefinitionsBuilder;
      throw new Error(`Unexpected table: ${table}`);
    };

    (db.getClient as jest.Mock).mockReturnValue(client);
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.addInvitedAttendees as jest.Mock).mockResolvedValue({
      created: 1,
      skipped: 0,
    });
    setRoles({ organizer: true });

    await expect(
      controller.uploadAttendees(
        "meet-1",
        { buffer: Buffer.from("xlsx") },
        user,
      ),
    ).resolves.toEqual({
      created: 1,
      skipped: 0,
    });

    expect(meetsService.addInvitedAttendees).toHaveBeenCalledWith("meet-1", [
      {
        name: "Jamie",
        email: "jamie@example.com",
        phone: "+27129876543",
        metaValues: [
          { definitionId: "meta-1", value: "Easy" },
          { definitionId: "meta-2", value: "Vegan" },
        ],
      },
    ]);
  });

  it("marks a message as read and writes an audit log", async () => {
    (meetsService.findOne as jest.Mock).mockResolvedValue(meet);
    (meetsService.markAttendeeMessageRead as jest.Mock).mockResolvedValue(
      undefined,
    );
    setRoles({ organizer: true });

    await expect(
      controller.markMessageRead("meet-1", "message-1", user),
    ).resolves.toEqual({
      status: "ok",
    });

    expect(meetsService.markAttendeeMessageRead).toHaveBeenCalledWith(
      "meet-1",
      "message-1",
    );
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      userId: "organizer-1",
      attendeeId: null,
      meetId: "meet-1",
      action: "marked message read for",
      target: "meet Sunrise Hike",
    });
  });
});
