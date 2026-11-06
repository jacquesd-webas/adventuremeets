import { BadRequestException } from "@nestjs/common";
import * as XLSX from "xlsx";
import { parseAttendeeWorkbook } from "./attendee-upload-workbook";

const createWorkbook = (bookType: "xlsx" | "biff5") => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Name", "Email", "Phone"],
    ["Alex", "alex@example.com", "+27123456789"],
  ]);

  return XLSX.write(
    {
      SheetNames: ["Attendees"],
      Sheets: { Attendees: worksheet },
    },
    { type: "buffer", bookType },
  );
};

describe("parseAttendeeWorkbook", () => {
  it.each([
    ["modern .xlsx", "xlsx"],
    ["Excel 95 .xls", "biff5"],
  ] as const)("parses %s workbooks", (_format, bookType) => {
    expect(parseAttendeeWorkbook(createWorkbook(bookType))).toEqual([
      ["Name", "Email", "Phone"],
      ["Alex", "alex@example.com", "+27123456789"],
    ]);
  });

  it("ignores single-cell and merged heading rows before the attendee columns", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Meet: Sunrise Hike"],
      ["Date: 14 April 2026"],
      ["Organiser: Taylor"],
      [],
      ["Name", "Email", "Phone"],
      ["Alex", "alex@example.com", "+27123456789"],
    ]);
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    ];
    const buffer = XLSX.write(
      { SheetNames: ["Attendees"], Sheets: { Attendees: worksheet } },
      { type: "buffer", bookType: "xlsx" },
    );

    expect(parseAttendeeWorkbook(buffer)).toEqual([
      ["Name", "Email", "Phone"],
      ["Alex", "alex@example.com", "+27123456789"],
    ]);
  });

  it("rejects non-Excel uploads", () => {
    expect(() =>
      parseAttendeeWorkbook(Buffer.from("Name,Email,Phone")),
    ).toThrow(BadRequestException);
  });
});
