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

  it("rejects non-Excel uploads", () => {
    expect(() =>
      parseAttendeeWorkbook(Buffer.from("Name,Email,Phone")),
    ).toThrow(BadRequestException);
  });
});
