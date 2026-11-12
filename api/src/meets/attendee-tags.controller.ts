import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "../auth/auth.service";
import { User } from "../auth/decorators/user.decorator";
import { UserProfile } from "../users/dto/user-profile.dto";
import { MeetsService } from "./meets.service";
import { AttendeeTagsService } from "./attendee-tags.service";
import { CreateAttendeeTagDto } from "./dto/create-attendee-tag.dto";
import { UpdateAttendeeNotesAndTagsDto } from "./dto/update-attendee-notes-and-tags.dto";

@ApiTags("Meets")
@Controller("meets/:id([0-9a-fA-F-]{36})")
export class AttendeeTagsController {
  constructor(
    private readonly meets: MeetsService,
    private readonly auth: AuthService,
    private readonly tags: AttendeeTagsService,
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
      throw new ForbiddenException("Cannot manage attendees for this meet");
    }
    return meet;
  }

  @Get("tags")
  @ApiOperation({ summary: "List distinct attendee tags for a meet" })
  async listMeetTags(@Param("id") id: string, @User() user?: UserProfile) {
    await this.assertCanManage(id, user);
    return { tags: await this.tags.listMeetTags(id) };
  }

  @Get("attendees/:attendeeId/tags")
  @ApiOperation({ summary: "Get notes and tags for an attendee in a meet" })
  async listAttendeeTags(
    @Param("id") id: string,
    @Param("attendeeId") attendeeId: string,
    @User() user?: UserProfile,
  ) {
    await this.assertCanManage(id, user);
    return this.tags.getAttendeeNotesAndTags(id, attendeeId);
  }

  @Put("attendees/:attendeeId/tags")
  @ApiOperation({ summary: "Save notes and tags for an attendee" })
  async updateNotesAndTags(
    @Param("id") id: string,
    @Param("attendeeId") attendeeId: string,
    @Body() body: UpdateAttendeeNotesAndTagsDto,
    @User() user?: UserProfile,
  ) {
    await this.assertCanManage(id, user);
    return this.tags.updateNotesAndTags(id, attendeeId, body);
  }

  @Post("attendees/:attendeeId/tags")
  @ApiOperation({ summary: "Add a freeform tag to an attendee" })
  async createTag(
    @Param("id") id: string,
    @Param("attendeeId") attendeeId: string,
    @Body() body: CreateAttendeeTagDto,
    @User() user?: UserProfile,
  ) {
    await this.assertCanManage(id, user);
    return { tag: await this.tags.createTag(id, attendeeId, body.tag) };
  }
}
