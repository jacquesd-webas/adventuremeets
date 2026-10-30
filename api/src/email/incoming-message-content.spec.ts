import { normalizeIncomingMessageContent } from "./incoming-message-content";

describe("normalizeIncomingMessageContent", () => {
  const htmlPart = [
    "--Apple-Mail-ABC",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    "<div>It=E2=80=99s up to you - the crocs are fine.</div><blockquote>On 23 Oct, Penny wrote: quoted reply</blockquote>",
    "--Apple-Mail-ABC--",
  ].join("\r\n");

  it("decodes an HTML-only reply before it is saved", async () => {
    const raw = [
      "From: organiser@example.com",
      "To: meet+meet-1@example.com",
      "Cc: penny@example.com",
      "Subject: Re: Tin Mine",
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="Apple-Mail-ABC"',
      "",
      htmlPart,
    ].join("\r\n");

    await expect(normalizeIncomingMessageContent(raw)).resolves.toBe(
      "Subject: Re: Tin Mine\n\nIt’s up to you - the crocs are fine.",
    );
  });

  it("decodes an already stored MIME body that lacks its outer headers", async () => {
    const stored = `Subject: Re: Tin Mine\n\n${htmlPart}`;

    await expect(normalizeIncomingMessageContent(stored)).resolves.toBe(
      "Subject: Re: Tin Mine\n\nIt’s up to you - the crocs are fine.",
    );
  });

  it("leaves ordinary text messages unchanged", async () => {
    const content = "Subject: Update\n\nSee you there";
    await expect(normalizeIncomingMessageContent(content)).resolves.toBe(
      content,
    );
  });
});
