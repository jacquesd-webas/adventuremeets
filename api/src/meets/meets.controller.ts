import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { ApiBody, ApiHeader, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { MeetsService } from "./meets.service";
import { CreateMeetDto } from "./dto/create-meet.dto";
import { MeetDto } from "./dto/meet.dto";
import { UpdateMeetDto } from "./dto/update-meet.dto";
import { UpdateMeetStatusDto } from "./dto/update-meet-status.dto";
import { CreateMeetImageDto } from "./dto/create-meet-image.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public } from "../auth/decorators/public.decorator";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { EmailService } from "../email/email.service";
import { DatabaseService } from "../database/database.service";

@ApiTags("Meets")
@Controller("meets")
export class MeetsController {
  constructor(
    private readonly meetsService: MeetsService,
    private readonly emailService: EmailService,
    private readonly db: DatabaseService
  ) {}

  @Get()
  @ApiQuery({
    name: "view",
    required: false,
    type: String,
    description: "Filter view: reports, plan, all",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (1-based)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Page size (max 100)",
    example: 20,
  })
  findAll(
    @Query("view") view = "all",
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @User() user?: UserProfile & { organizationIds?: string[] | null }
  ) {
    const normalizedView = String(view || "all").toLowerCase();
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string, 10) || 20)
    );
    return this.meetsService.findAll(
      normalizedView,
      pageNum,
      limitNum,
      user?.organizationIds || []
    );
  }

  @Get("statuses")
  listStatuses() {
    return this.meetsService.listStatuses();
  }

  @Get(":id([0-9a-fA-F-]{36})")
  async findOne(
    @Param("id") id: string,
    @User() user?: UserProfile & { organizationIds?: string[] | null }
  ): Promise<MeetDto> {
    const meet = await this.meetsService.findOne(id);
    if (!meet) {
      throw new NotFoundException("Meet not found in your organizations");
    }
    if (
      user?.organizationIds &&
      meet.organizationId &&
      !user.organizationIds.includes(meet.organizationId)
    ) {
      throw new NotFoundException("Meet not found in your organizations");
    }
    return meet;
  }

  @Public()
  @Get(":code")
  findByShareCode(@Param("code") code: string): Promise<MeetDto> {
    const meet = this.meetsService.findOne(code);
    return meet;
  }

  @Post()
  create(@Body() dto: CreateMeetDto, @User() user?: UserProfile) {
    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }
    if (
      dto.organizationId &&
      !user.organizationIds?.includes(dto.organizationId)
    ) {
      throw new UnauthorizedException(
        "Cannot create a meet for an organization you do not belong to"
      );
    }
    const defaultOrgId =
      user.organizationIds && user.organizationIds.length > 0
        ? user.organizationIds[0]
        : null;
    if (!defaultOrgId) {
      throw new UnauthorizedException(
        "User does not belong to any organization"
      );
    }
    return this.meetsService.create({
      ...dto,
      organizerId: dto.organizerId || user.id,
      organizationId: dto.organizationId || defaultOrgId,
    });
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateMeetDto,
    @User() user?: UserProfile
  ) {
    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }
    const exisitngMeet = this.meetsService.findOne(id);
    if (!exisitngMeet) {
      throw new NotFoundException("Meet not found");
    }
    if (
      dto.organizationId &&
      !user.organizationIds?.includes(dto.organizationId)
    ) {
      throw new UnauthorizedException(
        "Cannot update a meet for an organization you do not belong to"
      );
    }
    return this.meetsService.update(id, dto);
  }

  @Patch(":id/status")
  @ApiHeader({ name: "x-api-key", required: false, description: "Worker API key (alternative to Authorization)" })
  updateStatus(@Param("id") id: string, @Body() dto: UpdateMeetStatusDto, @User() user?: UserProfile) {
    if (!user && !(process as any).env?.WORKER_API_KEY) {
      throw new UnauthorizedException("Unauthorized");
    }
    return this.meetsService.updateStatus(id, dto.statusId);
  }

  @Post(":id/images")
  @UseInterceptors(FileInterceptor("file"))
  addImage(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Body() dto: CreateMeetImageDto
  ) {
    if (!file) {
      throw new BadRequestException("Image file is required");
    }
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Only image uploads are allowed");
    }
    return this.meetsService.addImage(id, file, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.meetsService.remove(id);
  }

  @Post(":id/message")
  @ApiOperation({ summary: "Send a message to specific attendees" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        attendee_ids: { type: "array", items: { type: "string" } },
        text: { type: "string" },
        html: { type: "string" },
      },
      required: ["subject"],
    },
  })
  async messageAttendees(
    @Param("id") id: string,
    @Body()
    body: {
      subject: string;
      text?: string;
      html?: string;
      attendee_ids?: string[];
    },
    @User() user?: UserProfile
  ) {
    if (!process.env.MAIL_DOMAIN) {
      throw new BadRequestException("Mail domain is not configured");
    }
    if (!user) throw new UnauthorizedException("Unauthorized");
    const meet = await this.meetsService.findOne(id);
    if (!meet) throw new NotFoundException("Meet not found");
    if (
      meet.organizationId &&
      user.organizationIds &&
      !user.organizationIds.includes(meet.organizationId)
    ) {
      throw new UnauthorizedException("Forbidden");
    }
    if (!body.text && !body.html) {
      throw new BadRequestException("Either text or html content is required");
    }
    const db = this.db.getClient();
    const ids = Array.isArray(body.attendee_ids) ? body.attendee_ids : [];
    const recipients =
      ids.length > 0
        ? await db("meet_attendees")
            .where({ meet_id: id })
            .whereIn("id", ids)
            .pluck("email")
        : await db("meet_attendees")
            .where({ meet_id: id })
            .whereIn("status", ["confirmed", "checked-in", "attended"])
            .pluck("email");
    if (!recipients || recipients.length === 0) {
      throw new NotFoundException("No recipients found");
    }
    const fromAddress = meet.organizerName
      ? `Adventuremeets (${meet.organizerName}) <${meet.id}@${process.env.MAIL_DOMAIN}>`
      : `Adventuremeets <${meet.id}@${process.env.MAIL_DOMAIN}>`;
    await Promise.all(
      recipients.map((to) =>
        this.emailService.sendEmail({
          to,
          subject: body.subject,
          text: body.text ?? "",
          html: body.html ?? "",
          from: fromAddress,
        })
      )
    );
    return { status: "sent", count: recipients.length };
  }
}
