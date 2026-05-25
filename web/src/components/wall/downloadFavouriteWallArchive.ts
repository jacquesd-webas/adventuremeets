import JSZip from "jszip";
import { WallItem } from "../../types/WallItemModel";

function sanitizeFileSegment(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/, "");
}

function toSafeMeetName(meetName?: string) {
  const cleaned = sanitizeFileSegment(meetName || "meet-favourites");
  return cleaned || "meet-favourites";
}

function imageExtension(item: WallItem, fallbackIndex: number) {
  const fromType = item.contentType?.startsWith("image/")
    ? item.contentType.slice("image/".length)
    : "";
  if (fromType) {
    return fromType;
  }

  const fromUrl = item.url?.split("?")[0]?.split(".").pop();
  if (fromUrl) {
    return fromUrl;
  }

  return fallbackIndex === 0 ? "jpg" : "jpeg";
}

function buildReportText(
  meetName: string,
  favouritePost: WallItem | null,
  favouritePhotos: WallItem[],
) {
  const lines: string[] = [
    `Meet: ${meetName}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "Favourite post:",
  ];

  if (favouritePost) {
    lines.push(`Author: ${favouritePost.authorName || "Unknown"}`);
    lines.push(`Created: ${favouritePost.createdAt || "Unknown"}`);
    lines.push(`Favourite rank: ${favouritePost.favourite}`);
    if (favouritePost.stars != null) {
      lines.push(`Stars: ${favouritePost.stars}`);
    }
    lines.push("");
    lines.push("Comment:");
    lines.push(favouritePost.comment || "(No comment)");
  } else {
    lines.push("None");
  }

  lines.push("");
  lines.push("Favourite photos:");

  if (!favouritePhotos.length) {
    lines.push("None");
  } else {
    favouritePhotos.forEach((photo, index) => {
      lines.push(
        `${index + 1}. ${photo.authorName || "Unknown"} | ${
          photo.createdAt || "Unknown"
        } | favourite ${photo.favourite}`,
      );
    });
  }

  return lines.join("\n");
}

export async function downloadFavouriteWallArchive({
  meetName,
  favouritePost,
  favouritePhotos,
}: {
  meetName?: string;
  favouritePost: WallItem | null;
  favouritePhotos: WallItem[];
}) {
  const zip = new JSZip();
  const safeMeetName = toSafeMeetName(meetName);
  const report = buildReportText(safeMeetName, favouritePost, favouritePhotos);

  zip.file("report.txt", report);

  if (favouritePhotos.length) {
    const photosFolder = zip.folder("photos");
    if (!photosFolder) {
      throw new Error("Unable to create zip folder");
    }

    await Promise.all(
      favouritePhotos.map(async (photo, index) => {
        if (!photo.url) {
          return;
        }

        const response = await fetch(photo.url);
        if (!response.ok) {
          throw new Error(`Failed to download favourite photo ${index + 1}`);
        }

        const blob = await response.blob();
        const fileName = `${String(index + 1).padStart(2, "0")}-${sanitizeFileSegment(
          photo.authorName || "photo",
        )}.${imageExtension(photo, index)}`;

        photosFolder.file(fileName, blob);
      }),
    );
  }

  const archiveBlob = await zip.generateAsync({ type: "blob" });
  const archiveUrl = window.URL.createObjectURL(archiveBlob);
  const link = document.createElement("a");
  link.href = archiveUrl;
  link.download = `${safeMeetName}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(archiveUrl);
}
