import { simpleParser } from "mailparser";

/** Convert HTML-only MIME mail to the plain-text format used by attendee history. */
export async function normalizeIncomingMessageContent(content: string) {
  if (!/^Content-Type:\s*text\/html\b/im.test(content)) return content;

  const normalized = content.replace(/\r\n/g, "\n");
  const separator = normalized.indexOf("\n\n");
  const headers = separator === -1 ? "" : normalized.slice(0, separator);
  const body = separator === -1 ? normalized : normalized.slice(separator + 2);
  const firstBodyLine = body.split("\n", 1)[0]?.trim() || "";
  const boundary =
    firstBodyLine.startsWith("--") && !firstBodyLine.endsWith("--")
      ? firstBodyLine.slice(2)
      : null;
  const parseInput =
    boundary && !/^Content-Type:\s*multipart\//im.test(headers)
      ? `${headers}\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary="${boundary}"\n\n${body}`
      : normalized;

  try {
    const parsed = await simpleParser(parseInput, {
      maxHtmlLengthToParse: 1_000_000,
    });
    let text = parsed.text?.trim();
    if (!text && typeof parsed.html === "string") {
      // Some multipart/alternative messages contain only HTML. Mailparser
      // converts a standalone HTML part to text even in that case.
      const converted = await simpleParser(
        `Content-Type: text/html; charset=utf-8\n\n${parsed.html}`,
        { maxHtmlLengthToParse: 1_000_000 },
      );
      text = converted.text?.trim();
    }
    if (!text) return content;
    const lines = text.split("\n");
    const quoteIndex = lines.findIndex((line) =>
      /^(>|On .+ wrote:$)/i.test(line.trim()),
    );
    if (quoteIndex > 0) {
      text = lines.slice(0, quoteIndex).join("\n").trim();
    }
    return `Subject: ${parsed.subject || "No subject"}\n\n${text}`;
  } catch {
    return content;
  }
}
