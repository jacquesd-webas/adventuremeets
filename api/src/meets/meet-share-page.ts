import type { Request } from "express";

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildMeetSharePageHtml(options: {
  req: Request;
  code: string;
  frontendUrl: string;
  meetName?: string | null;
  meetDescription?: string | null;
  meetImageUrl?: string | null;
}) {
  const { req, code, frontendUrl, meetName, meetDescription, meetImageUrl } =
    options;

  const queryString = req.originalUrl.includes("?")
    ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
    : "";
  const redirectUrl = `${frontendUrl}/meets/${code}${queryString}`;

  const title = (meetName || "AdventureMeets").trim();
  const description =
    (meetDescription || "Join this meet on AdventureMeets.").trim() ||
    "Join this meet on AdventureMeets.";

  const ogImage = (() => {
    const raw = meetImageUrl || "/static/adventuremeets-logo.png";
    try {
      return new URL(raw, frontendUrl).toString();
    } catch {
      return `${frontendUrl}/static/adventuremeets-logo.png`;
    }
  })();

  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) || req.protocol;
  const host =
    (req.headers["x-forwarded-host"] as string | undefined) ||
    req.get("host") ||
    "";
  const pageUrl = host ? `${proto}://${host}${req.originalUrl}` : redirectUrl;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:type" content="website" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectUrl)}" />
  </head>
  <body>
    <noscript>
      <p><a href="${escapeHtml(redirectUrl)}">Continue to meet signup</a></p>
    </noscript>
    <script>
      window.location.replace(${JSON.stringify(redirectUrl)});
    </script>
  </body>
</html>`;

  return { html, redirectUrl, pageUrl };
}

