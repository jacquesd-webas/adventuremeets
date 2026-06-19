import { HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { IncomingMailController } from "./incoming-mail.controller";
import { DatabaseService } from "../database/database.service";
import { EmailService } from "../email/email.service";
import { AuditLogService } from "../audit/audit-log.service";

describe("IncomingMailController", () => {
  let controller: IncomingMailController;

  const firstMocks = {
    meets: jest.fn(),
    users: jest.fn(),
    meetAttendees: jest.fn(),
  };

  const createQueryBuilder = (table: "meets" | "users" | "meetAttendees") => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhereRaw:
        table === "meetAttendees"
          ? jest.fn().mockReturnThis()
          : undefined,
      first: firstMocks[table],
    };
    return builder;
  };

  const dbClient = jest.fn((table: string) => {
    if (table === "meets") return createQueryBuilder("meets");
    if (table === "users") return createQueryBuilder("users");
    if (table === "meet_attendees") return createQueryBuilder("meetAttendees");
    throw new Error(`Unexpected table ${table}`);
  });

  const db = {
    getClient: jest.fn(() => dbClient),
  } as unknown as DatabaseService;

  const emailService = {
    parseMessageContent: jest.fn(),
    sendEmail: jest.fn(),
    saveIncomingMessage: jest.fn(),
  } as unknown as EmailService;

  const auditLogService = {
    addRecord: jest.fn(),
  } as unknown as AuditLogService;

  const response = () =>
    ({
      status: jest.fn().mockReturnThis(),
    }) as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new IncomingMailController(db, emailService, auditLogService);
    process.env.MAIL_DOMAIN = "adventuremeets.apps.fringecoding.com";
  });

  it("ignores requests when required inputs are missing", async () => {
    const res = response();

    await expect(
      controller.handleIncoming(
        undefined as any,
        "sender@example.com",
        undefined as any,
        "",
        { rawBody: undefined } as unknown as Request,
        res,
      ),
    ).resolves.toEqual({
      status: "ignored",
    });

    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(db.getClient).not.toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it("returns not found when the meet does not exist", async () => {
    firstMocks.meets.mockResolvedValue(null);
    const res = response();

    await expect(
      controller.handleIncoming(
        "meet-1@adventuremeets.apps.fringecoding.com",
        "sender@example.com",
        undefined as any,
        "Subject: Test\r\n\r\nHello",
        {} as Request,
        res,
      ),
    ).resolves.toEqual({
      status: "meet not found",
    });

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(firstMocks.meets).toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it("returns not found when the meet organizer has no email", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
    });
    firstMocks.users.mockResolvedValue(null);
    const res = response();

    await expect(
      controller.handleIncoming(
        "meet-1@adventuremeets.apps.fringecoding.com",
        "sender@example.com",
        undefined as any,
        "Subject: Test\r\n\r\nHello",
        {} as Request,
        res,
      ),
    ).resolves.toEqual({
      status: "meet organiser not found",
    });

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(firstMocks.users).toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it("forwards the parsed message to the organizer and records the attendee match", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
    });
    firstMocks.users.mockResolvedValue({
      email: "organizer@example.com",
    });
    firstMocks.meetAttendees.mockResolvedValue({
      id: "attendee-1",
    });
    (emailService.parseMessageContent as jest.Mock).mockReturnValue({
      subject: "Need to cancel",
      pertinentBody: "Please cancel my spot",
      body: "Please cancel my spot\n\nThanks",
    });
    const res = response();

    await expect(
      controller.handleIncoming(
        ["meet+meet-1@adventuremeets.apps.fringecoding.com"],
        ["sender@example.com"],
        ["203.0.113.10"],
        "fallback body",
        {
          rawBody: Buffer.from("Subject: Need to cancel\r\n\r\nPlease cancel"),
        } as unknown as Request,
        res,
      ),
    ).resolves.toEqual({
      status: "ok",
    });

    expect(emailService.parseMessageContent).toHaveBeenCalledWith(
      "Subject: Need to cancel\r\n\r\nPlease cancel",
    );
    expect(emailService.sendEmail).toHaveBeenCalledWith({
      to: "organizer@example.com",
      subject: "Need to cancel",
      text: "Please cancel my spot",
      meetId: "meet-1",
    });
    expect(emailService.saveIncomingMessage).toHaveBeenCalledWith({
      meetId: "meet-1",
      attendeeId: "attendee-1",
      from: "sender@example.com",
      to: "organizer@example.com",
      rawContent: "Subject: Need to cancel\r\n\r\nPlease cancel",
    });
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      attendeeId: "attendee-1",
      meetId: "meet-1",
      description: "Incoming mail for meet Sunrise Hike",
    });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
  });

  it("uses the fallback subject and null attendee when no attendee matches", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
    });
    firstMocks.users.mockResolvedValue({
      email: "organizer@example.com",
    });
    firstMocks.meetAttendees.mockResolvedValue(null);
    (emailService.parseMessageContent as jest.Mock).mockReturnValue({
      subject: "",
      pertinentBody: "",
      body: "Full parsed body",
    });
    const res = response();

    await expect(
      controller.handleIncoming(
        "meet-1@adventuremeets.apps.fringecoding.com",
        "unknown@example.com",
        undefined as any,
        { plain: "body" },
        {} as Request,
        res,
      ),
    ).resolves.toEqual({
      status: "ok",
    });

    expect(emailService.sendEmail).toHaveBeenCalledWith({
      to: "organizer@example.com",
      subject: "Message for meet: Sunrise Hike",
      text: "Full parsed body",
      meetId: "meet-1",
    });
    expect(emailService.saveIncomingMessage).toHaveBeenCalledWith({
      meetId: "meet-1",
      attendeeId: null,
      from: "unknown@example.com",
      to: "organizer@example.com",
      rawContent: JSON.stringify({ plain: "body" }),
    });
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      attendeeId: null,
      meetId: "meet-1",
      description: "Incoming mail for meet Sunrise Hike",
    });
  });
});
