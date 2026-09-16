import { BadRequestException } from "@nestjs/common";
import * as XLSX from "xlsx";

export type AttendeeWorkbookRow = Array<string | number | boolean>;

const XLSX_SIGNATURE = Buffer.from([0x50, 0x4b]);
const XLS_SIGNATURE = Buffer.from([
  0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
]);

const hasSignature = (buffer: Buffer, signature: Buffer) =>
  buffer.length >= signature.length &&
  buffer.subarray(0, signature.length).equals(signature);

export function parseAttendeeWorkbook(buffer: Buffer): AttendeeWorkbookRow[] {
  if (
    !Buffer.isBuffer(buffer) ||
    (!hasSignature(buffer, XLSX_SIGNATURE) &&
      !hasSignature(buffer, XLS_SIGNATURE))
  ) {
    throw new BadRequestException(
      "Upload must be a valid Excel .xlsx or .xls file.",
    );
  }

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = firstSheetName
      ? workbook.Sheets[firstSheetName]
      : undefined;

    if (!worksheet) {
      throw new BadRequestException("No worksheet found in the uploaded file");
    }

    return XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }) as AttendeeWorkbookRow[];
  } catch (error) {
    if (error instanceof BadRequestException) throw error;

    throw new BadRequestException(
      "Could not read the Excel file. Upload a valid .xlsx or .xls workbook.",
    );
  }
}
