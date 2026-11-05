import * as XLSX from "xlsx";
import {
  assignmentsMatchRequiredHeaders,
  createMappedAttendeeWorkbook,
  guessAttendeeColumnAssignments,
  hasUnrecognizedAttendeeColumns,
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

  it.each(["Surname", "Last name"])(
    "appends %s to Name only when selected",
    async (surnameHeader) => {
      const input = createFile(
        [
          ["First name", surnameHeader, "Email"],
          ["Alex", "Rider", "alex@example.com"],
          ["Sam", "", "sam@example.com"],
        ],
        "xlsx",
      );
      const preview = await inspectAttendeeWorkbook(input);
      const assignments = guessAttendeeColumnAssignments(preview.columns);

      expect(assignments).toEqual(["name", "append_to_name", "email"]);

      const mapped = await createMappedAttendeeWorkbook(
        preview,
        assignments,
        input.name,
      );
      const workbook = XLSX.read(await readBlob(mapped), { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      expect(
        XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }),
      ).toEqual([
        ["Name", `Appended ${surnameHeader}`, "Email"],
        ["Alex Rider", "Rider", "alex@example.com"],
        ["Sam", "", "sam@example.com"],
      ]);
    },
  );

  it("does not append a surname when Keep original heading is selected", async () => {
    const input = createFile(
      [
        ["Name", "Surname", "Email"],
        ["Alex", "Rider", "alex@example.com"],
      ],
      "xlsx",
    );
    const preview = await inspectAttendeeWorkbook(input);
    const mapped = await createMappedAttendeeWorkbook(
      preview,
      ["name", "other", "email"],
      input.name,
    );
    const workbook = XLSX.read(await readBlob(mapped), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(
      XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }),
    ).toEqual([
      ["Name", "Other Surname", "Email"],
      ["Alex", "Rider", "alex@example.com"],
    ]);
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

  it("maps Status and a selected question to API upload headings", async () => {
    const input = createFile(
      [
        ["Name", "Email", "Attendance", "Food preference"],
        ["Alex", "alex@example.com", "Confirmed", "Vegan"],
      ],
      "xlsx",
    );
    const preview = await inspectAttendeeWorkbook(input);
    const questions = [{ id: "q-1", label: "Dietary needs", fieldKey: "diet" }];
    const guessed = guessAttendeeColumnAssignments(preview.columns);
    expect(guessed).toEqual(["name", "email", "other", "other"]);
    expect(
      hasUnrecognizedAttendeeColumns(preview.columns, guessed, questions),
    ).toBe(true);

    const mapped = await createMappedAttendeeWorkbook(
      preview,
      ["name", "email", "status", "question:1"],
      input.name,
    );
    const workbook = XLSX.read(await readBlob(mapped), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(
      XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }),
    ).toEqual([
      ["Name", "Email", "Status", "Q1"],
      ["Alex", "alex@example.com", "Confirmed", "Vegan"],
    ]);
  });

  it("recognizes existing question headings without requesting a mapping", async () => {
    const input = createFile(
      [
        ["Name", "Email", "Dietary needs", "diet", "Q1"],
        ["Alex", "alex@example.com", "Vegan", "Vegan", "Vegan"],
      ],
      "xlsx",
    );
    const preview = await inspectAttendeeWorkbook(input);
    const questions = [{ id: "q-1", label: "Dietary needs", fieldKey: "diet" }];

    expect(
      hasUnrecognizedAttendeeColumns(
        preview.columns,
        guessAttendeeColumnAssignments(preview.columns),
        questions,
      ),
    ).toBe(false);
  });

  it("rejects a sheet without headings", async () => {
    await expect(
      inspectAttendeeWorkbook(createFile([["", ""]], "xlsx")),
    ).rejects.toThrow("first row must contain column headings");
  });
});
