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
  meetStartTime?: string | null;
  meetTimeZone?: string | null;
}) {
  const {
    req,
    code,
    frontendUrl,
    meetName,
    meetDescription,
    meetImageUrl,
    meetStartTime,
    meetTimeZone,
  } = options;

  const queryString = req.originalUrl.includes("?")
    ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
    : "";
  const searchParams = new URLSearchParams(queryString);
  const omitDescription = searchParams.get("nodesc") === "1";
  const redirectSearchParams = new URLSearchParams(searchParams);
  redirectSearchParams.delete("nodesc");
  const redirectQueryString = redirectSearchParams.toString();
  const redirectUrl = `${frontendUrl}/meets/${code}${
    redirectQueryString ? `?${redirectQueryString}` : ""
  }`;

  const title = (meetName || "AdventureMeets").trim();
  const baseDescription =
    (meetDescription || "Join this meet on AdventureMeets.").trim() ||
    "Join this meet on AdventureMeets.";
  const description = buildOgDescription(
    baseDescription,
    meetStartTime,
    meetTimeZone,
    omitDescription,
  );

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

function buildOgDescription(
  description: string,
  startTime?: string | null,
  timeZone?: string | null,
  omitDescription = false,
) {
  const dateLine = formatOgDateLine(startTime, timeZone);
  if (omitDescription) {
    return dateLine || "";
  }
  if (!dateLine) {
    return description;
  }
  return `${dateLine}\n${description}`;
}

function formatOgDateLine(startTime?: string | null, timeZone?: string | null) {
  if (!startTime) return null;

  const parsedDate = new Date(startTime);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  }).format(parsedDate);
}
