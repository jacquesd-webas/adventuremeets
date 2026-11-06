import type { WorkBook } from "xlsx";

export type AttendeeColumnRole = "name" | "email" | "phone" | "status";

export type AttendeeUploadQuestion = {
  id: string;
  label: string;
  fieldKey: string;
};

export type AttendeeUploadColumn = {
  columnIndex: number;
  header: string;
  previewValues: string[];
};

export type AttendeeUploadPreview = {
  columns: AttendeeUploadColumn[];
  headerRowIndex: number;
  workbook: WorkBook;
  worksheetName: string;
};

export type AttendeeColumnAssignment =
  | AttendeeColumnRole
  | "append_to_name"
  | "ignore"
  | "other"
  | `question:${number}`;

export const attendeeColumnLabels: Record<AttendeeColumnRole, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  status: "Status",
};

export const attendeeColumnRoles: AttendeeColumnRole[] = [
  "name",
  "email",
  "phone",
  "status",
];

export const requiredAttendeeColumnRoles: AttendeeColumnRole[] = [
  "name",
  "email",
];

const headerAliases: Record<AttendeeColumnRole, string[]> = {
  name: [
    "name",
    "firstname",
    "fullname",
    "fullnames",
    "attendeename",
    "attendee",
    "participantname",
    "participant",
    "guestname",
    "contactname",
    "nameandsurname",
    "namesurname",
    "surnameandname",
    "firstnameandsurname",
    "firstandlastname",
  ],
  email: [
    "email",
    "emailaddress",
    "emailaddr",
    "emailid",
    "mail",
    "mailaddress",
    "contactemail",
  ],
  phone: [
    "phone",
    "phonenumber",
    "phoneno",
    "mobile",
    "mobilenumber",
    "mobileno",
    "cell",
    "cellphone",
    "cellnumber",
    "telephone",
    "tel",
    "telno",
    "contactnumber",
    "contactno",
    "contactphone",
    "whatsapp",
    "whatsappnumber",
  ],
  status: ["status", "attendeestatus"],
};

export const normalizeAttendeeColumnHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const surnameHeaders = ["surname", "lastname"];

export const appendToAttendeeName = (name: string, surname: string) =>
  [name.trim(), surname.trim()].filter(Boolean).join(" ");

export function guessAttendeeColumnAssignments(
  columns: AttendeeUploadColumn[],
): AttendeeColumnAssignment[] {
  const assignments = columns.map<AttendeeColumnAssignment>(() => "other");
  const assignedColumns = new Set<number>();

  attendeeColumnRoles.forEach((role) => {
    const aliases = headerAliases[role];
    const columnOffset = columns.findIndex(
      (column, index) =>
        !assignedColumns.has(index) &&
        aliases.includes(normalizeAttendeeColumnHeader(column.header)),
    );

    if (columnOffset >= 0) {
      assignments[columnOffset] = role;
      assignedColumns.add(columnOffset);
    }
  });

  const surnameOffset = columns.findIndex((column) =>
    surnameHeaders.includes(normalizeAttendeeColumnHeader(column.header)),
  );
  if (surnameOffset >= 0) {
    assignments[surnameOffset] = "append_to_name";
  }

  return assignments;
}

export function assignmentsMatchRequiredHeaders(
  columns: AttendeeUploadColumn[],
  assignments: AttendeeColumnAssignment[],
) {
  const hasRequiredHeaders = requiredAttendeeColumnRoles.every((role) =>
    assignments.includes(role),
  );
  const recognizedHeadersAreCanonical = assignments.every(
    (assignment, index) =>
      assignment === "other" ||
      normalizeAttendeeColumnHeader(columns[index]?.header ?? "") ===
        assignment,
  );
  const assignmentsAreUnique = attendeeColumnRoles.every(
    (role) =>
      assignments.filter((assignment) => assignment === role).length <= 1,
  );

  return (
    hasRequiredHeaders && recognizedHeadersAreCanonical && assignmentsAreUnique
  );
}

export function hasUnrecognizedAttendeeColumns(
  columns: AttendeeUploadColumn[],
  assignments: AttendeeColumnAssignment[],
  questions: AttendeeUploadQuestion[],
) {
  const questionKeys = new Set(
    questions
      .flatMap((question) => [
        normalizeAttendeeColumnHeader(question.label),
        normalizeAttendeeColumnHeader(question.fieldKey),
      ])
      .filter(Boolean),
  );

  return columns.some((column, index) => {
    if (assignments[index] !== "other") return false;
    const key = normalizeAttendeeColumnHeader(column.header);
    if (surnameHeaders.includes(key)) return false;
    if (questionKeys.has(key)) return false;
    const questionIndex = key.match(/^q(\d+)$/);
    if (
      questionIndex &&
      Number(questionIndex[1]) >= 1 &&
      Number(questionIndex[1]) <= questions.length
    ) {
      return false;
    }
    return true;
  });
}

