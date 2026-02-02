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
});
