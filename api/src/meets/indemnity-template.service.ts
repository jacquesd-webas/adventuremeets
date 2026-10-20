import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
  PDFTextField,
} from "pdf-lib";
import { DatabaseService } from "../database/database.service";
import { AttendeeItemsStorageService } from "../storage/attendee-items-storage.service";
import {
  matchPdfAutoField,
  PdfAutoField,
} from "./indemnity-pdf-field-mappings";
import { fillIndemnityPdf } from "./indemnity-pdf-fill";

export type GeneratedPdfQuestion = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: "text" | "select" | "checkbox";
  required: boolean;
  pdfFormFieldId: string;
  config: {
    source: "indemnity-pdf";
    includeInReports: false;
    options?: string[];
  };
};

export type UploadedPdf = {
  buffer: Buffer;
  size: number;
  originalname: string;
};
export type DetectedPdfForm = {
  questions: GeneratedPdfQuestion[];
  autoFields: PdfAutoField[];
};

export async function detectPdfQuestions(
  buffer: Buffer,
): Promise<DetectedPdfForm> {
  if (buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new BadRequestException("Upload a PDF document");
  }
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(buffer, { updateMetadata: false });
  } catch {
    throw new BadRequestException(
      "The PDF could not be read. Upload an unencrypted PDF form.",
    );
  }

  const questions: GeneratedPdfQuestion[] = [];
  const autoFields: PdfAutoField[] = [];
  for (const field of pdf.getForm().getFields()) {
    if (field instanceof PDFSignature) continue;
    const pdfFieldName = field.getName();
    if (!pdfFieldName.trim()) continue;
    if (field instanceof PDFTextField) {
      const source = matchPdfAutoField(pdfFieldName);
      if (source) {
        autoFields.push({ pdfFieldName, source });
        continue;
      }
    }
    let fieldType: GeneratedPdfQuestion["fieldType"];
    let options: string[] | undefined;
    if (field instanceof PDFTextField) {
      fieldType = "text";
    } else if (field instanceof PDFCheckBox) {
      fieldType = "checkbox";
    } else if (
      field instanceof PDFRadioGroup ||
      field instanceof PDFDropdown ||
      field instanceof PDFOptionList
    ) {
      fieldType = "select";
      options = field
        .getOptions()
        .filter((option) => option && option !== "Off");
      if (!options.length) continue;
    } else {
      continue;
    }
    const fieldKey = `pdf_${createHash("sha256").update(pdfFieldName).digest("hex").slice(0, 20)}`;
    questions.push({
      id: randomUUID(),
      fieldKey,
      label: pdfFieldName,
      fieldType,
      required: field.isRequired(),
      pdfFormFieldId: pdfFieldName,
      config: {
        source: "indemnity-pdf",
        includeInReports: false,
        ...(options ? { options } : {}),
      },
    });
  }
  if (!questions.length && !autoFields.length) {
    throw new BadRequestException(
      "No fillable form fields were found in this PDF",
    );
  }
  return { questions, autoFields };
}