export async function inspectAttendeeWorkbook(
  file: File,
): Promise<AttendeeUploadPreview> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const worksheetName = workbook.SheetNames[0];
  const worksheet = worksheetName ? workbook.Sheets[worksheetName] : undefined;
  const worksheetRange = worksheet?.["!ref"];

  if (!worksheet || !worksheetRange) {
    throw new Error("The workbook does not contain a worksheet with data.");
  }

  const range = XLSX.utils.decode_range(worksheetRange);
  let headerRowIndex = range.s.r;
  while (headerRowIndex <= range.e.r) {
    const populatedCells = Array.from(
      { length: range.e.c - range.s.c + 1 },
      (_, offset) =>
        worksheet[
          XLSX.utils.encode_cell({ r: headerRowIndex, c: range.s.c + offset })
        ],
    ).filter((cell) => cell && XLSX.utils.format_cell(cell).trim());
    if (populatedCells.length > 1) break;
    headerRowIndex += 1;
  }
  if (headerRowIndex > range.e.r) {
    throw new Error("The first row must contain column headings.");
  }
  const columns: AttendeeUploadColumn[] = [];

  for (
    let columnIndex = range.s.c;
    columnIndex <= range.e.c;
    columnIndex += 1
  ) {
    const headerCell =
      worksheet[
        XLSX.utils.encode_cell({
          r: headerRowIndex,
          c: columnIndex,
        })
      ];
    const previewValues: string[] = [];

    for (
      let rowIndex = headerRowIndex + 1;
      rowIndex <= Math.min(range.e.r, headerRowIndex + 5);
      rowIndex += 1
    ) {
      const cell =
        worksheet[
          XLSX.utils.encode_cell({
            r: rowIndex,
            c: columnIndex,
          })
        ];
      previewValues.push(cell ? XLSX.utils.format_cell(cell) : "");
    }

    columns.push({
      columnIndex,
      header: headerCell ? XLSX.utils.format_cell(headerCell).trim() : "",
      previewValues,
    });
  }

  if (!columns.some((column) => column.header)) {
    throw new Error("The first row must contain column headings.");
  }

  return { columns, headerRowIndex, workbook, worksheetName };
}

export async function createMappedAttendeeWorkbook(
  preview: AttendeeUploadPreview,
  assignments: AttendeeColumnAssignment[],
  originalFileName: string,
) {
  const XLSX = await import("xlsx");
  const worksheet = preview.workbook.Sheets[preview.worksheetName];
  const lastRow = XLSX.utils.decode_range(worksheet["!ref"]!).e.r;

  const nameColumn = preview.columns[assignments.indexOf("name")];
  const surnameColumn = preview.columns[assignments.indexOf("append_to_name")];
  if (nameColumn && surnameColumn) {
    for (let row = preview.headerRowIndex + 1; row <= lastRow; row += 1) {
      const nameAddress = XLSX.utils.encode_cell({
        r: row,
        c: nameColumn.columnIndex,
      });
      const surnameAddress = XLSX.utils.encode_cell({
        r: row,
        c: surnameColumn.columnIndex,
      });
      const name = worksheet[nameAddress]
        ? XLSX.utils.format_cell(worksheet[nameAddress])
        : "";
      const surname = worksheet[surnameAddress]
        ? XLSX.utils.format_cell(worksheet[surnameAddress])
        : "";
      worksheet[nameAddress] = {
        t: "s",
        v: appendToAttendeeName(name, surname),
      };
    }
  }

  preview.columns.forEach((column, index) => {
    const assignment = assignments[index];
    if (assignment === "ignore") {
      for (let row = preview.headerRowIndex; row <= lastRow; row += 1) {
        delete worksheet[
          XLSX.utils.encode_cell({ r: row, c: column.columnIndex })
        ];
      }
      return;
    }
    const normalizedHeader = normalizeAttendeeColumnHeader(column.header);
    const isUnselectedRequiredHeader =
      assignment === "other" &&
      (attendeeColumnRoles.some((role) => role === normalizedHeader) ||
        surnameHeaders.includes(normalizedHeader));
    const value =
      assignment === "other"
        ? isUnselectedRequiredHeader
          ? `Other ${column.header}`
          : column.header
        : assignment === "append_to_name"
          ? `Appended ${column.header || "Surname"}`
          : assignment.startsWith("question:")
            ? `Q${assignment.slice("question:".length)}`
            : attendeeColumnLabels[assignment as AttendeeColumnRole];

    const address = XLSX.utils.encode_cell({
      r: preview.headerRowIndex,
      c: column.columnIndex,
    });
    worksheet[address] = { t: "s", v: value };
  });

  const contents = XLSX.write(preview.workbook, {
    type: "array",
    bookType: "xlsx",
  });
  const baseName = originalFileName.replace(/\.(xlsx?|xls)$/i, "");

  return new File([contents], `${baseName}-mapped.xlsx`, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
