import { BadRequestException } from "@nestjs/common";
import { PDFDocument } from "pdf-lib";
import {
  detectPdfQuestions,
  IndemnityTemplateService,
} from "./indemnity-template.service";

describe("signed attendee indemnity", () => {
  it("stores the PDF and marks acceptance together", async () => {
    const insert = jest.fn().mockReturnValue({
      onConflict: () => ({ merge: jest.fn().mockResolvedValue(undefined) }),
    });
    const update = jest.fn().mockResolvedValue(1);
    const trx = Object.assign(
      jest.fn((table: string) => ({
        where: jest.fn().mockReturnValue({
          first: jest
            .fn()
            .mockResolvedValue(
              table === "meet_attendees" ? { id: "a-1" } : null,
            ),
          update,
        }),
        insert,
      })),
      { fn: { now: () => "now" } },
    );
    const db = {
      getClient: () => ({
        transaction: (callback: (trx: any) => Promise<void>) => callback(trx),
      }),
    };
    const storage = { upload: jest.fn(), remove: jest.fn() };
    const service = new IndemnityTemplateService(db as any, storage as any);
    const pdf = Buffer.from("%PDF-1.4\nsigned");

    await service.saveSignedAttendeePdf("meet-1", "a-1", {
      filename: "signed.pdf",
      content: pdf,
    });

    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringContaining("meets/meet-1/attendees/a-1/"),
      pdf,
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "signed-indemnity", attendee_id: "a-1" }),
    );
    expect(update).toHaveBeenCalledWith({
      indemnity_accepted: true,
      updated_at: "now",
    });
  });

  it("rejects a non-PDF before saving", async () => {
    const storage = { upload: jest.fn() };
    const service = new IndemnityTemplateService({} as any, storage as any);
    await expect(
      service.saveSignedAttendeePdf("meet-1", "a-1", {
        content: Buffer.from("hello"),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.upload).not.toHaveBeenCalled();
  });
});

