import { Module, OnModuleInit } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { MeetsModule } from "../meets/meets.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { WorkflowHandlerRegistry } from "../workflows/workflow-handler.registry";
import { MinioService } from "../storage/minio.service";
import { ExpenseSubmissionsService } from "./expense-submissions.service";
import { ExpenseSubmissionsController } from "./expense-submissions.controller";
import { ExpenseSubmissionHandler } from "../workflows/handlers/expense-submission.handler";

@Module({
  imports: [DatabaseModule, AuthModule, MeetsModule, WorkflowsModule],
  controllers: [ExpenseSubmissionsController],
  providers: [ExpenseSubmissionsService, MinioService, ExpenseSubmissionHandler],
})
export class ExpenseSubmissionsModule implements OnModuleInit {
  constructor(
    private readonly registry: WorkflowHandlerRegistry,
    private readonly handler: ExpenseSubmissionHandler,
  ) {}

  onModuleInit() {
    this.registry.register(this.handler);
  }
}
