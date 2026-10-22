import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFFont,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
  PDFTextField,
  StandardFonts,
} from "pdf-lib";
import {
  isPdfSignatureDateField,
  matchPdfAutoField,
  PdfAutoFieldSource,
} from "./indemnity-pdf-field-mappings";

export type IndemnityPdfContext = {
  meet: {
    name?: string;
    startTime?: string;
    endTime?: string;
    timeZone?: string;
    location?: string;
    organizationName?: string;
  };
  attendee: { name?: string; guardianName?: string; isMinor?: boolean };
  answers: Record<string, string>;
};

const FILLED_FONT_SIZE = 9;

function setTextAppearance(
  field: PDFTextField | PDFDropdown | PDFOptionList,
  font: PDFFont,
) {
  const appearance = `0 g /${font.name} ${FILLED_FONT_SIZE} Tf`;
  field.acroField.setDefaultAppearance(appearance);
  for (const widget of field.acroField.getWidgets()) {
    widget.setDefaultAppearance(appearance);
  }
  field.defaultUpdateAppearances(font);
}

function formatMeetDate(
  value: string | undefined,
  timeZone: string | undefined,
  fieldName: string,
  maxLength?: number,
): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const isTimeField = /time/i.test(fieldName);
  const options: Intl.DateTimeFormatOptions = isTimeField
    ? {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: timeZone || "UTC",
      }
    : {
        day: "2-digit",
        month: "2-digit",
        year: maxLength === 8 ? "2-digit" : "numeric",
        timeZone: timeZone || "UTC",
      };
  return new Intl.DateTimeFormat("en-GB", options).format(date);
}

function autoValue(
  source: PdfAutoFieldSource,
  fieldName: string,
  context: IndemnityPdfContext,
  maxLength?: number,
): string {
  const { meet, attendee } = context;
  switch (source) {
    case "meetName":
      return meet.name || "";
    case "meetStartTime":
      return formatMeetDate(
        meet.startTime,
        meet.timeZone,
        fieldName,
        maxLength,
      );
    case "meetEndTime":
      return formatMeetDate(meet.endTime, meet.timeZone, fieldName, maxLength);
    case "meetLocation":
      return meet.location || "";
    case "organizationName":
      return meet.organizationName || "";
    case "attendeeName":
      return attendee.isMinor ? attendee.name || "" : "";
    case "guardianName":
      return attendee.isMinor ? attendee.guardianName || "" : "";
    case "signatoryName":
      return attendee.isMinor
        ? attendee.guardianName || ""
        : attendee.name || "";
  }
}

export async function fillIndemnityPdf(
  template: Buffer,
  context: IndemnityPdfContext,
): Promise<Buffer> {
  const pdf = await PDFDocument.load(template, { updateMetadata: false });
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fields = form.getFields();
  const fieldNames = fields.map((field) => field.getName());
  for (const field of fields) {
    if (field instanceof PDFSignature) continue;
    const name = field.getName();
    if (field instanceof PDFTextField && isPdfSignatureDateField(name)) {
      field.setText("");
      setTextAppearance(field, font);
      continue;
    }
    const source =
      field instanceof PDFTextField
        ? matchPdfAutoField(name, fieldNames)
        : null;
    const value = source
      ? autoValue(
          source,
          name,
          context,
          field instanceof PDFTextField ? field.getMaxLength() : undefined,
        )
      : context.answers[name] || "";
    if (field instanceof PDFTextField) {
      if (field.getMaxLength() && value.length > field.getMaxLength()!)
        field.removeMaxLength();
      field.setText(value);
      setTextAppearance(field, font);
    } else if (field instanceof PDFCheckBox) {
      if (value === "true") field.check();
      else field.uncheck();
    } else if (field instanceof PDFRadioGroup || field instanceof PDFDropdown) {
      field.clear();
      if (value && field.getOptions().includes(value)) field.select(value);
      if (field instanceof PDFDropdown) setTextAppearance(field, font);
    } else if (field instanceof PDFOptionList) {
      field.clear();
      if (value && field.getOptions().includes(value)) field.select(value);
      setTextAppearance(field, font);
    }
  }
  return Buffer.from(await pdf.save());
}
