import { EmailMessagesRepository } from "./email-messages.repository";
import { DatabaseService } from "../database/database.service";

const createEmailService = (db: DatabaseService) =>
  new EmailService(db, new EmailMessagesRepository(db));
import { EmailService } from "./email.service";

describe("EmailService.parseMessageContent", () => {
  const service = createEmailService({} as any);

  it("strips quoted replies and signatures", () => {
    const raw =
      "Subject: Greetings\r\n\r\n" +
      "Hello team,\r\n\r\n" +
      "Thanks,\r\n" +
      "Alex\r\n\r\n" +
      "On Tue, Jan 1, 2025 at 10:00 AM John <john@example.com> wrote:\r\n" +
      "> previous line\r\n" +
      "> another line\r\n\r\n" +
      "-- \r\n" +
      "Signature block";

    const parsed = service.parseMessageContent(raw);

    expect(parsed.subject).toBe("Greetings");
    expect(parsed.pertinentBody).toBe("Hello team,\n\nThanks,\nAlex");
    expect(parsed.body).toContain("On Tue, Jan 1, 2025");
  });

  it("extracts and decodes the plain-text part from multipart quoted-printable emails", () => {
    const raw =
      "Subject: Re: Test\r\n" +
      'Content-Type: multipart/alternative; boundary="Apple-Mail=_19E10742-C83D-429C-8710-EAF852B8D951"\r\n' +
      "\r\n" +
      "--Apple-Mail=_19E10742-C83D-429C-8710-EAF852B8D951\r\n" +
      "Content-Transfer-Encoding: quoted-printable\r\n" +
      "Content-Type: text/plain;\r\n" +
      "charset=utf-8\r\n" +
      "\r\n" +
      "This is a test reply\r\n" +
      "--Apple-Mail=_19E10742-C83D-429C-8710-EAF852B8D951--";

    const parsed = service.parseMessageContent(raw);

    expect(parsed.subject).toBe("Re: Test");
    expect(parsed.body).toBe("This is a test reply");
    expect(parsed.pertinentBody).toBe("This is a test reply");
  });

  it("decodes emoji in MIME-encoded subjects and quoted-printable bodies", () => {
    const raw =
      "Subject: =?UTF-8?Q?Test_=F0=9F=98=80?=\r\n" +
      'Content-Type: multipart/alternative; boundary="emoji-boundary"\r\n' +
      "\r\n" +
      "--emoji-boundary\r\n" +
      "Content-Transfer-Encoding: quoted-printable\r\n" +
      "Content-Type: text/plain;\r\n" +
      "charset=utf-8\r\n" +
      "\r\n" +
      "Hello =F0=9F=98=80\r\n" +
      "--emoji-boundary--";

    const parsed = service.parseMessageContent(raw);

    expect(parsed.subject).toBe("Test 😀");
    expect(parsed.body).toBe("Hello 😀");
    expect(parsed.pertinentBody).toBe("Hello 😀");
  });
});

describe("EmailService.saveMessage", () => {
  it("prefers text over html when saving message content", async () => {
    const messageContentsInsert = {
      insert: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      merge: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: "content-1" }]),
    };
    const messagesInsert = {
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ message_id: "message-1" }]),
    };

    const client: any = (table: string) => {
      if (table === "message_contents") return messageContentsInsert;
      if (table === "messages") return messagesInsert;
      throw new Error(`Unexpected table ${table}`);
    };

    const service = createEmailService({
      getClient: () => client,
    } as any);

    await service.saveMessage({
      to: "alex@example.com",
      subject: "You're confirmed",
      text: "Plain text confirmation body",
      html: "<p>HTML confirmation body</p>",
      meetId: "meet-1",
      attendeeId: "attendee-1",
    });

    expect(messageContentsInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Subject: You're confirmed\n\nPlain text confirmation body",
      }),
    );
    expect(messagesInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        meet_id: "meet-1",
        attendee_id: "attendee-1",
      }),
    );
  });

  it("stores grouped recipient lists as a comma-separated string", async () => {
    const messageContentsInsert = {
      insert: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      merge: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: "content-1" }]),
    };
    const messagesInsert = {
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ message_id: "message-1" }]),
    };

    const client: any = (table: string) => {
      if (table === "message_contents") return messageContentsInsert;
      if (table === "messages") return messagesInsert;
      throw new Error(`Unexpected table ${table}`);
    };

    const service = createEmailService({
      getClient: () => client,
    } as any);

    await service.saveMessage({
      to: ["alex@example.com", "jamie@example.com"],
      subject: "Group message",
      text: "Hello everyone",
      meetId: "meet-1",
      attendeeId: "attendee-1",
    });

    expect(messagesInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alex@example.com, jamie@example.com",
      }),
    );
  });
});

