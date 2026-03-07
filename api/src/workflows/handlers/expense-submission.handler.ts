import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import {
  IWorkflowHandler,
  WorkflowContext,
} from "./workflow-handler.interface";

@Injectable()
export class ExpenseSubmissionHandler implements IWorkflowHandler {
  readonly actionType = "expense_submission";

  constructor(private readonly db: DatabaseService) {}

  async execute(
    context: WorkflowContext,
    config: Record<string, unknown>,
    workflowId: string,
  ): Promise<void> {
    const { meet, organizationId } = context;

    await this.db.getClient()("meet_workflow_tasks").insert({
      meet_id: meet.id,
      organization_id: organizationId,
      workflow_id: workflowId,
      workflow_type: this.actionType,
      status: "pending",
      payload: {
        meetName: meet.name,
        meetLocation: meet.location ?? null,
        meetLocationLat: meet.locationLat ?? null,
        meetLocationLng: meet.locationLong ?? null,
        config,
      },
    });
  }
}
