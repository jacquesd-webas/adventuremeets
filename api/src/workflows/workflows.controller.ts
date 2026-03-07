import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { WorkflowsService } from "./workflows.service";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { UpdateWorkflowDto } from "./dto/update-workflow.dto";

@ApiTags("Workflows")
@Controller(["organizations/:orgId/workflows", "organisations/:orgId/workflows"])
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async list(@Param("orgId") orgId: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();
    if (!this.authService.hasRole(user, orgId, "organizer")) {
      throw new ForbiddenException();
    }
    return { workflows: await this.workflowsService.listWorkflows(orgId) };
  }

  @Post()
  async create(
    @Param("orgId") orgId: string,
    @Body() dto: CreateWorkflowDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();
    if (!this.authService.hasRole(user, orgId, "organizer")) {
      throw new ForbiddenException();
    }
    return { workflow: await this.workflowsService.createWorkflow(orgId, dto) };
  }

  @Patch(":workflowId")
  async update(
    @Param("orgId") orgId: string,
    @Param("workflowId") workflowId: string,
    @Body() dto: UpdateWorkflowDto,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();
    if (!this.authService.hasRole(user, orgId, "organizer")) {
      throw new ForbiddenException();
    }
    return {
      workflow: await this.workflowsService.updateWorkflow(orgId, workflowId, dto),
    };
  }

  @Delete(":workflowId")
  async remove(
    @Param("orgId") orgId: string,
    @Param("workflowId") workflowId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();
    if (!this.authService.hasRole(user, orgId, "organizer")) {
      throw new ForbiddenException();
    }
    return this.workflowsService.deleteWorkflow(orgId, workflowId);
  }
}
