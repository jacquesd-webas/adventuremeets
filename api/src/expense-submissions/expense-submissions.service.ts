import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { MinioService } from "../storage/minio.service";
import { v4 as uuid } from "uuid";

@Injectable()
export class ExpenseSubmissionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly minio: MinioService,
  ) {}

  async create(
    meetId: string,
    organizationId: string,
    workflowTaskId: string,
    submittedBy: string,
    notes: string | undefined,
    files: Express.Multer.File[],
  ) {
    const now = new Date().toISOString();

    const submission = await this.db.getClient().transaction(async (trx) => {
      const [row] = await trx("expense_submissions")
        .insert({
          meet_id: meetId,
          organization_id: organizationId,
          workflow_task_id: workflowTaskId,
          submitted_by: submittedBy,
          notes: notes ?? null,
          status: "submitted",
          submitted_at: now,
          created_at: now,
          updated_at: now,
        })
        .returning("*");

      if (files.length > 0) {
        const attachments = await Promise.all(
          files.map(async (file) => {
            const extension = file.mimetype.split("/")[1] || "bin";
            const objectKey = `expense-submissions/${row.id}/${uuid()}.${extension}`;
            const uploaded = await this.minio.upload(
              objectKey,
              file.buffer,
              file.mimetype,
            );
            return {
              expense_submission_id: row.id,
              object_key: uploaded.objectKey,
              url: uploaded.url,
              filename: file.originalname,
              content_type: file.mimetype,
              size_bytes: file.size,
              created_at: now,
            };
          }),
        );
        await trx("expense_attachments").insert(attachments);
      }

      return row;
    });

    await this.db
      .getClient()("meet_workflow_tasks")
      .where({ id: workflowTaskId })
      .update({ status: "completed", updated_at: new Date().toISOString() });

    return this.findOne(submission.id);
  }

  async findOne(id: string) {
    const submission = await this.db
      .getClient()("expense_submissions")
      .where({ id })
      .first();
    if (!submission) throw new NotFoundException("Expense submission not found");

    const attachments = await this.db
      .getClient()("expense_attachments")
      .where({ expense_submission_id: id })
      .select("id", "url", "filename", "content_type", "size_bytes", "created_at");

    return this.toDto(submission, attachments);
  }

  async listForMeet(meetId: string) {
    const submissions = await this.db
      .getClient()("expense_submissions")
      .where({ meet_id: meetId })
      .orderBy("submitted_at", "desc");

    const ids = submissions.map((s: any) => s.id);
    const attachments =
      ids.length > 0
        ? await this.db
            .getClient()("expense_attachments")
            .whereIn("expense_submission_id", ids)
            .select(
              "id",
              "expense_submission_id",
              "url",
              "filename",
              "content_type",
              "size_bytes",
              "created_at",
            )
        : [];

    const bySubmission = attachments.reduce<Record<string, any[]>>(
      (acc, a: any) => {
        if (!acc[a.expense_submission_id]) acc[a.expense_submission_id] = [];
        acc[a.expense_submission_id].push(a);
        return acc;
      },
      {},
    );

    return submissions.map((s: any) =>
      this.toDto(s, bySubmission[s.id] ?? []),
    );
  }

  private toDto(submission: Record<string, any>, attachments: any[]) {
    return {
      id: submission.id,
      meetId: submission.meet_id,
      organizationId: submission.organization_id,
      workflowTaskId: submission.workflow_task_id,
      submittedBy: submission.submitted_by,
      notes: submission.notes ?? undefined,
      status: submission.status,
      submittedAt: submission.submitted_at,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at,
      attachments: attachments.map((a) => ({
        id: a.id,
        url: a.url,
        filename: a.filename,
        contentType: a.content_type,
        sizeBytes: a.size_bytes,
        createdAt: a.created_at,
      })),
    };
  }
}
