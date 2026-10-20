import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { AuthService } from "../auth/auth.service";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { MEET_STATUS } from "./constants/meet-status.enum";
import {
  IndemnityTemplateService,
  UploadedPdf,
} from "./indemnity-template.service";
import { MeetsService } from "./meets.service";

@Controller("meets/:id([0-9a-fA-F-]{36})/indemnity-template")
export class IndemnityTemplateController {
  constructor(
    private readonly meets: MeetsService,
    private readonly auth: AuthService,
    private readonly templates: IndemnityTemplateService,
  ) {}

  private async assertCanManage(id: string, user?: UserProfile) {
    if (!user) throw new UnauthorizedException();
    const meet = await this.meets.findOne(id);
    if (!meet) throw new NotFoundException("Meet not found");
    if (
      !this.auth.hasRole(user, meet.organizationId!, "organizer") ||
      (!this.auth.hasRole(user, meet.organizationId!, "admin") &&
        user.id !== meet.organizerId)
    ) {
      throw new ForbiddenException("Cannot manage this meet's indemnity form");
    }
    return meet;
  }

  @Get()
  async get(@Param("id") id: string, @User() user?: UserProfile) {
    await this.assertCanManage(id, user);
    return this.templates.get(id);
  }

  @Get("preview")
  async preview(
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response,
    @User() user?: UserProfile,
  ) {
    await this.assertCanManage(id, user);
    const pdf = await this.templates.getPreview(id);
    if (!pdf) throw new NotFoundException("Indemnity form not found");
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", "inline");
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    return new StreamableFile(pdf);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async upload(
    @Param("id") id: string,
    @UploadedFile() file: UploadedPdf,
    @User() user?: UserProfile,
  ) {
    const meet = await this.assertCanManage(id, user);
    if (
      meet.statusId !== MEET_STATUS.Draft &&
      meet.statusId !== MEET_STATUS.Published
    ) {
      throw new BadRequestException(
        "The indemnity form can only be changed before applications open",
      );
    }
    if (!file) throw new BadRequestException("Choose a PDF form to upload");
    return this.templates.upload(id, file);
  }

  @Delete()
  async remove(@Param("id") id: string, @User() user?: UserProfile) {
    const meet = await this.assertCanManage(id, user);
    if (
      meet.statusId !== MEET_STATUS.Draft &&
      meet.statusId !== MEET_STATUS.Published
    ) {
      throw new BadRequestException(
        "The indemnity form can only be changed before applications open",
      );
    }
    await this.templates.remove(id);
    return { deleted: true };
  }
}
