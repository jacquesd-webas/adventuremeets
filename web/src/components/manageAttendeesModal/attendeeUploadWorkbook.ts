import type { WorkBook } from "xlsx";

export type AttendeeColumnRole = "name" | "email" | "phone";

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

export type AttendeeColumnAssignment = AttendeeColumnRole | "other";

export const attendeeColumnLabels: Record<AttendeeColumnRole, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
};

export const attendeeColumnRoles: AttendeeColumnRole[] = [
  "name",
  "email",
  "phone",
];

export const requiredAttendeeColumnRoles: AttendeeColumnRole[] = [
  "name",
  "email",
];

const headerAliases: Record<AttendeeColumnRole, string[]> = {
  name: [
    "name",
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
};

export const normalizeAttendeeColumnHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

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
  const headerRowIndex = range.s.r;
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

  preview.columns.forEach((column, index) => {
    const assignment = assignments[index];
    const normalizedHeader = normalizeAttendeeColumnHeader(column.header);
    const isUnselectedRequiredHeader =
      assignment === "other" &&
      attendeeColumnRoles.some((role) => role === normalizedHeader);
    const value =
      assignment === "other"
        ? isUnselectedRequiredHeader
          ? `Other ${column.header}`
          : column.header
        : attendeeColumnLabels[assignment];

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
