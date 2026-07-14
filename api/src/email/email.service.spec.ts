import { EmailService } from "./email.service";

describe("EmailService.parseMessageContent", () => {
  const service = new EmailService({} as any);

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
      insert: jest.fn().mockResolvedValue([{ id: "message-1" }]),
    };

    const client: any = (table: string) => {
      if (table === "message_contents") return messageContentsInsert;
      if (table === "messages") return messagesInsert;
      throw new Error(`Unexpected table ${table}`);
    };

    const service = new EmailService({
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
      insert: jest.fn().mockResolvedValue([{ id: "message-1" }]),
    };

    const client: any = (table: string) => {
      if (table === "message_contents") return messageContentsInsert;
      if (table === "messages") return messagesInsert;
      throw new Error(`Unexpected table ${table}`);
    };

    const service = new EmailService({
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
    const service = new EmailService({} as any);
    const sendMail = jest.fn().mockResolvedValue({
      accepted: ["alex@example.com"],
      rejected: [],
    });

    (service as any).transporter = { sendMail };

    await expect(
      service.sendEmail({
        to: "alex@example.com",
        subject: "Subject",
        text: "Body",
      }),
    ).resolves.toBeUndefined();

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alex@example.com",
        subject: "Subject",
        text: "Body",
      }),
    );
  });

  it("throws when SMTP does not accept the intended recipient", async () => {
    const service = new EmailService({} as any);
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
  });
});