describe("detectPdfQuestions", () => {
  it("omits signature date fields from generated questions", async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    const form = pdf.getForm();
    for (const name of [
      "Parent Signature Date",
      "Witness Signature Date",
      "parentSignatureDate",
      "Date of Signature",
      "Child Date of Birth",
    ]) {
      form.createTextField(name).addToPage(page);
    }

    const result = await detectPdfQuestions(Buffer.from(await pdf.save()));
    expect(result.questions.map((question) => question.label)).toEqual([
      "Child Date of Birth",
    ]);
    expect(result.autoFields).toEqual([]);
  });

  it("maps a generic signer name only without a parent or guardian field", async () => {
    const fallbackPdf = await PDFDocument.create();
    fallbackPdf
      .getForm()
      .createTextField("Name")
      .addToPage(fallbackPdf.addPage());
    const fallback = await detectPdfQuestions(
      Buffer.from(await fallbackPdf.save()),
    );
    expect(fallback.autoFields).toEqual([
      { pdfFieldName: "Name", source: "signatoryName" },
    ]);
    expect(fallback.questions).toEqual([]);

    const explicitPdf = await PDFDocument.create();
    const page = explicitPdf.addPage();
    explicitPdf.getForm().createTextField("Name").addToPage(page);
    explicitPdf.getForm().createTextField("Guardian Name").addToPage(page);
    const explicit = await detectPdfQuestions(
      Buffer.from(await explicitPdf.save()),
    );
    expect(explicit.autoFields).toEqual([
      { pdfFieldName: "Guardian Name", source: "guardianName" },
    ]);
    expect(explicit.questions).toEqual([
      expect.objectContaining({ label: "Name" }),
    ]);
  });

  it("creates questions from fillable text, checkbox and choice fields", async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    const form = pdf.getForm();
    form.createTextField("Emergency contact name").addToPage(page);
    form.createCheckBox("Consent").addToPage(page);
    const choice = form.createDropdown("Preferred contact");
    choice.addOptions(["Email", "Phone"]);
    choice.addToPage(page);

    const { questions, autoFields } = await detectPdfQuestions(
      Buffer.from(await pdf.save()),
    );
    expect(questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Emergency contact name",
          fieldType: "text",
        }),
        expect.objectContaining({ label: "Consent", fieldType: "checkbox" }),
        expect.objectContaining({
          label: "Preferred contact",
          fieldType: "select",
          config: expect.objectContaining({ options: ["Email", "Phone"] }),
        }),
      ]),
    );
    expect(
      questions.every((question) => question.config.includeInReports === false),
    ).toBe(true);
    expect(
      questions.every((question) => question.pdfFormFieldId === question.label),
    ).toBe(true);
    expect(autoFields).toEqual([]);
  });

  it("maps meet and attendee fields without creating duplicate questions", async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    const form = pdf.getForm();
    for (const name of [
      "CampActivity",
      "Start Date",
      "End Date",
      "LocationVenue",
      "Scout group",
      "Child full name",
      "Child full name2",
      "Parent full name",
      "Parent1 name",
      "Parent2 name",
    ]) {
      form.createTextField(name).addToPage(page);
    }

    const { questions, autoFields } = await detectPdfQuestions(
      Buffer.from(await pdf.save()),
    );
    expect(autoFields).toEqual(
      expect.arrayContaining([
        { pdfFieldName: "CampActivity", source: "meetName" },
        { pdfFieldName: "Start Date", source: "meetStartTime" },
        { pdfFieldName: "End Date", source: "meetEndTime" },
        { pdfFieldName: "LocationVenue", source: "meetLocation" },
        { pdfFieldName: "Scout group", source: "organizationName" },
        { pdfFieldName: "Child full name", source: "attendeeName" },
        { pdfFieldName: "Child full name2", source: "attendeeName" },
        { pdfFieldName: "Parent full name", source: "guardianName" },
        { pdfFieldName: "Parent1 name", source: "guardianName" },
      ]),
    );
    expect(questions.map((question) => question.label)).toEqual([
      "Parent2 name",
    ]);
  });

  it("rejects non-PDF and non-fillable documents", async () => {
    await expect(
      detectPdfQuestions(Buffer.from("hello")),
    ).rejects.toBeInstanceOf(BadRequestException);
    const pdf = await PDFDocument.create();
    pdf.addPage();
    await expect(
      detectPdfQuestions(Buffer.from(await pdf.save())),
    ).rejects.toThrow("No fillable form fields");
  });

  it("recomputes automatic mappings from the stored PDF when reopened", async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    pdf.getForm().createTextField("Start Date").addToPage(page);
    const first = jest.fn().mockResolvedValue({
      filename: "form.pdf",
      object_key: "meets/one/indemnity/form.pdf",
      created_at: new Date(),
    });
    const query = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first,
    };
    const db = { getClient: () => () => query };
    const storage = {
      download: jest.fn().mockResolvedValue(Buffer.from(await pdf.save())),
    };
    const service = new IndemnityTemplateService(db as any, storage as any);

    const result = await service.get("meet-1");
    expect(first).toHaveBeenCalledWith(
      "p.filename",
      "p.created_at",
      "p.object_key",
    );
    expect(storage.download).toHaveBeenCalledWith(
      "meets/one/indemnity/form.pdf",
    );
    expect(result?.autoFields).toEqual([
      { pdfFieldName: "Start Date", source: "meetStartTime" },
    ]);
  });

  it("downloads the stored PDF for a preview", async () => {
    const first = jest
      .fn()
      .mockResolvedValue({ object_key: "meets/one/indemnity/form.pdf" });
    const db = {
      getClient: () => () => ({
        join: () => ({ where: () => ({ first }) }),
      }),
    };
    const pdf = Buffer.from("%PDF-preview");
    const storage = { download: jest.fn().mockResolvedValue(pdf) };
    const service = new IndemnityTemplateService(db as any, storage as any);

    await expect(service.getPreview("meet-1")).resolves.toBe(pdf);
    expect(storage.download).toHaveBeenCalledWith(
      "meets/one/indemnity/form.pdf",
    );
  });

  it("categorizes generated PDF questions as PDF-based", async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    pdf.getForm().createTextField("Allergies").addToPage(page);
    const template = Buffer.from(await pdf.save());
    const definitions = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    const templateQuery = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      merge: jest.fn().mockResolvedValue(undefined),
    };
    const meetQuery = {
      where: jest.fn().mockReturnThis(),
      forUpdate: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ indemnity_pdfs_id: null }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const pdfQuery = {
      insert: jest.fn().mockResolvedValue(undefined),
    };
    const client = Object.assign(
      (table: string) =>
        table === "meet_meta_definitions"
          ? definitions
          : table === "meet_indemnity_templates"
            ? templateQuery
            : table === "indemnity_pdfs"
              ? pdfQuery
              : meetQuery,
      {
        transaction: async (callback: (trx: unknown) => Promise<void>) =>
          callback(client),
        fn: { now: () => new Date() },
      },
    );
    const db = { getClient: () => client };
    const storage = {
      upload: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const service = new IndemnityTemplateService(db as any, storage as any);

    await service.upload("meet-1", {
      buffer: template,
      size: template.length,
      originalname: "form.pdf",
    });

    expect(definitions.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        label: "Allergies",
        category: "P",
        pdf_form_field_id: "Allergies",
      }),
    ]);
  });

  it("removes a saved PDF and its unanswered questions", async () => {
    const legacyTemplate = {
      where: jest.fn().mockReturnThis(),
      del: jest.fn().mockResolvedValue(1),
    };
    const meet = {
      where: jest.fn().mockReturnThis(),
      forUpdate: jest.fn().mockReturnThis(),
      first: jest
        .fn()
        .mockResolvedValueOnce({ indemnity_pdfs_id: "pdf-1" })
        .mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(1),
    };
    const pdf = {
      where: jest.fn().mockReturnThis(),
      first: jest
        .fn()
        .mockResolvedValueOnce({ object_key: "form.pdf" })
        .mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(1),
    };
    const definitions = {
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        { id: "pdf-1", config: { source: "indemnity-pdf" } },
        { id: "ordinary-1", config: {} },
      ]),
      del: jest.fn().mockResolvedValue(1),
    };
    const values = {
      whereIn: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(undefined),
    };
    const client = Object.assign(
      (table: string) =>
        table === "meets"
          ? meet
          : table === "indemnity_pdfs"
            ? pdf
            : table === "meet_indemnity_templates"
              ? legacyTemplate
              : table === "meet_meta_definitions"
                ? definitions
                : values,
      {
        transaction: async (callback: (trx: unknown) => Promise<void>) =>
          callback(client),
      },
    );
    const storage = { remove: jest.fn().mockResolvedValue(undefined) };
    const service = new IndemnityTemplateService(
      { getClient: () => client } as any,
      storage as any,
    );

    await service.remove("meet-1");

    expect(values.whereIn).toHaveBeenCalledWith("meta_definition_id", [
      "pdf-1",
    ]);
    expect(definitions.whereIn).toHaveBeenCalledWith("id", ["pdf-1"]);
    expect(definitions.del).toHaveBeenCalledTimes(1);
    expect(legacyTemplate.del).toHaveBeenCalledTimes(1);
    expect(pdf.del).toHaveBeenCalledTimes(1);
    expect(storage.remove).toHaveBeenCalledWith("form.pdf");

    meet.first.mockResolvedValueOnce({ indemnity_pdfs_id: "pdf-1" });
    pdf.first.mockResolvedValueOnce({ object_key: "form.pdf" });
    values.first.mockResolvedValueOnce({ meta_definition_id: "pdf-1" });
    await expect(service.remove("meet-1")).rejects.toThrow(
      "Cannot remove a form after attendees have answered it",
    );
    expect(definitions.del).toHaveBeenCalledTimes(1);
    expect(legacyTemplate.del).toHaveBeenCalledTimes(1);
  });

  it("keeps a PDF used by a cloned meet when the original removes it", async () => {
    const meets = {
      where: jest.fn().mockReturnThis(),
      forUpdate: jest.fn().mockReturnThis(),
      first: jest
        .fn()
        .mockResolvedValueOnce({ indemnity_pdfs_id: "pdf-1" })
        .mockResolvedValueOnce({ id: "cloned-meet" }),
      update: jest.fn().mockResolvedValue(1),
    };
    const pdfs = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ object_key: "shared.pdf" }),
      del: jest.fn(),
    };
    const legacy = {
      where: jest.fn().mockReturnThis(),
      del: jest.fn().mockResolvedValue(1),
    };
    const definitions = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([]),
    };
    const client = Object.assign(
      (table: string) => {
        if (table === "meets") return meets;
        if (table === "indemnity_pdfs") return pdfs;
        if (table === "meet_indemnity_templates") return legacy;
        return definitions;
      },
      {
        transaction: async (callback: (trx: unknown) => Promise<void>) =>
          callback(client),
      },
    );
    const storage = { remove: jest.fn() };
    const service = new IndemnityTemplateService(
      { getClient: () => client } as any,
      storage as any,
    );

    await service.remove("original-meet");

    expect(meets.update).toHaveBeenCalledWith({ indemnity_pdfs_id: null });
    expect(legacy.del).toHaveBeenCalledTimes(1);
    expect(pdfs.del).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it("stores an attendee-specific PDF filled from persisted answers", async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    pdf.getForm().createTextField("CampActivity").addToPage(page);
    pdf.getForm().createTextField("Child full name").addToPage(page);
    pdf.getForm().createTextField("Scout group").addToPage(page);
    pdf.getForm().createTextField("Allergies").addToPage(page);
    const template = Buffer.from(await pdf.save());
    const makeQuery = (result?: unknown) => ({
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(result),
      select: jest.fn().mockResolvedValue(result),
      insert: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      merge: jest.fn().mockResolvedValue(undefined),
    });
    const queries = {
      "meets as m": makeQuery({
        object_key: "template.pdf",
        filename: "consent.pdf",
      }),
      meet_meta_definitions: makeQuery([
        {
          id: "field-1",
          label: "Does your child have allergies?",
          pdf_form_field_id: "Allergies",
          config: { source: "indemnity-pdf", pdfFieldName: "Old name" },
        },
      ]),
      meet_meta_values: makeQuery([
        { meta_definition_id: "field-1", value: "None" },
      ]),
      meet_attendee_attachments: makeQuery(undefined),
      organizations: makeQuery({ name: "MCSA Cape Town" }),
    };
    const client = Object.assign(
      (table: keyof typeof queries) => queries[table],
      { fn: { now: () => new Date() } },
    );
    const db = { getClient: () => client };
    const storage = {
      download: jest.fn().mockResolvedValue(template),
      upload: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn(),
    };
    const service = new IndemnityTemplateService(db as any, storage as any);

    const result = await service.createAttendeePdf(
      { id: "meet-1", name: "Mountain Hike", organizationId: "org-1" },
      { id: "attendee-1", name: "Child Example", isMinor: true },
    );
    const filled = (await PDFDocument.load(result!.content)).getForm();
    expect(filled.getTextField("CampActivity").getText()).toBe("Mountain Hike");
    expect(filled.getTextField("Child full name").getText()).toBe(
      "Child Example",
    );
    expect(filled.getTextField("Scout group").getText()).toBe("MCSA Cape Town");
    expect(filled.getTextField("Allergies").getText()).toBe("None");
    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringContaining("meets/meet-1/attendees/attendee-1/indemnity/"),
      result!.content,
    );
    expect(queries.meet_attendee_attachments.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        meet_id: "meet-1",
        attendee_id: "attendee-1",
        kind: "prefilled-indemnity",
      }),
    );
  });
});
