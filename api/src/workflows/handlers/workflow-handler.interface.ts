import { MeetDto } from "../../meets/dto/meet.dto";

export interface WorkflowContext {
  meet: MeetDto;
  organizationId: string;
  trigger: string;
}

export interface IWorkflowHandler {
  readonly actionType: string;
  execute(
    context: WorkflowContext,
    config: Record<string, unknown>,
    workflowId: string,
  ): Promise<void>;
}
