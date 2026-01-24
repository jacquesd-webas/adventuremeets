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
  Headers,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { MeetsService } from "./meets.service";
import { CreateMeetDto } from "./dto/create-meet.dto";
import { MeetDto } from "./dto/meet.dto";
import { UpdateMeetDto } from "./dto/update-meet.dto";
import { UpdateMeetStatusDto } from "./dto/update-meet-status.dto";
import { CreateMeetImageDto } from "./dto/create-meet-image.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public } from "../auth/decorators/public.decorator";
import { User } from "../auth/decorators/user.decorator";
import { AuthService } from "../auth/auth.service";
import { UserProfile } from "../users/dto/user-profile.dto";
import { EmailService } from "../email/email.service";
import { DatabaseService } from "../database/database.service";

@ApiTags("Meets")
@Controller("meets")
export class MeetsController {
  private readonly logger = new Logger(MeetsController.name);

  constructor(
    private readonly meetsService: MeetsService,
    private readonly emailService: EmailService,
    private readonly db: DatabaseService,
    private readonly authService: AuthService
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
  async findAll(
    @Query("view") view = "all",
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();

    const normalizedView = String(view || "all").toLowerCase();
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string, 10) || 20)
    );

    return await this.meetsService.findAll(
      normalizedView,
      pageNum,
      limitNum,
      this.authService.getUserOrganizationIds(user)
    );
  }

  @Get("statuses")
  async listStatuses() {
    return await this.meetsService.listStatuses();
  }

  @Get(":id([0-9a-fA-F-]{36})")
  async findOne(
    @Param("id") id: string,
    @User() user?: UserProfile
  ): Promise<MeetDto> {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(id);
    if (!meet) {
      throw new NotFoundException("Meet not found in your organizations");
    }
    if (!this.authService.hasRole(user, meet.organizationId!, "member")) {
      throw new NotFoundException("Meet not found in your organizations");
    }
    return meet;
  }

  @Public()
  @Get(":code")
  async findByShareCode(@Param("code") code: string): Promise<MeetDto> {
    const meet = await this.meetsService.findOne(code);
    if (!meet) throw new NotFoundException("Meet not found");
    return meet;
  }

  @Public()
  @Get(":code/:attendeeId([0-9a-fA-F-]{36})")
  async findAttendeeStatus(
    @Param("code") code: string,
    @Param("attendeeId") attendeeId: string
  ) {
    const attendee = await this.meetsService.findAttendeeStatus(
      code,
      attendeeId
    );
    if (!attendee) throw new NotFoundException("Meet attendee not found");
    return attendee;
  }

  @Post()
  async create(@Body() dto: CreateMeetDto, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    // Set default organizationId if user belongs to only one organization
    const organizerOrgIds = this.authService.getUserOrganizationIds(
      user,
      "organizer"
    );
    if (!dto.organizationId && organizerOrgIds.length === 1) {
      dto.organizationId = organizerOrgIds[0];
    }
    if (!dto.organizationId) {
      throw new BadRequestException(
        "Must specify organizationId when belonging to multiple organizations"
      );
    }
    if (!this.authService.hasRole(user, dto.organizationId, "organizer")) {
      throw new ForbiddenException(
        "Cannot create a meet for an organization you do not belong to as an organizer"
      );
    }

    return await this.meetsService.create({
      ...dto,
      organizerId: dto.organizerId || user.id,
      organizationId: dto.organizationId,
    });
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateMeetDto,
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(id);
    if (!meet) throw new NotFoundException("Meet not found");

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "Cannot update a meet for an organization you do not belong to as an organizer"
      );
    }

    return this.meetsService.update(id, dto);
  }

  @Patch(":id/status")
  @ApiHeader({
    name: "x-api-key",
    required: false,
    description: "Worker API key (alternative to Authorization)",
  })
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateMeetStatusDto,
    @Headers("x-api-key") apiKey?: string,
    @User() user?: UserProfile
  ) {
    // Shortcut the entire process as worker API can do anything
    if (apiKey && apiKey === process.env.WORKER_API_KEY) {
      return await this.meetsService.updateStatus(id, dto.statusId);
    }

    // Otherwise authorize normally
    if (!user) throw new UnauthorizedException("Unauthorized");

    const meet = await this.meetsService.findOne(id);
    if (!meet) throw new NotFoundException("Meet not found");

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "Cannot update a meet for an organization you do not belong to as an organizer"
      );
    }

    return await this.meetsService.updateStatus(id, dto.statusId);
  }

  @Post(":id/images")
  @UseInterceptors(FileInterceptor("file"))
  async addImage(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Body() dto: CreateMeetImageDto,
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(id);
    if (!meet) throw new NotFoundException("Meet not found");

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "Cannot add an image to a meet for an organisation you do not belong to as an organizer"
      );
    }

    if (!file) {
      throw new BadRequestException("Image file is required");
    }
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Only image uploads are allowed");
    }
    return this.meetsService.addImage(id, file, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @User() user?: UserProfile) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(id);
    if (!meet) throw new NotFoundException("Meet not found");

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "Cannot delete a meet for an organisation you do not belong to as an organizer"
      );
    }
    return this.meetsService.remove(id);
  }

  @Post(":id/message")
  @ApiOperation({ summary: "Send a message to specific attendees" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        attendeeIds: { type: "array", items: { type: "string" } },
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
      attendeeIds?: string[];
    },
    @User() user?: UserProfile
  ) {
    if (!user) throw new UnauthorizedException();

    const meet = await this.meetsService.findOne(id);
    if (!meet) throw new NotFoundException("Meet not found");

    if (!this.authService.hasRole(user, meet.organizationId!, "organizer")) {
      throw new ForbiddenException(
        "You do not have permission to message attendees of this meet"
      );
    }

    // Sanity check
    if (!body.text && !body.html) {
      throw new BadRequestException("Either text or html content is required");
    }
    if (!process.env.MAIL_DOMAIN) {
      throw new BadRequestException("Mail is not enabled");
    }

    if (!body.attendeeIds || body.attendeeIds.length === 0) {
      throw new BadRequestException("At least one attendee ID is required");
    }

    const fromAddress = meet.organizerName
      ? `Adventuremeets (${meet.organizerName}) <${meet.id}@${process.env.MAIL_DOMAIN}>`
      : `Adventuremeets <${meet.id}@${process.env.MAIL_DOMAIN}>`;

    const recipients: string[] = await Promise.all(
      body.attendeeIds.map(async (a) => {
        const attendedContactInfo =
          await this.meetsService.getAttendeeContactById(a);
        return attendedContactInfo ? (attendedContactInfo.email as string) : "";
      })
    );

    if (!recipients || recipients.length === 0) {
      throw new BadRequestException(
        "No recipients email addresses found for attendees"
      );
    }

    if (recipients.find((r) => !r)) {
      throw new BadRequestException(
        "One or more attendees do not have email addresses"
      );
    }

    // Send all the emails (just skip any nulls it's fine)
    await Promise.all(
      recipients.map((to) => {
        if (!to) {
          this.logger.warn(`Skipping email to empty address for meet ${id}`);
          return;
        }
        return this.emailService.sendEmail({
          to,
          subject: body.subject,
          text: body.text ?? "",
          html: body.html ?? "",
          from: fromAddress,
        });
      })
    );

    await this.meetsService.updateAttendeesNotified(id, body.attendeeIds);
    return { status: "sent", count: recipients.length };
  }
}
