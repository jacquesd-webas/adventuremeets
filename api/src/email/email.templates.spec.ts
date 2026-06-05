import { renderEmailTemplate } from "./email.templates";

describe("renderEmailTemplate", () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  beforeEach(() => {
    process.env.FRONTEND_URL = "https://app.example.com";
  });

  afterAll(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
  });

  it("renders meet signup text and html with conditional status and escaped html fields", () => {
    const result = renderEmailTemplate("meet-signup", {
      meetName: 'River <Escape> & "Climb"',
      attendeeName: "Alex & Sam <Leader>",
      statusUrl: "https://app.example.com/meets/share-123/attendee-1",
      organizerName: "Taylor <Org>",
      organizerEmail: "taylor@example.com",
    });

    expect(result.subject).toBe('You signed up for River <Escape> & "Climb"');
    expect(result.text).toContain("Hi Alex & Sam <Leader>,");
    expect(result.text).toContain(
      'You have applied for River <Escape> & "Climb".',
    );
    expect(result.text).toContain(
      "View your application status:\nhttps://app.example.com/meets/share-123/attendee-1",
    );
    expect(result.text).toContain(
      "Questions? Contact Taylor <Org> at taylor@example.com.",
    );

    expect(result.html).toContain(
      '<img src="https://app.example.com/static/adventuremeets-logo.png"',
    );
    expect(result.html).toContain("Alex &amp; Sam &lt;Leader&gt;");
    expect(result.html).toContain(
      "River &lt;Escape&gt; &amp; &quot;Climb&quot;",
    );
    expect(result.html).toContain("Taylor &lt;Org&gt;");
    expect(result.html).toContain(
      'href="https://app.example.com/meets/share-123/attendee-1"',
    );
  });

  it("renders the default meet confirmation message with formatted start time", () => {
    const result = renderEmailTemplate("meet-confirm", {
      meetName: "Sunrise Hike",
      attendeeName: "Riley",
      startTime: "2026-10-14T06:00:00.000Z",
      timeZone: "Africa/Johannesburg",
      location: "Lion's Head",
      statusUrl: "https://app.example.com/meets/share-123/attendee-1",
      organizerName: "Taylor",
      organizerEmail: "taylor@example.com",
    });

    expect(result.subject).toBe("You're confirmed for Sunrise Hike");
    expect(result.text).toContain(
      "You're confirmed for Sunrise Hike on Wednesday, 14 October 08:00 at Lion's Head.",
    );
    expect(result.text).toContain("View your application status:");
    expect(result.html).toContain(
      "You&#39;re confirmed for Sunrise Hike on Wednesday, 14 October 08:00 at Lion&#39;s Head.",
    );
    expect(result.html).toContain(">View your application<");
  });

  it("renders meet messages without the status section when includeStatusUrl is false and escapes html content", () => {
    const result = renderEmailTemplate("meet-message", {
      meetName: "Night Trail",
      attendeeName: "Morgan",
      includeStatusUrl: false,
      statusUrl: "https://app.example.com/meets/share-123/attendee-1",
      organizerName: "Robin & Co",
      organizerEmail: "robin@example.com",
      messageBody: "Please bring <headlamp>\nReply if needed.",
    });

    expect(result.subject).toBe("Message about Night Trail");
    expect(result.text).toContain(
      "Please bring &lt;headlamp&gt;\nReply if needed.",
    );
    expect(result.text).not.toContain("View your application status:");
    expect(result.html).toContain(
      "Please bring &lt;headlamp&gt;<br/>Reply if needed.",
    );
    expect(result.html).not.toContain("View your application");
    expect(result.text).toContain(
      "If you need to reply, contact Robin &amp; Co at robin@example.com.",
    );
    expect(result.html).toContain(
      "If you need to reply, contact Robin &amp; Co at",
    );
  });

  it("renders grouped meet messages with the organiser-direct reply wording", () => {
    const result = renderEmailTemplate("meet-message", {
      meetName: "Night Trail",
      attendeeName: "everyone",
      includeStatusUrl: false,
      isGroupedMessage: true,
      organizerName: "Robin & Co",
      organizerEmail: "robin@example.com",
      messageBody: "Please bring <headlamp>\nReply if needed.",
    });

    expect(result.text).toContain(
      "If you need to reach the organiser directly, you may reply to robin@example.com.",
    );
    expect(result.html).toContain(
      "If you need to reach the organiser directly, you may reply to",
    );
    expect(result.html).not.toContain("contact Robin &amp; Co at");
  });

  it("linkifies urls, email addresses and phone numbers inside the html message body", () => {
    const result = renderEmailTemplate("meet-message", {
      meetName: "Night Trail",
      attendeeName: "Morgan",
      includeStatusUrl: false,
      organizerName: "Robin",
      organizerEmail: "robin@example.com",
      messageBody:
        "See https://example.com/info or www.example.org.\nEmail hello@example.com or call +27 82 123 4567.",
    });

    expect(result.text).toContain(
      "See https://example.com/info or www.example.org.",
    );
    expect(result.text).toContain(
      "Email hello@example.com or call +27 82 123 4567.",
    );
    expect(result.html).toContain(
      '<a href="https://example.com/info">https://example.com/info</a>',
    );
    expect(result.html).toContain(
      '<a href="https://www.example.org.">www.example.org.</a>',
    );
    expect(result.html).toContain(
      '<a href="mailto:hello@example.com">hello@example.com</a>',
    );
    expect(result.html).toContain(
      '<a href="tel:+27821234567">+27 82 123 4567</a>',
    );
    expect(result.html).toContain("<br/>Email ");
  });

  it("renders organization invites with a formatted expiry date", () => {
    const result = renderEmailTemplate("organization-invite", {
      organizationName: 'Mountain & "Sea"',
      registerUrl: "https://app.example.com/register/invite-1",
      expiresAt: "2026-10-14T08:00:00.000Z",
    });

    expect(result.subject).toBe('You\'re invited to join Mountain & "Sea"');
    expect(result.text).toContain(
      "You have been invited to join Mountain &amp; &quot;Sea&quot; on AdventureMeets.",
    );
    expect(result.text).toContain(
      "This invite expires on Wednesday, 14 October 08:00.",
    );
    expect(result.html).toContain("Mountain &amp; &quot;Sea&quot;");
    expect(result.html).toContain(
      "This invite expires on Wednesday, 14 October 08:00.",
    );
    expect(result.html).toContain(
      'href="https://app.example.com/register/invite-1"',
    );
  });
});
