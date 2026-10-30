import { HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { IncomingMailController } from "./incoming-mail.controller";
import { DatabaseService } from "../database/database.service";
import { EmailService } from "../email/email.service";
import { AuditLogService } from "../audit/audit-log.service";
import { IndemnityTemplateService } from "./indemnity-template.service";
import { indemnityReplyToken } from "./indemnity-reply-token";

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
        table === "meetAttendees" ? jest.fn().mockReturnThis() : undefined,
      andWhere: jest.fn().mockReturnThis(),
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
    recordBounce: jest.fn(),
  } as unknown as EmailService;

  const auditLogService = {
    addRecord: jest.fn(),
  } as unknown as AuditLogService;
  const indemnityTemplates = {
    saveSignedAttendeePdf: jest.fn(),
  } as unknown as IndemnityTemplateService;

  const response = () =>
    ({
      status: jest.fn().mockReturnThis(),
    }) as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new IncomingMailController(
      db,
      emailService,
      auditLogService,
      indemnityTemplates,
    );
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

  it("records bounce notifications without looking up a meet", async () => {
    const res = response();
    const trackingToken = "a".repeat(48);
    const rawBounce =
      "Action: failed\r\nStatus: 5.1.1\r\nDiagnostic-Code: smtp; 550 user unknown";

    await expect(
      controller.handleIncoming(
        `bounce+${trackingToken}@adventuremeets.apps.fringecoding.com`,
        "MAILER-DAEMON@adventuremeets.apps.fringecoding.com",
        undefined as any,
        rawBounce,
        {} as Request,
        res,
      ),
    ).resolves.toEqual({ status: "bounce recorded" });

    expect(emailService.recordBounce).toHaveBeenCalledWith(
      trackingToken,
      rawBounce,
    );
    expect(db.getClient).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
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
      name: "Alex Rider",
      email: "sender@example.com",
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
      subject: "Message for meet: Sunrise Hike",
      text:
        "You received a message from Alex Rider about meet Sunrise Hike.\n\n" +
        "From: sender@example.com\n" +
        "Meet: Sunrise Hike\n" +
        "Original subject: Need to cancel\n\n" +
        "Please cancel my spot",
      replyTo: "sender@example.com",
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

  it("records an organiser reply to a copied attendee as outbound without forwarding it back", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
    });
    firstMocks.users.mockResolvedValue({ email: "ME@gmail.com" });
    firstMocks.meetAttendees.mockResolvedValue({ id: "attendee-2" });
    const raw = [
      "From: Me <me@gmail.com>",
      "To: meet+meet-1@adventuremeets.apps.fringecoding.com",
      "Cc: Penny <penny@gmail.com>",
      "Subject: Re: Sunrise Hike",
      "",
      "Thanks, Penny",
    ].join("\r\n");
    const res = response();

    await expect(
      controller.handleIncoming(
        "meet+meet-1@adventuremeets.apps.fringecoding.com",
        "me@gmail.com",
        undefined as any,
        raw,
        {} as Request,
        res,
      ),
    ).resolves.toEqual({ status: "ok" });

    expect(emailService.saveIncomingMessage).toHaveBeenCalledWith({
      meetId: "meet-1",
      attendeeId: "attendee-2",
      from: "me@gmail.com",
      to: "penny@gmail.com",
      rawContent: raw,
    });
    expect(emailService.sendEmail).not.toHaveBeenCalled();
    expect(auditLogService.addRecord).toHaveBeenCalledWith({
      orgId: "org-1",
      attendeeId: "attendee-2",
      meetId: "meet-1",
      description: "Outgoing mail for meet Sunrise Hike",
    });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
  });

  it("saves the readable text of an HTML-only organiser reply", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
    });
    firstMocks.users.mockResolvedValue({ email: "me@gmail.com" });
    firstMocks.meetAttendees.mockResolvedValue({ id: "attendee-2" });
    const raw = [
      "From: me@gmail.com",
      "To: meet+meet-1@adventuremeets.apps.fringecoding.com",
      "Cc: penny@gmail.com",
      "Subject: Re: Sunrise Hike",
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="Apple-Mail-ABC"',
      "",
      "--Apple-Mail-ABC",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: quoted-printable",
      "",
      "<div>It=E2=80=99s up to you.</div>",
      "--Apple-Mail-ABC--",
    ].join("\r\n");

    await controller.handleIncoming(
      "meet+meet-1@adventuremeets.apps.fringecoding.com",
      "me@gmail.com",
      undefined as any,
      raw,
      {} as Request,
      response(),
    );

    expect(emailService.saveIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeId: "attendee-2",
        rawContent: "Subject: Re: Sunrise Hike\n\nIt’s up to you.",
      }),
    );
  });

  it("records a group reply for each attendee in To and CC", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
    });
    firstMocks.users.mockResolvedValue({ email: "me@gmail.com" });
    firstMocks.meetAttendees
      .mockResolvedValueOnce({ id: "attendee-1" })
      .mockResolvedValueOnce({ id: "attendee-2" });
    const raw = [
      "From: me@gmail.com",
      "To: meet+meet-1@adventuremeets.apps.fringecoding.com, Alex <alex@example.com>",
      "Cc: Penny <penny@gmail.com>, me@gmail.com",
      "Subject: Update",
      "",
      "See you there",
    ].join("\r\n");

    await controller.handleIncoming(
      "meet+meet-1@adventuremeets.apps.fringecoding.com",
      "me@gmail.com",
      undefined as any,
      raw,
      {} as Request,
      response(),
    );

    expect(emailService.saveIncomingMessage).toHaveBeenCalledTimes(2);
    expect(emailService.saveIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeId: "attendee-1",
        to: "alex@example.com",
      }),
    );
    expect(emailService.saveIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeId: "attendee-2",
        to: "penny@gmail.com",
      }),
    );
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it("keeps the existing behaviour for an organiser replying only to the meet address", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
    });
    firstMocks.users.mockResolvedValue({ email: "me@gmail.com" });
    firstMocks.meetAttendees.mockResolvedValue(null);
    (emailService.parseMessageContent as jest.Mock).mockReturnValue({
      subject: "Test",
      pertinentBody: "Testing",
      body: "Testing",
    });
    const raw = [
      "From: me@gmail.com",
      "To: meet+meet-1+attendee-1+token@adventuremeets.apps.fringecoding.com",
      "Subject: Test",
      "",
      "Testing",
    ].join("\r\n");

    await controller.handleIncoming(
      "meet+meet-1+attendee-1+token@adventuremeets.apps.fringecoding.com",
      "me@gmail.com",
      undefined as any,
      raw,
      {} as Request,
      response(),
    );

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "me@gmail.com" }),
    );
    expect(emailService.saveIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({ attendeeId: null, from: "me@gmail.com" }),
    );
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
      text:
        "You received a message from unknown@example.com about meet Sunrise Hike.\n\n" +
        "From: unknown@example.com\n" +
        "Meet: Sunrise Hike\n" +
        "Original subject: No subject\n\n" +
        "Full parsed body",
      replyTo: "unknown@example.com",
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

  it("stores an attached PDF and marks the addressed attendee accepted", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
      indemnity_pdfs_id: "pdf-1",
    });
    firstMocks.users.mockResolvedValue({ email: "organizer@example.com" });
    firstMocks.meetAttendees.mockResolvedValue({
      id: "attendee-1",
      name: "Alex",
      email: "sender@example.com",
    });
    (emailService.parseMessageContent as jest.Mock).mockReturnValue({
      subject: "Signed form",
      pertinentBody: "Attached",
      body: "Attached",
    });
    const pdf = Buffer.from("%PDF-1.4\nreturned form");
    const raw = Buffer.from(
      [
        "Subject: Signed form",
        "MIME-Version: 1.0",
        'Content-Type: multipart/mixed; boundary="part"',
        "",
        "--part",
        "Content-Type: text/plain",
        "",
        "Attached",
        "--part",
        'Content-Type: application/pdf; name="signed.pdf"',
        'Content-Disposition: attachment; filename="signed.pdf"',
        "Content-Transfer-Encoding: base64",
        "",
        pdf.toString("base64"),
        "--part--",
      ].join("\r\n"),
    );
    await controller.handleIncoming(
      `meet+meet-1+attendee-1+${indemnityReplyToken("meet-1", "attendee-1")}@adventuremeets.apps.fringecoding.com`,
      "sender@example.com",
      undefined as any,
      raw,
      {} as Request,
      response(),
    );
    expect(indemnityTemplates.saveSignedAttendeePdf).toHaveBeenCalledWith(
      "meet-1",
      "attendee-1",
      { filename: "signed.pdf", content: pdf },
    );
  });

  it("does not accept a PDF sent to an address without a valid reply token", async () => {
    firstMocks.meets.mockResolvedValue({
      id: "meet-1",
      organization_id: "org-1",
      organizer_id: "user-1",
      name: "Sunrise Hike",
      indemnity_pdfs_id: "pdf-1",
    });
    firstMocks.users.mockResolvedValue({ email: "organizer@example.com" });
    firstMocks.meetAttendees.mockResolvedValue({
      id: "attendee-1",
      name: "Alex",
      email: "sender@example.com",
    });
    const raw = [
      "Subject: Signed form",
      'Content-Type: multipart/mixed; boundary="part"',
      "",
      "--part",
      "Content-Type: application/pdf",
      "Content-Disposition: attachment; filename=signed.pdf",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from("%PDF-1.4\nsigned").toString("base64"),
      "--part--",
    ].join("\r\n");
    await controller.handleIncoming(
      "meet+meet-1+attendee-1+invalid@adventuremeets.apps.fringecoding.com",
      "sender@example.com",
      undefined as any,
      raw,
      {} as Request,
      response(),
    );
    expect(indemnityTemplates.saveSignedAttendeePdf).not.toHaveBeenCalled();
    expect(emailService.sendEmail).toHaveBeenCalled();
  });
});
