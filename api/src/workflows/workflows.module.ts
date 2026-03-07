import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { WorkflowsService } from "./workflows.service";
import { WorkflowsController } from "./workflows.controller";
import { WorkflowHandlerRegistry } from "./workflow-handler.registry";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowHandlerRegistry],
  exports: [WorkflowsService, WorkflowHandlerRegistry],
})
export class WorkflowsModule {}
