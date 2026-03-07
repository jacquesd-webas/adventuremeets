import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { MeetsService } from "../meets/meets.service";
import { WorkflowsService } from "../workflows/workflows.service";
import { ExpenseSubmissionsService } from "./expense-submissions.service";

@ApiTags("Expense Submissions")
@Controller("meets/:meetId/expense-submissions")
export class ExpenseSubmissionsController {
  constructor(
    private readonly expenseSubmissionsService: ExpenseSubmissionsService,
    private readonly meetsService: MeetsService,
    private readonly workflowsService: WorkflowsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List expense submissions for a meet" })
  async list(
    @Param("meetId") meetId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();
    const meet = await this.meetsService.findOne(meetId);
    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException();
    }
    return {
      submissions: await this.expenseSubmissionsService.listForMeet(meetId),
    };
  }

  @Get("workflow-tasks")
  @ApiOperation({ summary: "List pending workflow tasks for a meet" })
  async listPendingTasks(
    @Param("meetId") meetId: string,
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();
    const meet = await this.meetsService.findOne(meetId);
    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException();
    }
    return {
      tasks: await this.workflowsService.listPendingTasksForMeet(meetId),
    };
  }

  @Post()
  @ApiOperation({ summary: "Submit expenses for a meet" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("attachments", 10))
  async create(
    @Param("meetId") meetId: string,
    @Body()
    body: {
      workflowTaskId: string;
      notes?: string;
    },
    @UploadedFiles() files: Express.Multer.File[] = [],
    @User() user?: UserProfile,
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(meetId);
    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException();
    }

    if (!body.workflowTaskId) {
      throw new BadRequestException("workflowTaskId is required");
    }

    const tasks = await this.workflowsService.listPendingTasksForMeet(meetId);
    const task = tasks.find((t) => t.id === body.workflowTaskId);
    if (!task) {
      throw new NotFoundException("Workflow task not found or already completed");
    }

    const submission = await this.expenseSubmissionsService.create(
      meetId,
      meet.organizationId!,
      body.workflowTaskId,
      user.id,
      body.notes,
      files,
    );

    return { submission };
  }
}
