export const PDF_AUTO_FIELD_ALIASES = {
  meetName: ["CampActivity", "Camp / Activity", "Camp/Activity"],
  meetStartTime: [
    "Start Date",
    "Start Time",
    "Event Start Date",
    "Meet Start Date",
  ],
  meetEndTime: ["End Date", "End Time", "Event End Date", "Meet End Date"],
  meetLocation: [
    "LocationVenue",
    "Location",
    "Venue",
    "Event Location",
    "Meet Location",
  ],
  organizationName: [
    "Scout group",
    "Scout troop",
    "Scout troop / group",
    "Scout troop/group",
  ],
  attendeeName: [
    "Child full name",
    "Child full name2",
    "Child's full name",
    "Child's name",
    "Child Name",
  ],
  // Only the first parent is available as guardian_name. A second parent remains a question.
  guardianName: [
    "Parent full name",
    "Parent name",
    "Parent1 name",
    "Parent 1 name",
    "Parent or Guardian Name",
    "Guardian Name",
  ],
} as const;

export type PdfAutoFieldSource = keyof typeof PDF_AUTO_FIELD_ALIASES;
export type PdfAutoField = { pdfFieldName: string; source: PdfAutoFieldSource };

const normalizeFieldName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

export function matchPdfAutoField(
  pdfFieldName: string,
): PdfAutoFieldSource | null {
  const normalized = normalizeFieldName(pdfFieldName);
  for (const [source, aliases] of Object.entries(PDF_AUTO_FIELD_ALIASES)) {
    if (aliases.some((alias) => normalizeFieldName(alias) === normalized)) {
      return source as PdfAutoFieldSource;
    }
  }
  return null;
}