@Injectable()
export class IndemnityTemplateService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: AttendeeItemsStorageService,
  ) {}

  async hasTemplate(meetId: string): Promise<boolean> {
    const row = await this.db
      .getClient()("meet_indemnity_templates")
      .where({ meet_id: meetId })
      .first("meet_id");
    return Boolean(row);
  }

  async get(meetId: string) {
    const row = await this.db
      .getClient()("meet_indemnity_templates")
      .where({ meet_id: meetId })
      .first("filename", "created_at", "object_key");
    if (!row) return null;
    const pdf = await this.storage.download(row.object_key);
    const { autoFields } = await detectPdfQuestions(pdf);
    return { filename: row.filename, createdAt: row.created_at, autoFields };
  }

  async getPreview(meetId: string): Promise<Buffer | null> {
    const row = await this.db
      .getClient()("meet_indemnity_templates")
      .where({ meet_id: meetId })
      .first("object_key");
    return row ? this.storage.download(row.object_key) : null;
  }

  async upload(meetId: string, file: UploadedPdf) {
    if (!file?.buffer || file.size > 10 * 1024 * 1024) {
      throw new BadRequestException("Upload a PDF smaller than 10 MB");
    }
    const { questions, autoFields } = await detectPdfQuestions(file.buffer);
    const filename = (file.originalname || "indemnity.pdf")
      .replace(/[\\/\r\n]/g, "_")
      .slice(0, 255);
    const objectKey = `meets/${meetId}/indemnity/${randomUUID()}.pdf`;
    await this.storage.upload(objectKey, file.buffer);

    let oldObjectKey: string | undefined;
    try {
      await this.db.getClient().transaction(async (trx) => {
        const existingTemplate = await trx("meet_indemnity_templates")
          .where({ meet_id: meetId })
          .first("object_key");
        oldObjectKey = existingTemplate?.object_key;
        const definitions = await trx("meet_meta_definitions")
          .where({ meet_id: meetId })
          .select("id", "config");
        const oldIds = definitions
          .filter((definition) => definition.config?.source === "indemnity-pdf")
          .map((definition) => definition.id);
        if (oldIds.length) {
          const answered = await trx("meet_meta_values")
            .whereIn("meta_definition_id", oldIds)
            .first("meta_definition_id");
          if (answered)
            throw new BadRequestException(
              "Cannot replace a form after attendees have answered it",
            );
          await trx("meet_meta_definitions").whereIn("id", oldIds).del();
        }
        const existingKeys = new Set(
          (
            await trx("meet_meta_definitions")
              .where({ meet_id: meetId })
              .select("field_key")
          ).map((definition) => definition.field_key),
        );
        if (questions.some((question) => existingKeys.has(question.fieldKey))) {
          throw new BadRequestException(
            "A meet question already uses a PDF field key",
          );
        }
        const position = definitions.length - oldIds.length;
        if (questions.length) {
          await trx("meet_meta_definitions").insert(
            questions.map((question, index) => ({
              id: question.id,
              meet_id: meetId,
              field_key: question.fieldKey,
              label: question.label,
              field_type: question.fieldType,
              required: question.required,
              category: "P",
              pdf_form_field_id: question.pdfFormFieldId,
              position: position + index,
              config: question.config,
            })),
          );
        }
        await trx("meet_indemnity_templates")
          .insert({ meet_id: meetId, object_key: objectKey, filename })
          .onConflict("meet_id")
          .merge({ object_key: objectKey, filename, created_at: trx.fn.now() });
        await trx("meets")
          .where({ id: meetId })
          .update({ require_email: true });
      });
    } catch (error) {
      await this.storage.remove(objectKey).catch(() => undefined);
      throw error;
    }
    if (oldObjectKey) {
      const stillReferenced = await this.db
        .getClient()("meet_indemnity_templates")
        .where({ object_key: oldObjectKey })
        .first("meet_id");
      if (!stillReferenced)
        await this.storage.remove(oldObjectKey).catch(() => undefined);
    }
    return { filename, questions, autoFields };
  }

  async remove(meetId: string): Promise<void> {
    let objectKey: string | undefined;
    await this.db.getClient().transaction(async (trx) => {
      const template = await trx("meet_indemnity_templates")
        .where({ meet_id: meetId })
        .first("object_key");
      if (!template) return;
      objectKey = template.object_key;
      const definitions = await trx("meet_meta_definitions")
        .where({ meet_id: meetId })
        .select("id", "config");
      const pdfIds = definitions
        .filter((definition) => definition.config?.source === "indemnity-pdf")
        .map((definition) => definition.id);
      if (pdfIds.length) {
        const answered = await trx("meet_meta_values")
          .whereIn("meta_definition_id", pdfIds)
          .first("meta_definition_id");
        if (answered)
          throw new BadRequestException(
            "Cannot remove a form after attendees have answered it",
          );
        await trx("meet_meta_definitions").whereIn("id", pdfIds).del();
      }
      await trx("meet_indemnity_templates").where({ meet_id: meetId }).del();
    });
    if (objectKey) await this.storage.remove(objectKey).catch(() => undefined);
  }

  async createAttendeePdf(
    meet: {
      id: string;
      name?: string;
      organizationId?: string;
      startTime?: string;
      endTime?: string;
      timeZone?: string;
      location?: string;
    },
    attendee: {
      id: string;
      name?: string;
      guardianName?: string;
      isMinor?: boolean;
    },
  ): Promise<{ filename: string; content: Buffer } | null> {
    const db = this.db.getClient();
    const template = await db("meet_indemnity_templates")
      .where({ meet_id: meet.id })
      .first("object_key", "filename");
    if (!template) return null;

    const definitions = await db("meet_meta_definitions")
      .where({ meet_id: meet.id })
      .select("id", "pdf_form_field_id");
    const values = await db("meet_meta_values")
      .where({ meet_id: meet.id, attendee_id: attendee.id })
      .select("meta_definition_id", "value");
    const valuesById = new Map(
      values.map((row) => [row.meta_definition_id, row.value]),
    );
    const answers: Record<string, string> = Object.create(null);
    for (const definition of definitions) {
      const pdfFieldName = definition.pdf_form_field_id;
      if (typeof pdfFieldName === "string") {
        const value = valuesById.get(definition.id);
        if (typeof value === "string") answers[pdfFieldName] = value;
      }
    }

    const organization = meet.organizationId
      ? await db("organizations")
          .where({ id: meet.organizationId })
          .first("name")
      : null;
    const original = await this.storage.download(template.object_key);
    const content = await fillIndemnityPdf(original, {
      meet: { ...meet, organizationName: organization?.name },
      attendee,
      answers,
    });
    const filename = `${template.filename.replace(/\.pdf$/i, "").slice(0, 235)}-prefilled.pdf`;
    const objectKey = `meets/${meet.id}/attendees/${attendee.id}/indemnity/${randomUUID()}.pdf`;
    await this.storage.upload(objectKey, content);
    let previousKey: string | undefined;
    try {
      const previous = await db("meet_attendee_attachments")
        .where({ attendee_id: attendee.id, kind: "prefilled-indemnity" })
        .first("object_key");
      previousKey = previous?.object_key;
      await db("meet_attendee_attachments")
        .insert({
          meet_id: meet.id,
          attendee_id: attendee.id,
          kind: "prefilled-indemnity",
          object_key: objectKey,
          filename,
          content_type: "application/pdf",
        })
        .onConflict(["attendee_id", "kind"])
        .merge({ object_key: objectKey, filename, created_at: db.fn.now() });
    } catch (error) {
      await this.storage.remove(objectKey).catch(() => undefined);
      throw error;
    }
    if (previousKey)
      await this.storage.remove(previousKey).catch(() => undefined);
    return { filename, content };
  }
}
