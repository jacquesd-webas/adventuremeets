import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DatabaseService } from "../database/database.service";
import { MeetDto } from "../meets/dto/meet.dto";
import { WorkflowContext } from "./handlers/workflow-handler.interface";
import { WorkflowHandlerRegistry } from "./workflow-handler.registry";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { UpdateWorkflowDto } from "./dto/update-workflow.dto";

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly registry: WorkflowHandlerRegistry,
  ) {}

  @OnEvent("meet.report_generated")
  async onReportGenerated(payload: { meet: MeetDto }) {
    await this.dispatch(payload.meet, "meet.report_generated");
  }

  private async dispatch(meet: MeetDto, trigger: string) {
    if (!meet.organizationId) return;

    const workflows = await this.db
      .getClient()("organization_workflows")
      .where({
        organization_id: meet.organizationId,
        trigger,
        enabled: true,
      });

    for (const workflow of workflows) {
      const handler = this.registry.getAll().find(
        (h) => h.actionType === workflow.action_type,
      );
      if (!handler) {
        this.logger.warn(`No handler for action_type: ${workflow.action_type}`);
        continue;
      }
      const context: WorkflowContext = {
        meet,
        organizationId: meet.organizationId,
        trigger,
      };
      try {
        await handler.execute(context, workflow.config ?? {}, workflow.id);
      } catch (err) {
        this.logger.error(
          `Workflow ${workflow.id} (${workflow.action_type}) failed for meet ${meet.id}`,
          err,
        );
      }
    }
  }

  async listWorkflows(orgId: string) {
    const rows = await this.db
      .getClient()("organization_workflows")
      .where({ organization_id: orgId })
      .orderBy("created_at", "asc");
    return rows.map(this.toDto);
  }

  async createWorkflow(orgId: string, dto: CreateWorkflowDto) {
    const now = new Date().toISOString();
    const [row] = await this.db
      .getClient()("organization_workflows")
      .insert({
        organization_id: orgId,
        name: dto.name,
        trigger: dto.trigger,
        action_type: dto.actionType,
        config: dto.config ?? {},
        enabled: dto.enabled ?? true,
        created_at: now,
        updated_at: now,
      })
      .returning("*");
    return this.toDto(row);
  }

  async updateWorkflow(orgId: string, workflowId: string, dto: UpdateWorkflowDto) {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.enabled !== undefined) updates.enabled = dto.enabled;
    if (dto.config !== undefined) updates.config = dto.config;

    const [row] = await this.db
      .getClient()("organization_workflows")
      .where({ id: workflowId, organization_id: orgId })
      .update(updates)
      .returning("*");
    if (!row) throw new NotFoundException("Workflow not found");
    return this.toDto(row);
  }

  async deleteWorkflow(orgId: string, workflowId: string) {
    const deleted = await this.db
      .getClient()("organization_workflows")
      .where({ id: workflowId, organization_id: orgId })
      .del();
    if (!deleted) throw new NotFoundException("Workflow not found");
    return { deleted: true };
  }

  async listPendingTasksForMeet(meetId: string) {
    const rows = await this.db
      .getClient()("meet_workflow_tasks")
      .where({ meet_id: meetId, status: "pending" })
      .orderBy("created_at", "asc");
    return rows.map(this.toTaskDto);
  }

  async dismissTask(meetId: string, taskId: string) {
    const [row] = await this.db
      .getClient()("meet_workflow_tasks")
      .where({ id: taskId, meet_id: meetId })
      .update({ status: "dismissed", updated_at: new Date().toISOString() })
      .returning("*");
    if (!row) throw new NotFoundException("Task not found");
    return this.toTaskDto(row);
  }

  async completeTask(taskId: string) {
    await this.db
      .getClient()("meet_workflow_tasks")
      .where({ id: taskId })
      .update({ status: "completed", updated_at: new Date().toISOString() });
  }

  private toDto(row: Record<string, any>) {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      trigger: row.trigger,
      actionType: row.action_type,
      config: row.config ?? {},
      enabled: row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toTaskDto(row: Record<string, any>) {
    return {
      id: row.id,
      meetId: row.meet_id,
      organizationId: row.organization_id,
      workflowId: row.workflow_id,
      workflowType: row.workflow_type,
      status: row.status,
      payload: row.payload ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
