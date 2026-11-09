import {
  type AttendeeColumnAssignment,
  type AttendeeUploadPreview,
  appendToAttendeeName,
  createMappedAttendeeWorkbook,
} from "../manageAttendeesModal/attendeeUploadWorkbook";

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function readMeetReportHeadings(preview: AttendeeUploadPreview) {
  const worksheet = preview.workbook.Sheets[preview.worksheetName];
  const headings: { name?: string; date?: string; organiser?: string } = {};

  for (let row = 0; row < preview.headerRowIndex; row += 1) {
    const cell = worksheet[`A${row + 1}`];
    const text = typeof cell?.v === "string" ? cell.v.trim() : "";
    const name = text.match(/^Meet:\s*(.+)$/i)?.[1]?.trim();
    if (name) headings.name = name;
    const organiser = text.match(/^Organiser:\s*(.+)$/i)?.[1]?.trim();
    if (organiser && organiser.toLowerCase() !== "tbc") {
      headings.organiser = organiser;
    }

    const dateText = text.match(/^Date:\s*(.+)$/i)?.[1]?.trim();
    const dateMatch = dateText?.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})\b/i);
    if (dateMatch) {
      const month = months.indexOf(dateMatch[2].toLowerCase());
      const day = Number(dateMatch[1]);
      const year = Number(dateMatch[3]);
      const parsed = new Date(Date.UTC(year, month, day));
      if (
        month >= 0 &&
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month &&
        parsed.getUTCDate() === day
      ) {
        headings.date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }

  return headings;
}

export async function readMeetReportRows(preview: AttendeeUploadPreview) {
  const XLSX = await import("xlsx");
  const worksheet = preview.workbook.Sheets[preview.worksheetName];
  const lastRow = XLSX.utils.decode_range(worksheet["!ref"]!).e.r;
  const rows: string[][] = [];

  for (let row = preview.headerRowIndex + 1; row <= lastRow; row += 1) {
    rows.push(
      preview.columns.map((column) => {
        const cell =
          worksheet[XLSX.utils.encode_cell({ r: row, c: column.columnIndex })];
        return cell ? XLSX.utils.format_cell(cell).trim() : "";
      }),
    );
  }

  return rows;
}

export function listMeetReportAttendees(
  rows: string[][],
  assignments: AttendeeColumnAssignment[],
) {
  const nameIndex = assignments.indexOf("name");
  const surnameIndex = assignments.indexOf("append_to_name");
  const emailIndex = assignments.indexOf("email");
  if (nameIndex < 0 || emailIndex < 0) return [];

  const attendees = new Map<string, { name: string; email: string }>();
  rows.forEach((row) => {
    const name = appendToAttendeeName(
      row[nameIndex] ?? "",
      surnameIndex < 0 ? "" : (row[surnameIndex] ?? ""),
    );
    const email = (row[emailIndex] ?? "").trim();
    if (name && email && !attendees.has(email.toLowerCase())) {
      attendees.set(email.toLowerCase(), { name, email });
    }
  });
  return [...attendees.values()];
}

export async function createMeetReportAttendeeWorkbook(
  preview: AttendeeUploadPreview,
  assignments: AttendeeColumnAssignment[],
  fileName: string,
) {
  if (!assignments.includes("status")) {
    const XLSX = await import("xlsx");
    const worksheet = preview.workbook.Sheets[preview.worksheetName];
    const range = XLSX.utils.decode_range(worksheet["!ref"]!);
    const columnIndex = range.e.c + 1;
    worksheet[
      XLSX.utils.encode_cell({ r: preview.headerRowIndex, c: columnIndex })
    ] = {
      t: "s",
      v: "Status",
    };
    for (let row = preview.headerRowIndex + 1; row <= range.e.r; row += 1) {
      worksheet[XLSX.utils.encode_cell({ r: row, c: columnIndex })] = {
        t: "s",
        v: "checked-in",
      };
    }
    worksheet["!ref"] = XLSX.utils.encode_range({
      s: range.s,
      e: { r: range.e.r, c: columnIndex },
    });
    preview.columns.push({ columnIndex, header: "Status", previewValues: [] });
    assignments = [...assignments, "status"];
  }

  return createMappedAttendeeWorkbook(preview, assignments, fileName);
}
