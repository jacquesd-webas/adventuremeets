import Meet from "../../types/MeetModel";

type ShareChannel = "email" | "whatsapp";

export function meetShareImageUrl(meet: Meet): string | undefined {
  return (
    meet.imageUrl ||
    meet.images?.find((image) => image.isPrimary)?.url ||
    meet.images?.[0]?.url
  );
}

function startLabel(meet: Meet): string {
  if (!meet.startTime) return "TBC";
  const start = new Date(meet.startTime);
  if (Number.isNaN(start.getTime())) return "TBC";
  const date = start.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (meet.startTimeTbc) return date;
  const time = start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} at ${time}`;
}

function costLabel(meet: Meet): string | null {
  if (typeof meet.costCents !== "number" || meet.costCents <= 0) return null;
  const amount = (meet.costCents / 100).toFixed(2);
  return meet.currencySymbol
    ? `${meet.currencySymbol}${amount}`
    : `${meet.currency || ""} ${amount}`.trim();
}

export function meetShareMessage(
  meet: Meet,
  shareUrl: string,
  channel: ShareChannel,
  imageAttached = false,
  includeLink = true,
): string {
  const whatsapp = channel === "whatsapp";
  const lines: string[] = [];
  const imageUrl = meetShareImageUrl(meet);
  if (imageUrl && !imageAttached) lines.push(`Image: ${imageUrl}`, "");
  lines.push(whatsapp ? `*${meet.name}*` : meet.name);
  lines.push(`${whatsapp ? "📅 " : "Starts: "}${startLabel(meet)}`);
  if (meet.location?.trim())
    lines.push(`${whatsapp ? "📍 " : "Location: "}${meet.location.trim()}`);
  const cost = costLabel(meet);
  if (cost) lines.push(`${whatsapp ? "💰 " : "Cost: "}${cost}`);
  const organiser =
    meet.organizerName?.trim() ||
    [meet.organizerFirstName, meet.organizerLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
  if (organiser) lines.push(`${whatsapp ? "👤 " : "Organiser: "}${organiser}`);

  const details = lines.join("\n");
  const footer = includeLink ? `\n\nView the meet: ${shareUrl}` : "";
  const description = meet.description?.trim();
  if (!description) return `${details}${footer}`;

  const prefix = `${details}\n\n`;
  const available = whatsapp
    ? Math.max(0, 3000 - prefix.length - footer.length)
    : description.length;
  return `${prefix}${description.slice(0, available)}${footer}`;
}