describe("EmailService.sendEmail", () => {
  it("succeeds only when SMTP accepts every intended recipient", async () => {
    const expectedMailDomain =
      process.env.MAIL_DOMAIN || "adventuremeets.apps.fringecoding.com";
    const outboundEmailsInsert = {
      returning: jest.fn().mockResolvedValue([
        {
          id: "outbound-1",
          recipient_email: "alex@example.com",
          tracking_token: "a".repeat(48),
        },
      ]),
    };
    const outboundEmailsQuery = {
      insert: jest.fn().mockReturnValue(outboundEmailsInsert),
      whereIn: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
    };
    const service = createEmailService({
      getClient: () => (table: string) => {
        expect(table).toBe("outbound_emails");
        return outboundEmailsQuery;
      },
    } as any);
    const sendMail = jest.fn().mockResolvedValue({
      accepted: ["alex@example.com"],
      rejected: [],
      messageId: "smtp-1",
    });

    (service as any).transporter = { sendMail };

    await expect(
      service.sendEmail({
        to: "alex@example.com",
        subject: "Subject",
        text: "Body",
        html: "<html><body><p>Body</p></body></html>",
      }),
    ).resolves.toBeUndefined();

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alex@example.com",
        subject: "Subject",
        text: "Body",
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("/api/v1/email/open/" + "a".repeat(48)),
        envelope: {
          from: "bounce+" + "a".repeat(48) + `@${expectedMailDomain}`,
          to: "alex@example.com",
        },
      }),
    );
    expect(outboundEmailsQuery.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        recipient_email: "alex@example.com",
        tracking_token: expect.stringMatching(/^[a-f0-9]{48}$/),
      }),
    ]);
    const envelopeFrom = sendMail.mock.calls[0][0].envelope.from;
    expect(Buffer.byteLength(envelopeFrom.split("@")[0])).toBeLessThanOrEqual(
      64,
    );
    expect(outboundEmailsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "sent",
        transport_message_id: "smtp-1",
      }),
    );
  });

  it("throws when SMTP does not accept the intended recipient", async () => {
    const outboundEmailsInsert = {
      returning: jest
        .fn()
        .mockResolvedValue([
          { id: "outbound-1", recipient_email: "alex@example.com" },
        ]),
    };
    const outboundEmailsQuery = {
      insert: jest.fn().mockReturnValue(outboundEmailsInsert),
      whereIn: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
    };
    const service = createEmailService({
      getClient: () => (table: string) => {
        expect(table).toBe("outbound_emails");
        return outboundEmailsQuery;
      },
    } as any);
    const sendMail = jest.fn().mockResolvedValue({
      accepted: [],
      rejected: ["alex@example.com"],
    });

    (service as any).transporter = { sendMail };

    await expect(
      service.sendEmail({
        to: "alex@example.com",
        subject: "Subject",
        text: "Body",
      }),
    ).rejects.toThrow("SMTP did not accept recipient(s): alex@example.com");

    expect(outboundEmailsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        failure_reason: "SMTP did not accept recipient(s): alex@example.com",
      }),
    );
  });

  it("marks a sent email as opened once", async () => {
    const outboundEmailsQuery = {
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
    };
    const service = createEmailService({
      getClient: () => () => outboundEmailsQuery,
    } as any);

    await service.recordOpened("a".repeat(48));

    expect(outboundEmailsQuery.where).toHaveBeenCalledWith({
      tracking_token: "a".repeat(48),
    });
    expect(outboundEmailsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "opened" }),
    );
  });

  it("marks an email as bounced using DSN details", async () => {
    const outboundEmailsQuery = {
      where: jest.fn().mockReturnThis(),
      whereNot: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([
        {
          organization_id: "org-1",
          meet_id: "meet-1",
          recipient_email: "attendee@example.com",
          subject: "Meet confirmation",
          failure_reason:
            "action: failed; status: 5.1.1; diagnostic: smtp; 550 user unknown",
        },
      ]),
    };
    const organizerQuery = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ email: "organizer@example.com" }),
    };
    const service = createEmailService({
      getClient: () => (table: string) =>
        table === "outbound_emails" ? outboundEmailsQuery : organizerQuery,
    } as any);
    jest.spyOn(service, "sendEmail").mockResolvedValue(undefined);

    await service.recordBounce(
      "a".repeat(48),
      "Action: failed\r\nStatus: 5.1.1\r\nDiagnostic-Code: smtp; 550 user unknown",
    );

    expect(outboundEmailsQuery.where).toHaveBeenCalledWith({
      tracking_token: "a".repeat(48),
    });
    expect(outboundEmailsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "bounced",
        bounce_type: "hard",
        failure_reason:
          "action: failed; status: 5.1.1; diagnostic: smtp; 550 user unknown",
      }),
    );
    expect(service.sendEmail).toHaveBeenCalledWith({
      to: "organizer@example.com",
      subject: "Email bounced: Meet confirmation",
      text: [
        "An email to attendee@example.com bounced.",
        "Subject: Meet confirmation",
        "Reason: action: failed; status: 5.1.1; diagnostic: smtp; 550 user unknown",
      ].join("\n"),
      organizationId: "org-1",
      meetId: "meet-1",
    });
  });

  it("does not notify when the organizer address bounces", async () => {
    const outboundEmailsQuery = {
      where: jest.fn().mockReturnThis(),
      whereNot: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([
        {
          organization_id: "org-1",
          meet_id: "meet-1",
          recipient_email: "organizer@example.com",
          subject: "Meet reminder",
          failure_reason: "Bounce notification received",
        },
      ]),
    };
    const organizerQuery = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ email: "organizer@example.com" }),
    };
    const service = createEmailService({
      getClient: () => (table: string) =>
        table === "outbound_emails" ? outboundEmailsQuery : organizerQuery,
    } as any);
    jest.spyOn(service, "sendEmail").mockResolvedValue(undefined);

    await service.recordBounce("a".repeat(48), "Action: failed");

    expect(service.sendEmail).not.toHaveBeenCalled();
  });
});

describe("EmailService message status association", () => {
  it("links saved messages before a failed SMTP send", async () => {
    const query = {
      insert: jest.fn().mockReturnThis(),
      returning: jest
        .fn()
        .mockResolvedValue([
          {
            id: "outbound-1",
            recipient_email: "alex@example.com",
            tracking_token: "a".repeat(48),
          },
        ]),
      whereIn: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
    };
    const repository = {
      linkOutboundEmails: jest.fn().mockResolvedValue(undefined),
    };
    const service = new EmailService(
      { getClient: () => () => query } as unknown as DatabaseService,
      repository as unknown as EmailMessagesRepository,
    );
    const sendMail = jest.fn().mockImplementation(async () => {
      expect(repository.linkOutboundEmails).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "outbound-1" })]),
        [{ messageId: "message-1", recipient: "alex@example.com" }],
      );
      throw new Error("SMTP rejected");
    });
    (service as any).transporter = { sendMail };
    await expect(
      service.sendEmail({
        to: "alex@example.com",
        subject: "Test",
        text: "Body",
        messageReferences: [
          { messageId: "message-1", recipient: "alex@example.com" },
        ],
      }),
    ).rejects.toThrow("SMTP rejected");
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" }),
    );
  });
});
