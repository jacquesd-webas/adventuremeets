import { Injectable } from "@nestjs/common";
import { IWorkflowHandler } from "./handlers/workflow-handler.interface";

@Injectable()
export class WorkflowHandlerRegistry {
  private readonly handlers: IWorkflowHandler[] = [];

  register(handler: IWorkflowHandler) {
    this.handlers.push(handler);
  }

  getAll() {
    return this.handlers;
  }
}
