import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { UpdateAttendeeNotesAndTagsDto } from "./dto/update-attendee-notes-and-tags.dto";

@Injectable()
export class AttendeeTagsService {
  constructor(private readonly database: DatabaseService) {}

  async listMeetTags(meetId: string): Promise<string[]> {
    const rows = await this.database
      .getClient()("attendee_tags")
      .distinct("tag")
      .where({ meet_id: meetId })
      .orderBy("tag");
    return rows.map((row) => row.tag);
  }

  async listAttendeeTags(
    meetId: string,
    attendeeId: string,
  ): Promise<string[]> {
    await this.assertAttendeeInMeet(meetId, attendeeId);
    const rows = await this.database
      .getClient()("attendee_tags")
      .select("tag")
      .where({ meet_id: meetId, attendee_id: attendeeId })
      .orderBy("tag");
    return rows.map((row) => row.tag);
  }

  async getAttendeeNotesAndTags(meetId: string, attendeeId: string) {
    const attendee = await this.database
      .getClient()("meet_attendees")
      .where({ id: attendeeId, meet_id: meetId })
      .first("id", "notes");
    if (!attendee)
      throw new NotFoundException("Attendee not found in this meet");
    const tags = await this.listAttendeeTags(meetId, attendeeId);
    return { notes: attendee.notes ?? "", tags };
  }

  async updateNotesAndTags(
    meetId: string,
    attendeeId: string,
    input: UpdateAttendeeNotesAndTagsDto,
  ) {
    if (typeof input.notes !== "string" || input.notes.length > 10000) {
      throw new BadRequestException("Notes must be at most 10000 characters");
    }
    if (
      !Array.isArray(input.tags) ||
      input.tags.length > 100 ||
      input.tags.some((tag) => typeof tag !== "string")
    ) {
      throw new BadRequestException("Tags must be a list of up to 100 strings");
    }
    const tags = [...new Set(input.tags.map((tag) => tag.trim()))];
    if (tags.some((tag) => !tag || tag.length > 255)) {
      throw new BadRequestException(
        "Tags must be between 1 and 255 characters",
      );
    }
    const notes = input.notes.trim();
    await this.database.getClient().transaction(async (trx) => {
      const attendee = await trx("meet_attendees")
        .where({ id: attendeeId, meet_id: meetId })
        .forUpdate()
        .first("id");
      if (!attendee)
        throw new NotFoundException("Attendee not found in this meet");
      await trx("meet_attendees")
        .where({ id: attendeeId, meet_id: meetId })
        .update({ notes: notes || null });
      await trx("attendee_tags")
        .where({ meet_id: meetId, attendee_id: attendeeId })
        .del();
      if (tags.length) {
        await trx("attendee_tags").insert(
          tags.map((tag) => ({
            meet_id: meetId,
            attendee_id: attendeeId,
            tag,
          })),
        );
      }
    });
    return { notes, tags };
  }

  async createTag(
    meetId: string,
    attendeeId: string,
    input: string,
  ): Promise<string> {
    const tag = input.trim();
    if (!tag || tag.length > 255) {
      throw new BadRequestException("Tag must be between 1 and 255 characters");
    }
    await this.assertAttendeeInMeet(meetId, attendeeId);
    await this.database
      .getClient()("attendee_tags")
      .insert({ meet_id: meetId, attendee_id: attendeeId, tag })
      .onConflict(["attendee_id", "tag"])
      .ignore();
    return tag;
  }

  private async assertAttendeeInMeet(meetId: string, attendeeId: string) {
    const attendee = await this.database
      .getClient()("meet_attendees")
      .where({ id: attendeeId, meet_id: meetId })
      .first("id");
    if (!attendee)
      throw new NotFoundException("Attendee not found in this meet");
  }
}
