import * as XLSX from "xlsx";
import {
  assignmentsMatchRequiredHeaders,
  createMappedAttendeeWorkbook,
  guessAttendeeColumnAssignments,
  inspectAttendeeWorkbook,
} from "../attendeeUploadWorkbook";

const createFile = (rows: unknown[][], bookType: "xlsx" | "biff5") => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const contents = XLSX.write(
    {
      SheetNames: ["Attendees"],
      Sheets: { Attendees: worksheet },
    },
    { type: "array", bookType },
  ) as ArrayBuffer;

  return {
    name: bookType === "biff5" ? "attendees.xls" : "attendees.xlsx",
    arrayBuffer: async () => contents,
  } as File;
};

const readBlob = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });

describe("attendeeUploadWorkbook", () => {
  it.each([
    ["modern workbooks", "xlsx"],
    ["Excel 95 workbooks", "biff5"],
  ] as const)("previews %s", async (_label, bookType) => {
    const preview = await inspectAttendeeWorkbook(
      createFile(
        [
          ["Full Name", "Email Address", "Mobile No"],
          ["Alex", "alex@example.com", "+27123456789"],
        ],
        bookType,
      ),
    );

    expect(preview.columns).toEqual([
      { columnIndex: 0, header: "Full Name", previewValues: ["Alex"] },
      {
        columnIndex: 1,
        header: "Email Address",
        previewValues: ["alex@example.com"],
      },
      {
        columnIndex: 2,
        header: "Mobile No",
        previewValues: ["+27123456789"],
      },
    ]);
    expect(guessAttendeeColumnAssignments(preview.columns)).toEqual([
      "name",
      "email",
      "phone",
    ]);
  });

  it("only treats canonical required headings as an exact match", async () => {
    const exact = await inspectAttendeeWorkbook(
      createFile(
        [
          ["Name", "Email"],
          ["Alex", "alex@example.com"],
        ],
        "xlsx",
      ),
    );
    const variations = await inspectAttendeeWorkbook(
      createFile(
        [
          ["Full Name", "Email Address", "Mobile"],
          ["Alex", "alex@example.com", "+27123456789"],
        ],
        "xlsx",
      ),
    );

    expect(
      assignmentsMatchRequiredHeaders(
        exact.columns,
        guessAttendeeColumnAssignments(exact.columns),
      ),
    ).toBe(true);
    expect(
      assignmentsMatchRequiredHeaders(
        variations.columns,
        guessAttendeeColumnAssignments(variations.columns),
      ),
    ).toBe(false);
  });

  it("writes selected columns with canonical headings", async () => {
    const input = createFile(
      [
        ["Contact", "Mobile", "Email Address", "Diet"],
        ["Alex", "+27123456789", "alex@example.com", "Vegan"],
      ],
      "xlsx",
    );
    const preview = await inspectAttendeeWorkbook(input);
    const mapped = await createMappedAttendeeWorkbook(
      preview,
      ["name", "phone", "email", "other"],
      input.name,
    );
    const workbook = XLSX.read(await readBlob(mapped), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    expect(
      XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }),
    ).toEqual([
      ["Name", "Phone", "Email", "Diet"],
      ["Alex", "+27123456789", "alex@example.com", "Vegan"],
    ]);
    expect(mapped.name).toBe("attendees-mapped.xlsx");
  });

  it("rejects a sheet without headings", async () => {
    await expect(
      inspectAttendeeWorkbook(createFile([["", ""]], "xlsx")),
    ).rejects.toThrow("first row must contain column headings");
  });
});
