import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  createMeetReportAttendeeWorkbook,
  listMeetReportAttendees,
  readMeetReportHeadings,
  readMeetReportRows,
} from "../uploadMeetWorkbook";
import type { AttendeeUploadPreview } from "../../manageAttendeesModal/attendeeUploadWorkbook";
import {
  guessAttendeeColumnAssignments,
  inspectAttendeeWorkbook,
} from "../../manageAttendeesModal/attendeeUploadWorkbook";

function preview(rows: string[][]): AttendeeUploadPreview {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  return {
    columns: [],
    headerRowIndex: rows.length - 1,
    workbook: { SheetNames: ["Report"], Sheets: { Report: worksheet } },
    worksheetName: "Report",
  };
}

describe("readMeetReportHeadings", () => {
  it("reads the meet name and first date from a report", () => {
    expect(
      readMeetReportHeadings(
        preview([
          ["Meet: River Walk"],
          ["Date: 6 November 2026 – 7 November 2026"],
          ["Organiser: Alex"],
          ["Name", "Email"],
        ]),
      ),
    ).toEqual({ name: "River Walk", date: "2026-11-06", organiser: "Alex" });
  });

  it("leaves missing or invalid dates for the user to enter", () => {
    expect(
      readMeetReportHeadings(
        preview([
          ["Meet: Field Trip"],
          ["Date: 31 February 2026"],
          ["Name", "Email"],
        ]),
      ),
    ).toEqual({ name: "Field Trip" });
  });
});

describe("listMeetReportAttendees", () => {
  it("lists imported names and emails, including an appended surname", async () => {
    const file = reportFile([
      ["Meet: Forest Walk"],
      ["Name", "Surname", "Email"],
      ["Alex", "Walker", "alex@example.com"],
    ]);
    const inspected = await inspectAttendeeWorkbook(file);
    const rows = await readMeetReportRows(inspected);

    expect(
      listMeetReportAttendees(rows, ["name", "append_to_name", "email"]),
    ).toEqual([{ name: "Alex Walker", email: "alex@example.com" }]);
  });
});

function reportFile(rows: unknown[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const data = XLSX.write(
    { SheetNames: ["Report"], Sheets: { Report: worksheet } },
    { type: "array", bookType: "xlsx" },
  ) as ArrayBuffer;
  return { name: "report.xlsx", arrayBuffer: async () => data } as File;
}

function readFile(file: Blob) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

describe("createMeetReportAttendeeWorkbook", () => {
  it("adds checked-in status when the report has no status column", async () => {
    const file = reportFile([
      ["Meet: Forest Walk"],
      ["Name", "Email"],
      ["Alex", "alex@example.com"],
    ]);
    const inspected = await inspectAttendeeWorkbook(file);
    const mapped = await createMeetReportAttendeeWorkbook(
      inspected,
      guessAttendeeColumnAssignments(inspected.columns),
      file.name,
    );
    const workbook = XLSX.read(await readFile(mapped), { type: "array" });
    const worksheet = workbook.Sheets.Report;

    expect(worksheet.C2.v).toBe("Status");
    expect(worksheet.C3.v).toBe("checked-in");
    expect(worksheet.A1.v).toBe("Meet: Forest Walk");
  });

  it("preserves status values when the report has a status column", async () => {
    const file = reportFile([
      ["Name", "Email", "Status"],
      ["Alex", "alex@example.com", "rejected"],
    ]);
    const inspected = await inspectAttendeeWorkbook(file);
    const mapped = await createMeetReportAttendeeWorkbook(
      inspected,
      guessAttendeeColumnAssignments(inspected.columns),
      file.name,
    );
    const workbook = XLSX.read(await readFile(mapped), { type: "array" });
    const worksheet = workbook.Sheets.Report;

    expect(worksheet.C2.v).toBe("rejected");
    expect(worksheet.D1).toBeUndefined();
  });
});
