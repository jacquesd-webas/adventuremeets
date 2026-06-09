import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { DatabaseService } from "../database/database.service";
import {
  CreateMeetDto,
  MeetMetaDefinitionInputDto,
} from "./dto/create-meet.dto";
import { MeetDto } from "./dto/meet.dto";
import { MeetImageDto } from "./dto/meet-image.dto";
import { CreateMeetAttendeeDto } from "./dto/create-meet-attendee.dto";
import { UpdateMeetDto } from "./dto/update-meet.dto";
import { UpdateMeetAttendeeDto } from "./dto/update-meet-attendee.dto";
import { CreateMeetImageDto } from "./dto/create-meet-image.dto";
import { UpdateMeetImageDto } from "./dto/update-meet-image.dto";
import { CreateWallItemDto } from "./dto/create-wall-item.dto";
import { MinioService } from "../storage/minio.service";
import { detectMeetImageAspect } from "./image-aspect";
import { v4 as uuid } from "uuid";
import { MEET_STATUS } from "./constants/meet-status.enum";
import { type WallItemReaction } from "./dto/update-wall-item-reaction.dto";
import { WallItemDto } from "./dto/wall-item.dto";

@Injectable()
export class MeetsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly minio: MinioService,
  ) {}

  private buildAttendeeIdentityKey(attendee: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  }) {
    const name = attendee.name?.trim().toLowerCase() ?? "";
    const email = attendee.email?.trim().toLowerCase() ?? "";
    const phone = attendee.phone?.trim() ?? "";
    return `${name}::${email}::${phone}`;
  }

  private isAttendeeDuplicateError(error: any) {
    return (
      error?.code === "23505" &&
      error?.constraint === "meet_attendees_meet_id_user_id_non_minor_unique"
    );
  }

  private async computeAutoPlacementStatus(
    trx: any,
    meetId: string,
    meet: { capacity: any; waitlist_size: any },
  ): Promise<"confirmed" | "waitlisted" | "rejected"> {
    const capacity = meet.capacity == null ? null : Number(meet.capacity);
    const waitlistSize =
      meet.waitlist_size == null ? 0 : Number(meet.waitlist_size);

    const capacityUnlimited = capacity == null || capacity <= 0;
    if (capacityUnlimited) return "confirmed";

    const counts = await trx("meet_attendees")
      .where({ meet_id: meetId })
      .first(
        trx.raw(
          `sum(case when status in ('confirmed', 'checked-in', 'attended') then 1 + coalesce(guests, 0) else 0 end) as confirmed_count`,
        ),
        trx.raw(
          `sum(case when status = 'waitlisted' then 1 + coalesce(guests, 0) else 0 end) as waitlist_count`,
        ),
      );

    const confirmedCount =
      counts && (counts as any).confirmed_count != null
        ? Number((counts as any).confirmed_count)
        : 0;
    const waitlistedCount =
      counts && (counts as any).waitlist_count != null
        ? Number((counts as any).waitlist_count)
        : 0;

    if (confirmedCount < capacity) return "confirmed";
    if (waitlistSize > 0 && waitlistedCount < waitlistSize) return "waitlisted";
    return "rejected";
  }

  private static readonly shareCodeChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  async findAll(
    view = "all",
    page = 1,
    limit = 20,
    organizationIds: string[] = [],
    isOrganizer = false,
    userId?: string,
    startDate: Date | null = null,
    endDate: Date | null = null,
    search: string | null = null,
    scope: "all" | "my" | null = null,
  ) {
    let memberCanViewAllMeets = false;
    if (!isOrganizer && organizationIds.length > 0) {
      const organizations = await this.db
        .getClient()("organizations")
        .whereIn("id", organizationIds)
        .select("id", "can_view_all_meets");
      memberCanViewAllMeets = organizations.some(
        (organization: any) => organization.can_view_all_meets,
      );
    }

    const attendeeCounts = this.db
      .getClient()("meet_attendees")
      .select("meet_id")
      .select(
        this.db
          .getClient()
          .raw(`sum(1 + coalesce(guests, 0)) as attendee_count`),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status = 'waitlisted' then 1 + coalesce(guests, 0) else 0 end) as waitlist_count`,
          ),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status in ('confirmed', 'checked-in', 'attended') then 1 + coalesce(guests, 0) else 0 end) as confirmed_count`,
          ),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status in ('checked-in', 'attended') then 1 + coalesce(guests, 0) else 0 end) as checked_in_count`,
          ),
      )
      .groupBy("meet_id")
      .as("ma");

    const query = this.db
      .getClient()("meets as m")
      .leftJoin(attendeeCounts, "ma.meet_id", "m.id")
      .modify((builder) => {
        if (!userId) return;
        builder.leftJoin("meet_attendees as ua", function () {
          this.on("ua.meet_id", "=", "m.id").andOn(
            "ua.user_id",
            "=",
            builder.client.raw("?", [userId]),
          );
        });
      })
      .select(
        "m.*",
        this.db
          .getClient()
          .raw(
            "(select url from meet_images where meet_id = m.id and is_primary = true order by created_at desc, id desc limit 1) as primary_image_url",
          ),
        this.db
          .getClient()
          .raw("coalesce(ma.attendee_count, 0) as attendee_count"),
        this.db
          .getClient()
          .raw("coalesce(ma.confirmed_count, 0) as confirmed_count"),
        this.db
          .getClient()
          .raw("coalesce(ma.waitlist_count, 0) as waitlist_count"),
        this.db
          .getClient()
          .raw("coalesce(ma.checked_in_count, 0) as checked_in_count"),
        userId
          ? this.db.getClient().raw("ua.status as my_attendee_status")
          : this.db.getClient().raw("null as my_attendee_status"),
      );

    const totalQuery = this.db
      .getClient()("meets")
      .count<{ count: string }[]>("* as count");

    const effectiveScope =
      scope ?? (view === "my" || view === "all" ? view : "all");
    const effectiveView = view === "my" ? "all" : view;

    // If the user is not an organizer, only show meets they are attending or meets that are open
    if (effectiveScope === "my") {
      query.where((qb) => {
        qb.where("m.organizer_id", userId!);
        qb.orWhereExists(function () {
          this.select("*")
            .from("meet_attendees as ma2")
            .whereRaw("ma2.meet_id = m.id")
            .andWhere("ma2.user_id", userId!);
        });
      });
    } else if (!isOrganizer && !memberCanViewAllMeets) {
      query.where((qb) => {
        qb.whereExists(function () {
          this.select("*")
            .from("meet_attendees as ma2")
            .whereRaw("ma2.meet_id = m.id")
            .andWhere("ma2.user_id", userId!);
        });
        qb.orWhere((statusBuilder) => {
          statusBuilder.where("m.status_id", MEET_STATUS.Published);
          statusBuilder.orWhere("m.status_id", MEET_STATUS.Open);
        });
      });
    }

    if (effectiveView === "upcoming") {
      query.where("start_time", ">=", new Date().toISOString());
      query.whereNotIn("status_id", [MEET_STATUS.Draft, MEET_STATUS.Cancelled]);
      query.orderBy("start_time", "asc");
      totalQuery.where("start_time", ">=", new Date().toISOString());
      totalQuery.whereNotIn("status_id", [
        MEET_STATUS.Draft,
        MEET_STATUS.Cancelled,
      ]);
    }
    if (effectiveView === "past") {
      query.where("start_time", "<", new Date().toISOString());
      query.whereNotIn("status_id", [MEET_STATUS.Draft, MEET_STATUS.Cancelled]);
      query.orderBy("start_time", "desc");
      totalQuery.where("start_time", "<", new Date().toISOString());
      totalQuery.whereNotIn("status_id", [
        MEET_STATUS.Draft,
        MEET_STATUS.Cancelled,
      ]);
    }
    if (effectiveView === "draft") {
      query.where("status_id", MEET_STATUS.Draft);
      totalQuery.where("status_id", MEET_STATUS.Draft);
      query.orderBy("updated_at", "desc");
    }
    if (effectiveView === "calendar") {
      query.whereNotIn("status_id", [MEET_STATUS.Draft]);
      totalQuery.whereNotIn("status_id", [MEET_STATUS.Draft]);
      query.orderBy("start_time", "asc");
    }
    if (!isOrganizer && memberCanViewAllMeets) {
      query.where("m.status_id", "!=", MEET_STATUS.Draft);
      totalQuery.where("status_id", "!=", MEET_STATUS.Draft);
    }
    if (organizationIds.length > 0) {
      query.whereIn("m.organization_id", organizationIds);
      totalQuery.whereIn("organization_id", organizationIds);
    }
    if (!isOrganizer && !memberCanViewAllMeets) {
      query.where("m.is_hidden", false);
      totalQuery.where("is_hidden", false);
    }
    if (effectiveView === "calendar") {
      if (startDate) {
        query.whereRaw("coalesce(m.end_time, m.start_time) >= ?", [
          startDate.toISOString(),
        ]);
        totalQuery.whereRaw("coalesce(end_time, start_time) >= ?", [
          startDate.toISOString(),
        ]);
      }
      if (endDate) {
        query.where("m.start_time", "<=", endDate.toISOString());
        totalQuery.where("start_time", "<=", endDate.toISOString());
      }
    } else {
      if (startDate) {
        query.where("start_time", ">=", startDate.toISOString());
        totalQuery.where("start_time", ">=", startDate.toISOString());
      }
      if (endDate) {
        query.where("start_time", "<=", endDate.toISOString());
        totalQuery.where("start_time", "<=", endDate.toISOString());
      }
    }
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      query.where((qb) => {
        qb.whereRaw("lower(m.name) like ?", [like])
          .orWhereRaw("lower(m.description) like ?", [like])
          .orWhereRaw("lower(m.location) like ?", [like]);
      });
      totalQuery.where((qb) => {
        qb.whereRaw("lower(name) like ?", [like])
          .orWhereRaw("lower(description) like ?", [like])
          .orWhereRaw("lower(location) like ?", [like]);
      });
    }
    const [{ count }] = await totalQuery;
    const total = Number(count);
    const meets = await query.limit(limit).offset((page - 1) * limit);
    const dtoMeets = meets.map((item: any) => this.toMeetDto(item, []));
    return { meets: dtoMeets, total, page, limit };
  }

  async findOne(idOrCode: string, userId?: string): Promise<MeetDto> {
    const attendeeCounts = this.db
      .getClient()("meet_attendees")
      .select("meet_id")
      .select(
        this.db
          .getClient()
          .raw(`sum(1 + coalesce(guests, 0)) as attendee_count`),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status = 'waitlisted' then 1 + coalesce(guests, 0) else 0 end) as waitlist_count`,
          ),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status in ('confirmed', 'checked-in', 'attended') then 1 + coalesce(guests, 0) else 0 end) as confirmed_count`,
          ),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status in ('checked-in', 'attended') then 1 + coalesce(guests, 0) else 0 end) as checked_in_count`,
          ),
      )
      .groupBy("meet_id")
      .as("ma");
    let query = this.db
      .getClient()("meets as m")
      .leftJoin("users as u", "u.id", "m.organizer_id")
      .leftJoin(attendeeCounts, "ma.meet_id", "m.id")
      .leftJoin("currencies as c", "c.id", "m.currency_id")
      .modify((builder) => {
        if (!userId) return;
        builder.leftJoin("meet_attendees as ua", function () {
          this.on("ua.meet_id", "=", "m.id").andOn(
            "ua.user_id",
            "=",
            builder.client.raw("?", [userId]),
          );
        });
      })
      .select(
        "m.*",
        "c.symbol as currency_symbol",
        "c.code as currency_code",
        this.db
          .getClient()
          .raw("coalesce(ma.attendee_count, 0) as attendee_count"),
        this.db
          .getClient()
          .raw("coalesce(ma.confirmed_count, 0) as confirmed_count"),
        this.db
          .getClient()
          .raw("coalesce(ma.waitlist_count, 0) as waitlist_count"),
        this.db
          .getClient()
          .raw("coalesce(ma.checked_in_count, 0) as checked_in_count"),
        this.db
          .getClient()
          .raw(
            `concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, '')) as organizer_name`,
          ),
        "u.first_name as organizer_first_name",
        "u.last_name as organizer_last_name",
        "u.email as organizer_email",
        "u.phone as organizer_phone",
        userId
          ? this.db.getClient().raw("ua.status as my_attendee_status")
          : this.db.getClient().raw("null as my_attendee_status"),
      );

    if (idOrCode.match(/^[0-9a-fA-F-]{36}$/)) {
      query = query.where("m.id", idOrCode);
    } else {
      query = query.where("m.share_code", idOrCode);
    }
    const meet = await query.first();
    if (!meet) {
      throw new NotFoundException("Meet not found");
    }
    const images = await this.db
      .getClient()("meet_images")
      .where({ meet_id: meet.id })
      .orderBy([
        { column: "is_primary", order: "desc" },
        { column: "created_at", order: "desc" },
        { column: "id", order: "desc" },
      ])
      .select("*");
    const metaDefinitions = await this.db
      .getClient()("meet_meta_definitions")
      .where({ meet_id: meet.id })
      .orderBy("position", "asc")
      .select(
        "id",
        "field_key",
        "label",
        "field_type",
        "required",
        "position",
        "config",
      );
    const meetWithImage = {
      ...meet,
      image_url: images[0]?.url ?? meet.image_url ?? undefined,
    };
    const attendingAttendees =
      userId && this.isGoingAttendeeStatus(meet.my_attendee_status)
        ? await this.listAttendingAttendeePreviews(meet.id)
        : undefined;
    return this.toMeetDto(
      meetWithImage,
      metaDefinitions,
      images,
      attendingAttendees,
    );
  }

  async create(dto: CreateMeetDto) {
    const now = new Date().toISOString();
    const currencyId = await this.resolveCurrencyId(
      dto.currencyId,
      dto.currencyCode,
    );
    const statusId = dto.statusId ?? 1;
    const shareCode = this.generateShareCode(12);
    const created = await this.db.getClient().transaction(async (trx) => {
      const [meet] = await trx("meets").insert(
        this.toDbRecord(
          { ...dto, currencyId, statusId, shareCode },
          null,
          now,
        ),
        ["*"],
      );
      if (dto.metaDefinitions) {
        await this.syncMetaDefinitions(trx, meet.id, dto.metaDefinitions);
      }
      if (dto.organizerId) {
        await this.addOrganizerAsAttendee(trx, meet.id, dto.organizerId, now);
      }
      return meet;
    });
    return created;
  }

  async clone(id: string, dto?: { name?: string; organizerId?: string }) {
    const now = new Date().toISOString();
    const shareCode = this.generateShareCode(12);

    return this.db.getClient().transaction(async (trx) => {
      const sourceMeet = await trx("meets").where({ id }).first("*");
      if (!sourceMeet) {
        throw new NotFoundException("Meet not found");
      }

      const sourceMetaDefinitions = await trx("meet_meta_definitions")
        .where({ meet_id: id })
        .orderBy("position", "asc")
        .select("field_key", "label", "field_type", "required", "config");

      const sourceImages = await trx("meet_images")
        .where({ meet_id: id })
        .orderBy([
          { column: "created_at", order: "asc" },
          { column: "id", order: "asc" },
        ])
        .select(
          "object_key",
          "url",
          "content_type",
          "size_bytes",
          "aspect",
          "is_primary",
        );

      const clonedRecord = {
        ...sourceMeet,
        id: undefined,
        name: dto?.name?.trim() || sourceMeet.name,
        organizer_id: dto?.organizerId || sourceMeet.organizer_id,
        share_code: shareCode,
        checkin_pin: sourceMeet.checkin_pin ? this.generateCheckinPin() : null,
        status_id: MEET_STATUS.Draft,
        start_time: null,
        end_time: null,
        opening_date: null,
        closing_date: null,
        scheduled_date: null,
        confirm_date: null,
        created_at: now,
        updated_at: now,
      };

      const [clonedMeet] = await trx("meets").insert(clonedRecord, ["*"]);

      if (sourceMetaDefinitions.length > 0) {
        await this.syncMetaDefinitions(
          trx,
          clonedMeet.id,
          sourceMetaDefinitions.map((definition) => ({
            fieldKey: definition.field_key,
            label: definition.label,
            fieldType: definition.field_type,
            required: definition.required,
            config: definition.config ?? {},
          })),
        );
      }

      if (sourceImages.length > 0) {
        await trx("meet_images").insert(
          sourceImages.map((image) => ({
            meet_id: clonedMeet.id,
            object_key: image.object_key,
            url: image.url,
            content_type: image.content_type,
            size_bytes: image.size_bytes,
            aspect: image.aspect,
            is_primary: image.is_primary,
            created_at: now,
          })),
        );
      }

      const organizerId = dto?.organizerId || sourceMeet.organizer_id;
      if (organizerId) {
        await this.addOrganizerAsAttendee(trx, clonedMeet.id, organizerId, now);
      }

      return clonedMeet;
    });
  }

  async update(id: string, dto: UpdateMeetDto) {
    const currencyId = await this.resolveCurrencyId(
      dto.currencyId,
      dto.currencyCode,
    );
    const updated = await this.db.getClient().transaction(async (trx) => {
      const existingMeet = await trx("meets").where({ id }).first("*");
      if (!existingMeet) {
        throw new NotFoundException("Meet not found");
      }
      const updatedRows = (await trx("meets")
        .where({ id })
        .update(
          this.toDbRecord({ ...dto, currencyId }, existingMeet),
          ["*"],
        )) as unknown;
      const meet = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
      if (dto.metaDefinitions) {
        await this.syncMetaDefinitions(trx, id, dto.metaDefinitions);
      }
      return meet as any;
    });
    return updated;
  }

  async updateStatus(id: string, statusId: number) {
    const updates: Record<string, any> = {
      status_id: statusId,
      updated_at: new Date().toISOString(),
    };
    if (statusId === MEET_STATUS.Open) {
      updates.opening_date = null;
      updates.closing_date = null;
    }
    const updatedRows = (await this.db
      .getClient()("meets")
      .where({ id })
      .update(updates, ["*"])) as unknown;
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
    if (!updated) {
      throw new NotFoundException("Meet not found");
    }
    return updated as any;
  }

  async resetConfirmedAttendeesToInvited(
    meetId: string,
    organizerId?: string | null,
  ) {
    const query = this.db.getClient()("meet_attendees").where({
      meet_id: meetId,
      status: "confirmed",
    });

    if (organizerId) {
      query.andWhere((builder) => {
        builder.whereNull("user_id").orWhereNot("user_id", organizerId);
      });
    }

    const updated = await query.update({
      status: "invited",
      updated_at: new Date().toISOString(),
    });

    return { updated };
  }

  async remove(id: string) {
    const deleted = await this.db.getClient()("meets").where({ id }).del();
    if (!deleted) {
      throw new NotFoundException("Meet not found");
    }
    return { deleted: true };
  }

  async listStatuses() {
    const statuses = await this.db
      .getClient()("meet_statuses")
      .select("id", "name")
      .orderBy("id", "asc");
    return { statuses };
  }

  // This method can be called without authentication if the user has the share code and attendee ID
  // so do not share info that should be private
  async findAttendeeStatus(idOrCode: string, attendeeId: string) {
    const meet = await this.findOne(idOrCode);
    const attendee = await this.db
      .getClient()("meet_attendees")
      .select("id", "status")
      .where({ meet_id: meet.id, id: attendeeId })
      .first();
    if (!attendee) {
      throw new NotFoundException("Attendee not found");
    }
    const attendingAttendees = this.isGoingAttendeeStatus(attendee.status)
      ? await this.listAttendingAttendeePreviews(meet.id)
      : undefined;
    return {
      attendee: this.toAttendeeDto(attendee),
      attendingAttendees,
    };
  }

  async findAttendeeForEdit(idOrCode: string, attendeeId: string) {
    const meet = await this.findOne(idOrCode);
    const attendee = await this.db
      .getClient()("meet_attendees")
      .select(
        "id",
        "user_id",
        "status",
        "email",
        "phone",
        "name",
        "guests",
        "guest_of",
        "is_minor",
        "guardian_name",
        "indemnity_accepted",
        "indemnity_minors",
      )
      .where({ meet_id: meet.id, id: attendeeId })
      .first();
    if (!attendee) {
      throw new NotFoundException("Attendee not found");
    }
    const metaValues = await this.db
      .getClient()("meet_meta_values as mv")
      .join("meet_meta_definitions as md", "md.id", "mv.meta_definition_id")
      .where("mv.attendee_id", attendeeId)
      .select("md.field_key", "mv.value");
    return {
      attendee: {
        ...this.toAttendeeDto(attendee),
        metaValues: metaValues.map((row: any) => ({
          fieldKey: row.field_key,
          value: row.value,
        })),
      },
    };
  }

  async attendeeHasMissingFields(meetId: string, attendeeId: string) {
    const meet = await this.findOne(meetId);
    if (!meet) {
      throw new NotFoundException("Meet not found");
    }

    const { attendee } = await this.findAttendeeForEdit(meetId, attendeeId);
    if (!attendee) {
      throw new NotFoundException("Attendee not found");
    }

    if (
      !attendee.name?.trim() ||
      !attendee.email?.trim() ||
      !attendee.phone?.trim()
    ) {
      return true;
    }

    if (meet.hasIndemnity && !attendee.indemnityAccepted) {
      return true;
    }

    const metaValuesByKey = new Map(
      (attendee.metaValues || []).map((item) => [item.fieldKey, item.value]),
    );

    return (meet.metaDefinitions || []).some((definition) => {
      if (!definition.required) return false;

      const value = metaValuesByKey.get(definition.fieldKey);
      if (
        definition.fieldType === "checkbox" ||
        definition.fieldType === "switch"
      ) {
        return value !== "true";
      }

      return value === undefined || value === null || value === "";
    });
  }

  async getAttendeeContactById(attendeeId: string) {
    const attendee = await this.db
      .getClient()("meet_attendees")
      .where({ id: attendeeId })
      .first("email", "phone", "name");
    if (!attendee) {
      throw new NotFoundException("Attendee not found");
    }
    return attendee;
  }

  async listAttendees(meetId: string, filter?: string) {
    const attendeesQuery = this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId });
    if (filter === "accepted") {
      attendeesQuery.whereIn("status", ["confirmed", "checked-in", "attended"]);
    }
    const attendees = await attendeesQuery
      .orderBy([
        { column: "sequence", order: "asc" },
        { column: "created_at", order: "asc" },
      ])
      .select("*");
    const metaDefinitions = await this.db
      .getClient()("meet_meta_definitions")
      .where({ meet_id: meetId })
      .orderBy("position", "asc")
      .select("id", "label", "field_type", "required", "position", "config");
    const metaValues = await this.db
      .getClient()("meet_meta_values")
      .where({ meet_id: meetId })
      .select("attendee_id", "meta_definition_id", "value");
    const valuesByAttendee = metaValues.reduce<
      Record<string, Record<string, string>>
    >((acc, value) => {
      if (!acc[value.attendee_id]) {
        acc[value.attendee_id] = {};
      }
      acc[value.attendee_id][value.meta_definition_id] = value.value;
      return acc;
    }, {});
    const attendeesWithValues = attendees.map((attendee) => ({
      ...this.toAttendeeDto(attendee),
      metaValues: metaDefinitions.map((definition) => ({
        definitionId: definition.id,
        label: definition.label,
        fieldType: definition.field_type,
        required: definition.required,
        position: definition.position,
        config: definition.config ?? undefined,
        value: valuesByAttendee[attendee.id]?.[definition.id] ?? null,
      })),
    }));
    return { attendees: attendeesWithValues };
  }

  async getReportData(meetId: string) {
    const attendees = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId })
      .orderBy([
        { column: "sequence", order: "asc" },
        { column: "created_at", order: "asc" },
      ])
      .select("*");
    const metaDefinitions = await this.db
      .getClient()("meet_meta_definitions")
      .where({ meet_id: meetId })
      .orderBy("position", "asc")
      .select("id", "label", "field_type", "required", "position", "config");
    const metaValues = await this.db
      .getClient()("meet_meta_values")
      .where({ meet_id: meetId })
      .select("attendee_id", "meta_definition_id", "value");
    const valuesByAttendee = metaValues.reduce<
      Record<string, Record<string, string>>
    >((acc, value) => {
      if (!acc[value.attendee_id]) {
        acc[value.attendee_id] = {};
      }
      acc[value.attendee_id][value.meta_definition_id] = value.value;
      return acc;
    }, {});
    const attendeesWithValues = attendees.map((attendee) => ({
      ...this.toAttendeeDto(attendee),
      metaValues: metaDefinitions.map((definition) => ({
        definitionId: definition.id,
        label: definition.label,
        fieldType: definition.field_type,
        required: definition.required,
        position: definition.position,
        config: definition.config ?? undefined,
        value: valuesByAttendee[attendee.id]?.[definition.id] ?? null,
      })),
    }));
    return { attendees: attendeesWithValues, metaDefinitions };
  }

  async getOrganizerEmail(meetId: string) {
    const organizer = await this.db
      .getClient()("meets as m")
      .leftJoin("users as u", "u.id", "m.organizer_id")
      .where("m.id", meetId)
      .select("u.email")
      .first();
    return organizer?.email ?? null;
  }

  async findAttendeeByContact(
    meetId: string,
    email?: string,
    phone?: string,
    options?: { includeInvited?: boolean },
  ) {
    if (!email && !phone) {
      throw new BadRequestException("Email or phone is required");
    }
    const query = this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId });
    if (options?.includeInvited === false) {
      query.andWhereNot("status", "invited");
    }
    if (email && phone) {
      query.andWhere((builder) => {
        builder
          .whereRaw("lower(email) = ?", [email.toLowerCase()])
          .orWhere({ phone });
      });
    } else if (email) {
      query.andWhereRaw("lower(email) = ?", [email.toLowerCase()]);
    } else if (phone) {
      query.andWhere({ phone });
    }
    const attendee = await query.first();
    return { attendee: attendee ? this.toAttendeeDto(attendee) : null };
  }

  async findPreviousAnswers(
    userId: string,
    meetId: string,
    trx?: any,
  ): Promise<Record<string, string>> {
    const db = trx ?? this.db.getClient();
    const definitions = await db("meet_meta_definitions")
      .where({ meet_id: meetId })
      .select("field_key");
    const fieldKeys = definitions.map(
      (definition: any) => definition.field_key,
    );
    if (!fieldKeys.length) {
      return {};
    }
    const rows = (await db("meet_meta_values as mv")
      .join("meet_meta_definitions as md", "md.id", "mv.meta_definition_id")
      .join("meet_attendees as ma", "ma.id", "mv.attendee_id")
      .where("ma.user_id", userId)
      .whereIn("md.field_key", fieldKeys)
      .orderBy("mv.updated_at", "desc")
      .orderBy("mv.created_at", "desc")
      .select("md.field_key", "mv.value")) as Array<{
      field_key: string;
      value: string;
    }>;
    return rows.reduce<Record<string, string>>((acc, row) => {
      if (!acc[row.field_key]) {
        acc[row.field_key] = row.value;
      }
      return acc;
    }, {});
  }

  async addAttendee(
    meetId: string,
    dto: CreateMeetAttendeeDto,
    context?: { ip?: string; userAgent?: string; locale?: string },
  ) {
    try {
      const created = await this.db.getClient().transaction(async (trx) => {
        const guardianName =
          dto.GuardianName ?? (dto as any).guardianName ?? null;
        const acceptedByName =
          dto.isMinor && guardianName ? guardianName : (dto.name ?? null);
        const contactEmail = dto.email?.trim() || undefined;
        const contactPhone = dto.phone?.trim() || undefined;

        if (contactEmail || contactPhone) {
          const invitedQuery = trx("meet_attendees")
            .where({ meet_id: meetId })
            .andWhere("status", "invited");
          if (contactEmail && contactPhone) {
            invitedQuery.andWhere((builder) => {
              builder
                .whereRaw("lower(email) = ?", [contactEmail.toLowerCase()])
                .orWhere({ phone: contactPhone });
            });
          } else if (contactEmail) {
            invitedQuery.andWhereRaw("lower(email) = ?", [
              contactEmail.toLowerCase(),
            ]);
          } else if (contactPhone) {
            invitedQuery.andWhere({ phone: contactPhone });
          }
          const candidates = await invitedQuery.select(
            "id",
            "name",
            "email",
            "phone",
            "user_id",
          );
          const normalizedName = (dto.name || "").trim().toLowerCase();
          let invited = candidates.length === 1 ? candidates[0] : undefined;
          if (!invited && dto.isMinor && normalizedName && candidates.length) {
            const nameMatches = candidates.filter(
              (row) =>
                row.name && row.name.trim().toLowerCase() === normalizedName,
            );
            if (nameMatches.length === 1) {
              invited = nameMatches[0];
            }
          }
          if (!invited && contactPhone && candidates.length) {
            const phoneMatches = candidates.filter(
              (row) => row.phone && row.phone === contactPhone,
            );
            if (phoneMatches.length === 1) {
              invited = phoneMatches[0];
            }
          }
          if (invited) {
            const [row] = await trx("meet_attendees")
              .where({ meet_id: meetId, id: invited.id })
              .update(
                {
                  user_id: dto.userId ?? invited.user_id ?? null,
                  name: dto.name ?? invited.name,
                  phone: dto.phone ?? invited.phone,
                  email: dto.email ?? invited.email,
                  guests: dto.guests ?? invited.guests ?? null,
                  is_minor: dto.isMinor ?? invited.is_minor ?? false,
                  guardian_name: guardianName,
                  indemnity_accepted: dto.indemnityAccepted ?? null,
                  indemnity_minors: dto.indemnityMinors ?? null,
                  status: "confirmed",
                  updated_at: new Date().toISOString(),
                },
                ["*"],
              );
            if (dto.metaValues) {
              await trx("meet_meta_values")
                .where({ meet_id: meetId, attendee_id: invited.id })
                .del();
              const records = dto.metaValues
                .filter(
                  (value) =>
                    value.value !== undefined &&
                    value.value !== null &&
                    value.value !== "",
                )
                .map((value) => ({
                  meet_id: meetId,
                  attendee_id: invited.id,
                  meta_definition_id: value.definitionId,
                  value: value.value,
                }));
              if (records.length > 0) {
                await trx("meet_meta_values").insert(records);
              }
            }
            if (dto.indemnityAccepted) {
              const meet = await trx("meets")
                .where({ id: meetId })
                .first("indemnity", "time_zone");
              const indemnityText = meet?.indemnity ?? "";
              const indemnityHash = indemnityText
                ? createHash("sha256").update(indemnityText).digest("hex")
                : null;
              await trx("meet_attendee_indemnity_acceptances").insert({
                attendee_id: invited.id,
                meet_id: meetId,
                accepted_at: new Date().toISOString(),
                indemnity_text_hash: indemnityHash,
                acceptance_ip: context?.ip ?? null,
                acceptance_user_agent: context?.userAgent ?? null,
                accepted_by_name: acceptedByName,
                accepted_by_email: dto.email ?? null,
                accepted_by_phone: dto.phone ?? null,
                locale: context?.locale ?? null,
                time_zone: meet?.time_zone ?? null,
              });
            }
            return row;
          }
        }

        // Lock the meet row so capacity/waitlist decisions are race-safe.
        const meet = await trx("meets")
          .where({ id: meetId })
          .forUpdate()
          .first("capacity", "waitlist_size", "auto_placement");
        if (!meet) {
          throw new NotFoundException("Meet not found");
        }

        let status: "pending" | "confirmed" | "waitlisted" | "rejected" =
          "pending";
        if (meet.auto_placement !== false) {
          status = await this.computeAutoPlacementStatus(trx, meetId, meet);
        }

        const sequenceRow = await trx("meet_attendees")
          .where({ meet_id: meetId })
          .max("sequence as max")
          .first();
        const maxSequence =
          sequenceRow && (sequenceRow as any).max != null
            ? Number((sequenceRow as any).max)
            : 0;
        const nextSequence = Number.isFinite(maxSequence) ? maxSequence + 1 : 1;
        const [attendee] = await trx("meet_attendees").insert(
          {
            meet_id: meetId,
            user_id: dto.userId ?? null,
            name: dto.name ?? null,
            phone: dto.phone ?? null,
            email: dto.email ?? null,
            guests: dto.guests ?? null,
            guest_of: dto.guestOf ?? null,
            sequence: nextSequence,
            is_minor: dto.isMinor ?? false,
            guardian_name: guardianName,
            indemnity_accepted: dto.indemnityAccepted ?? null,
            indemnity_minors: dto.indemnityMinors ?? null,
            status,
          },
          ["*"],
        );
        if (dto.indemnityAccepted) {
          const meet = await trx("meets")
            .where({ id: meetId })
            .first("indemnity", "time_zone");
          const indemnityText = meet?.indemnity ?? "";
          const indemnityHash = indemnityText
            ? createHash("sha256").update(indemnityText).digest("hex")
            : null;
          await trx("meet_attendee_indemnity_acceptances").insert({
            attendee_id: attendee.id,
            meet_id: meetId,
            accepted_at: new Date().toISOString(),
            indemnity_text_hash: indemnityHash,
            acceptance_ip: context?.ip ?? null,
            acceptance_user_agent: context?.userAgent ?? null,
            accepted_by_name: acceptedByName,
            accepted_by_email: dto.email ?? null,
            accepted_by_phone: dto.phone ?? null,
            locale: context?.locale ?? null,
            time_zone: meet?.time_zone ?? null,
          });
        }
        if (dto.metaValues && dto.metaValues.length > 0) {
          const records = dto.metaValues
            .filter(
              (value) =>
                value.value !== undefined &&
                value.value !== null &&
                value.value !== "",
            )
            .map((value) => ({
              meet_id: meetId,
              attendee_id: attendee.id,
              meta_definition_id: value.definitionId,
              value: value.value,
            }));
          if (records.length > 0) {
            await trx("meet_meta_values").insert(records);
          }
        }
        return attendee;
      });
      return { attendee: this.toAttendeeDto(created) };
    } catch (error: any) {
      if (this.isAttendeeDuplicateError(error)) {
        throw new ConflictException(
          "This user is already signed up for this meet",
        );
      }
      throw error;
    }
  }

  async autoPlaceAttendees(meetId: string, attendeeId: string) {
    const updated = await this.db.getClient().transaction(async (trx) => {
      // Lock the meet row so placements are consistent under concurrency.
      const meet = await trx("meets")
        .where({ id: meetId })
        .forUpdate()
        .first("capacity", "waitlist_size", "auto_placement");
      if (!meet) {
        throw new NotFoundException("Meet not found");
      }

      const existing = await trx("meet_attendees")
        .where({ meet_id: meetId, id: attendeeId })
        .first("*");
      if (!existing) {
        throw new NotFoundException("Attendee not found");
      }

      if (meet.auto_placement === false || existing.status !== "pending") {
        return existing;
      }

      const status = await this.computeAutoPlacementStatus(trx, meetId, meet);
      const [row] = await trx("meet_attendees")
        .where({ meet_id: meetId, id: attendeeId })
        .update(
          {
            status,
            updated_at: new Date().toISOString(),
          },
          ["*"],
        );
      return row ?? existing;
    });

    return { attendee: this.toAttendeeDto(updated) };
  }

  async addInvitedAttendees(
    meetId: string,
    attendees: Array<{
      name: string;
      email: string;
      phone: string;
      metaValues?: Array<{ definitionId: string; value: string }>;
    }>,
  ) {
    if (!attendees.length) return { created: 0, skipped: 0 };
    return this.db.getClient().transaction(async (trx) => {
      const existingAttendees = await trx("meet_attendees")
        .where({ meet_id: meetId })
        .select("name", "email", "phone");
      const seenIdentityKeys = new Set(
        existingAttendees.map((attendee: any) =>
          this.buildAttendeeIdentityKey(attendee),
        ),
      );
      const sequenceRow = await trx("meet_attendees")
        .where({ meet_id: meetId })
        .max("sequence as max")
        .first();
      const maxSequence =
        sequenceRow && (sequenceRow as any).max != null
          ? Number((sequenceRow as any).max)
          : 0;
      let nextSequence = Number.isFinite(maxSequence) ? maxSequence + 1 : 1;
      const metaRecords: Array<{
        meet_id: string;
        attendee_id: string;
        meta_definition_id: string;
        value: string;
      }> = [];
      let created = 0;
      let skipped = 0;
      for (const attendee of attendees) {
        const identityKey = this.buildAttendeeIdentityKey(attendee);
        if (seenIdentityKeys.has(identityKey)) {
          skipped += 1;
          continue;
        }
        seenIdentityKeys.add(identityKey);
        const [row] = await trx("meet_attendees").insert(
          {
            meet_id: meetId,
            user_id: null,
            name: attendee.name,
            phone: attendee.phone,
            email: attendee.email,
            status: "invited",
            sequence: nextSequence,
            is_minor: false,
          },
          ["id"],
        );
        nextSequence += 1;
        created += 1;
        if (attendee.metaValues?.length) {
          attendee.metaValues
            .filter(
              (value) =>
                value.value !== undefined &&
                value.value !== null &&
                String(value.value).trim() !== "",
            )
            .forEach((value) => {
              metaRecords.push({
                meet_id: meetId,
                attendee_id: row.id,
                meta_definition_id: value.definitionId,
                value: String(value.value),
              });
            });
        }
      }
      if (metaRecords.length) {
        await trx("meet_meta_values").insert(metaRecords);
      }
      return { created, skipped };
    });
  }

  async updateAttendee(
    meetId: string,
    attendeeId: string,
    dto: UpdateMeetAttendeeDto,
    options?: { resetCancelledToPending?: boolean },
  ) {
    try {
      const updated = await this.db.getClient().transaction(async (trx) => {
        const guardianName =
          dto.GuardianName ?? (dto as any).guardianName ?? undefined;
        let statusOverride: string | undefined;
        if (options?.resetCancelledToPending) {
          const existing = await trx("meet_attendees")
            .where({ meet_id: meetId, id: attendeeId })
            .first("status");
          if (existing?.status === "cancelled") {
            statusOverride = "pending";
          }
        }
        const [row] = await trx("meet_attendees")
          .where({ meet_id: meetId, id: attendeeId })
          .update(
            {
              name: dto.name,
              phone: dto.phone,
              email: dto.email,
              guests: dto.guests,
              is_minor: dto.isMinor,
              guardian_name: guardianName,
              indemnity_accepted: dto.indemnityAccepted,
              indemnity_minors: dto.indemnityMinors,
              status: statusOverride ?? dto.status,
              user_id: dto.userId,
              paid_full_at: dto.paidFullAt,
              paid_deposit_at: dto.paidDepositAt,
              updated_at: new Date().toISOString(),
            },
            ["*"],
          );
        if (!row) {
          throw new NotFoundException("Attendee not found");
        }
        if (dto.metaValues) {
          await trx("meet_meta_values")
            .where({ meet_id: meetId, attendee_id: attendeeId })
            .del();
          const records = dto.metaValues
            .filter(
              (value) =>
                value.value !== undefined &&
                value.value !== null &&
                value.value !== "",
            )
            .map((value) => ({
              meet_id: meetId,
              attendee_id: attendeeId,
              meta_definition_id: value.definitionId,
              value: value.value,
            }));
          if (records.length > 0) {
            await trx("meet_meta_values").insert(records);
          }
        }
        return row;
      });
      return { attendee: this.toAttendeeDto(updated) };
    } catch (error: any) {
      if (this.isAttendeeDuplicateError(error)) {
        throw new ConflictException(
          "This user is already signed up for this meet",
        );
      }
      throw error;
    }
  }

  async updateAttendeesNotified(meetId: string, attendeeIds: string[]) {
    const updatedRows = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId })
      .whereIn("id", attendeeIds)
      .update({
        responded_at: new Date().toISOString(),
      });
    return { updated: updatedRows };
  }

  async listImages(meetId: string) {
    const images = await this.db
      .getClient()("meet_images")
      .where({ meet_id: meetId })
      .orderBy([
        { column: "is_primary", order: "desc" },
        { column: "created_at", order: "desc" },
        { column: "id", order: "desc" },
      ])
      .select("*");

    return {
      images: images.map((image) => this.toMeetImageDto(image)),
    };
  }

  async addImage(meetId: string, file: any, dto: CreateMeetImageDto) {
    const extension = file.mimetype.split("/")[1] || "jpg";
    const objectKey = `meets/${meetId}/${uuid()}.${extension}`;
    const aspect = detectMeetImageAspect(file.buffer);
    const uploaded = await this.minio.upload(
      objectKey,
      file.buffer,
      file.mimetype,
    );

    return this.db.getClient().transaction(async (trx) => {
      const existingPrimary = await trx("meet_images")
        .where({ meet_id: meetId, is_primary: true })
        .first("id");
      const shouldBePrimary = dto.isPrimary ?? !existingPrimary;

      if (shouldBePrimary) {
        await trx("meet_images")
          .where({ meet_id: meetId })
          .update({ is_primary: false });
      }

      const [created] = await trx("meet_images").insert(
        {
          meet_id: meetId,
          object_key: uploaded.objectKey,
          url: uploaded.url,
          content_type: file.mimetype,
          size_bytes: file.size,
          aspect,
          is_primary: shouldBePrimary,
          created_at: new Date().toISOString(),
        },
        ["*"],
      );

      return { image: this.toMeetImageDto(created) };
    });
  }

  async updateImage(meetId: string, imageId: string, dto: UpdateMeetImageDto) {
    return this.db.getClient().transaction(async (trx) => {
      const existing = await trx("meet_images")
        .where({ meet_id: meetId, id: imageId })
        .first("*");

      if (!existing) {
        throw new NotFoundException("Meet image not found");
      }

      if (dto.isPrimary === true) {
        await trx("meet_images")
          .where({ meet_id: meetId })
          .update({ is_primary: false });
      }

      const [updated] = await trx("meet_images")
        .where({ meet_id: meetId, id: imageId })
        .update(
          {
            is_primary:
              dto.isPrimary !== undefined ? dto.isPrimary : existing.is_primary,
          },
          ["*"],
        );

      return { image: this.toMeetImageDto(updated) };
    });
  }

  async removeImage(meetId: string, imageId: string) {
    let objectKeyToRemove: string | undefined;

    const result = await this.db.getClient().transaction(async (trx) => {
      const existing = await trx("meet_images")
        .where({ meet_id: meetId, id: imageId })
        .first("*");

      if (!existing) {
        throw new NotFoundException("Meet image not found");
      }

      objectKeyToRemove = existing.object_key ?? undefined;

      await trx("meet_images").where({ meet_id: meetId, id: imageId }).del();

      if (existing.is_primary) {
        const replacement = await trx("meet_images")
          .where({ meet_id: meetId })
          .orderBy([
            { column: "created_at", order: "desc" },
            { column: "id", order: "desc" },
          ])
          .first("id");

        if (replacement?.id) {
          await trx("meet_images")
            .where({ meet_id: meetId, id: replacement.id })
            .update({ is_primary: true });
        }
      }

      return { removed: true };
    });

    if (objectKeyToRemove) {
      await this.minio.remove(objectKeyToRemove);
    }

    return result;
  }

  async findMeetAttendeeByUser(meetId: string, userId: string) {
    const attendee = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId, user_id: userId })
      .first();
    return attendee ? this.toAttendeeDto(attendee) : null;
  }

  async findMeetAttendeeById(meetId: string, attendeeId: string) {
    const attendee = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId, id: attendeeId })
      .first();
    return attendee ? this.toAttendeeDto(attendee) : null;
  }

  async createWallItem(
    meetId: string,
    dto: CreateWallItemDto,
    file?: any,
    actor?: { userId?: string; attendeeId?: string | null },
  ) {
    const comment = dto.comment?.trim() || null;
    const stars =
      dto.stars === undefined || dto.stars === null ? null : Number(dto.stars);

    if (!comment && stars == null && !file) {
      throw new BadRequestException(
        "A comment, rating, or photo is required for a wall item",
      );
    }

    let uploaded:
      | {
          objectKey: string;
          url: string;
        }
      | undefined;
    let aspect: string | null = null;

    if (file) {
      const extension = this.getFileExtension(file.originalname);
      const objectKey = `wall/${meetId}/${uuid()}${extension}`;
      uploaded = await this.minio.upload(
        objectKey,
        file.buffer,
        file.mimetype || "application/octet-stream",
      );
      aspect = detectMeetImageAspect(file.buffer);
    }

    const [wallItem] = await this.db
      .getClient()("wall_item")
      .insert(
        {
          meet_id: meetId,
          created_by: actor?.userId ?? null,
          attendee_id: actor?.attendeeId ?? null,
          comment,
          stars,
          object_key: uploaded?.objectKey ?? null,
          url: uploaded?.url ?? null,
          content_type: file?.mimetype ?? null,
          size_bytes:
            file?.size === undefined || file?.size === null ? null : file.size,
          aspect,
        },
        ["*"],
      );

    return this.getWallItem(meetId, wallItem.id, actor);
  }

  async listWallItems(
    meetId: string,
    actor?: { userId?: string; attendeeId?: string | null },
  ) {
    const wallItems = await this.db
      .getClient()("wall_item as wi")
      .leftJoin("users as u", "u.id", "wi.created_by")
      .leftJoin("meet_attendees as ma", "ma.id", "wi.attendee_id")
      .where({ "wi.meet_id": meetId })
      .orderBy("wi.created_at", "desc")
      .orderBy("wi.id", "desc")
      .select(
        "wi.*",
        "u.first_name as author_first_name",
        "u.last_name as author_last_name",
        "u.email as author_email",
        "u.idp_profile as author_idp_profile",
        "ma.name as attendee_name",
      );

    if (!wallItems.length) {
      return { wallItems: [] as WallItemDto[] };
    }

    const likes = await this.db
      .getClient()("wall_item_likes")
      .whereIn(
        "wall_item_id",
        wallItems.map((wallItem: any) => wallItem.id),
      )
      .select("wall_item_id", "user_id", "attendee_id", "reaction");

    return {
      wallItems: wallItems.map((wallItem: any) =>
        this.toWallItemDto(wallItem, likes, actor),
      ),
    };
  }

  async updateWallItemFavourite(
    meetId: string,
    wallItemId: string,
    favourite: number,
  ) {
    const [wallItem] = await this.db
      .getClient()("wall_item")
      .where({ meet_id: meetId, id: wallItemId })
      .update({ favourite }, ["*"]);

    if (!wallItem) {
      throw new NotFoundException("Wall item not found");
    }

    return { wallItem: this.toWallItemDto(wallItem) };
  }

  async updateWallItemComment(
    meetId: string,
    wallItemId: string,
    comment: string,
    actor: { userId?: string; attendeeId?: string | null },
  ) {
    const trimmedComment = comment?.trim();

    if (!trimmedComment) {
      throw new BadRequestException("Comment is required");
    }

    const existingWallItem = await this.db
      .getClient()("wall_item")
      .where({ meet_id: meetId, id: wallItemId })
      .first();

    if (!existingWallItem) {
      throw new NotFoundException("Wall item not found");
    }

    const canEdit =
      (Boolean(actor.userId) && existingWallItem.created_by === actor.userId) ||
      (Boolean(actor.attendeeId) &&
        existingWallItem.attendee_id === actor.attendeeId);

    if (!canEdit) {
      throw new ForbiddenException(
        "You do not have permission to edit this wall item",
      );
    }

    await this.db
      .getClient()("wall_item")
      .where({ meet_id: meetId, id: wallItemId })
      .update({ comment: trimmedComment });

    return this.getWallItem(meetId, wallItemId, actor);
  }

  async orderWallItemFavourites(meetId: string, wallItemIds: string[]) {
    const existingIds = await this.db
      .getClient()("wall_item")
      .where({ meet_id: meetId })
      .whereIn("id", wallItemIds)
      .pluck<string>("id");

    if (existingIds.length !== wallItemIds.length) {
      throw new NotFoundException("One or more wall items were not found");
    }

    await this.db.getClient().transaction(async (trx) => {
      await trx("wall_item")
        .where({ meet_id: meetId })
        .where("favourite", ">", 0)
        .update({ favourite: 0 });

      for (const [index, wallItemId] of wallItemIds.entries()) {
        await trx("wall_item")
          .where({ meet_id: meetId, id: wallItemId })
          .update({ favourite: wallItemIds.length - index });
      }
    });

    const { wallItems } = await this.listWallItems(meetId);
    const favouriteIds = new Set(wallItemIds);
    return {
      wallItems: wallItems.filter((wallItem) => favouriteIds.has(wallItem.id)),
    };
  }

  async updateWallItemReaction(
    meetId: string,
    wallItemId: string,
    actor: { userId?: string; attendeeId?: string | null },
    reaction: WallItemReaction,
  ) {
    const wallItem = await this.db
      .getClient()("wall_item")
      .where({ meet_id: meetId, id: wallItemId })
      .first();

    if (!wallItem) {
      throw new NotFoundException("Wall item not found");
    }

    const userId = actor.userId ?? undefined;
    const attendeeId = actor.attendeeId ?? undefined;

    if (!userId && !attendeeId) {
      throw new NotFoundException("Reaction actor not found");
    }

    const likesQuery = this.db.getClient()("wall_item_likes").where({
      wall_item_id: wallItemId,
    });
    if (attendeeId) {
      likesQuery.andWhere({ attendee_id: attendeeId });
    } else if (userId) {
      likesQuery.andWhere({ user_id: userId });
    }

    const existing = await likesQuery.first("id");

    if (existing) {
      await this.db
        .getClient()("wall_item_likes")
        .where({ id: existing.id })
        .update({ reaction });
    } else {
      await this.db
        .getClient()("wall_item_likes")
        .insert(
          {
            wall_item_id: wallItemId,
            user_id: attendeeId ? null : (userId ?? null),
            attendee_id: attendeeId ?? null,
            reaction,
          },
          ["id"],
        );
    }

    return this.getWallItem(meetId, wallItemId, actor);
  }

  async removeWallItem(
    meetId: string,
    wallItemId: string,
    actor?: { userId?: string; attendeeId?: string | null; canAdminDelete?: boolean },
  ) {
    const wallItem = await this.db
      .getClient()("wall_item")
      .where({ meet_id: meetId, id: wallItemId })
      .first();

    if (!wallItem) {
      throw new NotFoundException("Wall item not found");
    }

    const canDelete =
      Boolean(actor?.canAdminDelete) ||
      (Boolean(actor?.userId) && wallItem.created_by === actor?.userId) ||
      (Boolean(actor?.attendeeId) && wallItem.attendee_id === actor?.attendeeId);

    if (!canDelete) {
      throw new ForbiddenException(
        "You do not have permission to remove this wall item",
      );
    }

    await this.db
      .getClient()("wall_item")
      .where({ meet_id: meetId, id: wallItemId })
      .del();

    return { deleted: true };
  }

  async removeAttendee(meetId: string, attendeeId: string) {
    const query = this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId, id: attendeeId });
    const deleted = await query.del();
    if (!deleted) {
      throw new NotFoundException("Attendee not found");
    }
    return { deleted: true };
  }

  private toDbRecord(
    dto: Partial<CreateMeetDto> & { shareCode?: string },
    existingMeet?: Record<string, any> | null,
    now?: string,
  ) {
    const record: any = {
      name: dto.name,
      description: dto.description,
      organizer_id: dto.organizerId,
      organization_id: dto.organizationId,
      location: dto.location === "" ? null : dto.location,
      location_lat:
        dto.useMap === false || dto.location === "" ? null : dto.locationLat,
      location_long:
        dto.useMap === false || dto.location === "" ? null : dto.locationLong,
      start_time: dto.startTime,
      end_time: dto.endTime,
      time_zone: dto.timeZone,
      opening_date: dto.openingDate,
      closing_date: dto.closingDate,
      scheduled_date: dto.scheduledDate,
      confirm_date: dto.confirmDate,
      capacity: dto.capacity,
      waitlist_size: dto.waitlistSize,
      status_id: dto.statusId,
      auto_placement: dto.autoPlacement,
      auto_promote_waitlist: dto.autoPromoteWaitlist,
      allow_guests: dto.allowGuests,
      checkin_pin: this.resolveCheckinPin(
        dto.allowSelfCheckin,
        existingMeet?.checkin_pin,
      ),
      allow_walkins: dto.allowWalkins,
      require_email: dto.requireEmail,
      require_phone: dto.requirePhone,
      require_org1: dto.requireOrg1,
      require_org2: dto.requireOrg2,
      max_guests: dto.maxGuests,
      is_virtual: dto.isVirtual,
      confirm_message: dto.confirmMessage,
      reject_message: dto.rejectMessage,
      waitlist_message: dto.waitlistMessage,
      has_indemnity: dto.hasIndemnity,
      indemnity: dto.indemnity,
      allow_minor_indemnity: dto.allowMinorIndemnity,
      currency_id: dto.currencyId === undefined ? undefined : dto.currencyId,
      cost_cents: this.toCents(dto.costCents),
      deposit_cents: this.toCents(dto.depositCents),
      share_code: dto.shareCode,
      start_time_tbc: dto.startTimeTbc,
      end_time_tbc: dto.endTimeTbc,
      use_map: dto.useMap,
      is_hidden: dto.isHidden,
    };
    if (now) {
      record.created_at = now;
    }
    record.updated_at = new Date().toISOString();
    // remove undefined keys
    Object.keys(record).forEach((key) => {
      if (record[key] === undefined) {
        delete record[key];
      }
    });
    return record;
  }

  private async resolveCurrencyId(
    currencyId?: number | null,
    currencyCode?: string,
  ) {
    if (currencyId !== undefined) {
      return currencyId;
    }
    if (!currencyCode) {
      return undefined;
    }
    const code = currencyCode.trim().toUpperCase();
    const currency = await this.db
      .getClient()("currencies")
      .where({ code })
      .first<{ id: number }>("id");
    if (!currency) {
      throw new BadRequestException(`Unknown currency code: ${currencyCode}`);
    }
    return currency.id;
  }

  private toCents(amount?: number | null) {
    if (amount === undefined || amount === null) {
      return undefined;
    }
    return Math.round((amount + Number.EPSILON) * 100);
  }

  private isGoingAttendeeStatus(status?: string | null) {
    return ["confirmed", "checked-in", "attended"].includes(status ?? "");
  }

  private async listAttendingAttendeePreviews(meetId: string) {
    const attendees = await this.db
      .getClient()("meet_attendees as ma")
      .leftJoin("users as u", "u.id", "ma.user_id")
      .where("ma.meet_id", meetId)
      .whereIn("ma.status", ["confirmed", "checked-in", "attended"])
      .orderBy([
        { column: "ma.sequence", order: "asc" },
        { column: "ma.created_at", order: "asc" },
      ])
      .select(
        "ma.id",
        "ma.name",
        "u.first_name",
        "u.last_name",
        "u.avatar_url",
      );

    return attendees.map((attendee: any) => ({
      id: attendee.id,
      name:
        attendee.name?.trim() ||
        [attendee.first_name, attendee.last_name].filter(Boolean).join(" ") ||
        "Attendee",
      avatarUrl: attendee.avatar_url ?? undefined,
    }));
  }

  private generateShareCode(length: number) {
    const chars = MeetsService.shareCodeChars;
    const bytes = randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i += 1) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  private generateCheckinPin() {
    return this.generateShareCode(6);
  }

  private resolveCheckinPin(
    allowSelfCheckin?: boolean,
    existingCheckinPin?: string | null,
  ) {
    if (allowSelfCheckin === undefined) {
      return undefined;
    }
    if (!allowSelfCheckin) {
      return null;
    }
    return existingCheckinPin || this.generateCheckinPin();
  }

  private toMeetDto(
    meet: Record<string, any>,
    metaDefinitions: Record<string, any>[],
    images: Record<string, any>[] = [],
    attendingAttendees?: Array<{
      id: string;
      name: string;
      avatarUrl?: string;
    }>,
  ): MeetDto {
    const resolvedImages = Array.isArray(images) ? images : [];

    return {
      id: meet.id,
      name: meet.name,
      description: meet.description ?? undefined,
      organizerId: meet.organizer_id,
      organizationId: meet.organization_id ?? undefined,
      location: meet.location ?? undefined,
      locationLat: meet.location_lat ?? undefined,
      locationLong: meet.location_long ?? undefined,
      startTime: meet.start_time ?? undefined,
      endTime: meet.end_time ?? undefined,
      timeZone: meet.time_zone ?? undefined,
      openingDate: meet.opening_date ?? undefined,
      closingDate: meet.closing_date ?? undefined,
      scheduledDate: meet.scheduled_date ?? undefined,
      confirmDate: meet.confirm_date ?? undefined,
      capacity: meet.capacity ?? undefined,
      waitlistSize: meet.waitlist_size ?? undefined,
      statusId: meet.status_id ?? undefined,
      autoPlacement: meet.auto_placement ?? undefined,
      autoPromoteWaitlist: meet.auto_promote_waitlist ?? undefined,
      allowGuests: meet.allow_guests ?? undefined,
      allowSelfCheckin:
        meet.checkin_pin === undefined ? undefined : Boolean(meet.checkin_pin),
      checkinPin: meet.checkin_pin ?? undefined,
      allowWalkins: meet.allow_walkins ?? undefined,
      requireEmail: meet.require_email ?? undefined,
      requirePhone: meet.require_phone ?? undefined,
      requireOrg1: meet.require_org1 ?? undefined,
      requireOrg2: meet.require_org2 ?? undefined,
      maxGuests: meet.max_guests ?? undefined,
      isVirtual: meet.is_virtual ?? undefined,
      confirmMessage: meet.confirm_message ?? undefined,
      rejectMessage: meet.reject_message ?? meet.rejectMessage ?? undefined,
      waitlistMessage: meet.waitlist_message ?? undefined,
      hasIndemnity: meet.has_indemnity ?? undefined,
      indemnity: meet.indemnity ?? undefined,
      allowMinorIndemnity: meet.allow_minor_indemnity ?? undefined,
      currencyId: meet.currency_id ?? undefined,
      currencySymbol: meet.currency_symbol ?? undefined,
      costCents: meet.cost_cents != null ? Number(meet.cost_cents) : undefined,
      depositCents:
        meet.deposit_cents != null ? Number(meet.deposit_cents) : undefined,
      shareCode: meet.share_code ?? undefined,
      organizerName: meet.organizer_name ?? undefined,
      organizerFirstName: meet.organizer_first_name || undefined,
      organizerLastName: meet.organizer_last_name || undefined,
      organizerEmail: meet.organizer_email ?? undefined,
      organizerPhone: meet.organizer_phone ?? undefined,
      imageUrl: meet.primary_image_url ?? meet.image_url ?? undefined,
      images: resolvedImages.map((image) => this.toMeetImageDto(image)),
      attendeeCount: Number(meet.attendee_count ?? 0),
      confirmedCount: Number(meet.confirmed_count ?? 0),
      waitlistCount: Number(meet.waitlist_count ?? 0),
      checkedInCount: Number(meet.checked_in_count ?? 0),
      startTimeTbc:
        meet.start_time_tbc ?? meet.startTimeTbc ?? meet.times_tbc ?? undefined,
      endTimeTbc: meet.end_time_tbc ?? meet.endTimeTbc ?? undefined,
      useMap: meet.use_map ?? meet.useMap ?? undefined,
      isHidden: meet.is_hidden ?? undefined,
      myAttendeeStatus: meet.my_attendee_status ?? undefined,
      attendingAttendees,
      metaDefinitions: metaDefinitions.map((definition) => ({
        id: definition.id,
        fieldKey: definition.field_key,
        label: definition.label,
        fieldType: definition.field_type,
        required: definition.required,
        position: definition.position,
        config: definition.config,
      })),
    };
  }

  private toMeetImageDto(image: Record<string, any>): MeetImageDto {
    return {
      id: image.id,
      meetId: image.meet_id,
      url: image.url,
      isPrimary: Boolean(image.is_primary),
      aspect: image.aspect ?? "O",
      objectKey: image.object_key ?? undefined,
      contentType: image.content_type ?? undefined,
      sizeBytes:
        image.size_bytes != null ? Number(image.size_bytes) : undefined,
      createdAt: image.created_at ?? undefined,
    };
  }

  private toWallItemDto(
    wallItem: Record<string, any>,
    likes: Array<Record<string, any>> = [],
    actor?: { userId?: string; attendeeId?: string | null },
  ): WallItemDto {
    const itemLikes = likes.filter((like) => like.wall_item_id === wallItem.id);
    const attendeeReaction = actor?.attendeeId
      ? itemLikes.find((like) => like.attendee_id === actor.attendeeId)
      : undefined;
    const userReaction =
      attendeeReaction ??
      (actor?.userId
        ? itemLikes.find((like) => like.user_id === actor.userId)
        : undefined);
    const likeCount = itemLikes.filter(
      (like) => like.reaction === "like",
    ).length;
    const dislikeCount = itemLikes.filter(
      (like) => like.reaction === "dislike",
    ).length;
    const heartCount = itemLikes.filter(
      (like) => like.reaction === "heart",
    ).length;
    const canSeeAttendeeId = Boolean(
      wallItem.attendee_id &&
        ((actor?.attendeeId && wallItem.attendee_id === actor.attendeeId) ||
          (actor?.userId && wallItem.created_by === actor.userId)),
    );

    return {
      id: wallItem.id,
      meetId: wallItem.meet_id,
      createdBy: wallItem.created_by ?? undefined,
      attendeeId: canSeeAttendeeId ? wallItem.attendee_id : null,
      authorName: this.getWallItemAuthorName(wallItem),
      comment: wallItem.comment ?? undefined,
      stars: wallItem.stars != null ? Number(wallItem.stars) : undefined,
      url: wallItem.url ?? undefined,
      aspect: wallItem.aspect ?? undefined,
      objectKey: wallItem.object_key ?? undefined,
      contentType: wallItem.content_type ?? undefined,
      sizeBytes:
        wallItem.size_bytes != null ? Number(wallItem.size_bytes) : undefined,
      favourite: Number(wallItem.favourite ?? 0),
      likesCount: likeCount,
      dislikesCount: dislikeCount,
      heartsCount: heartCount,
      likedByMe: userReaction?.reaction === "like",
      myReaction: userReaction?.reaction ?? undefined,
      createdAt: wallItem.created_at ?? undefined,
    };
  }

  private async getWallItem(
    meetId: string,
    wallItemId: string,
    actor?: { userId?: string; attendeeId?: string | null },
  ) {
    const wallItem = await this.db
      .getClient()("wall_item as wi")
      .leftJoin("users as u", "u.id", "wi.created_by")
      .leftJoin("meet_attendees as ma", "ma.id", "wi.attendee_id")
      .where({ "wi.meet_id": meetId, "wi.id": wallItemId })
      .first(
        "wi.*",
        "u.first_name as author_first_name",
        "u.last_name as author_last_name",
        "u.email as author_email",
        "u.idp_profile as author_idp_profile",
        "ma.name as attendee_name",
      );

    if (!wallItem) {
      throw new NotFoundException("Wall item not found");
    }

    const likes = await this.db
      .getClient()("wall_item_likes")
      .where({ wall_item_id: wallItemId })
      .select("wall_item_id", "user_id", "attendee_id", "reaction");

    return { wallItem: this.toWallItemDto(wallItem, likes, actor) };
  }

  private getFileExtension(filename?: string) {
    const cleaned = filename?.trim();
    if (!cleaned) return "";
    const lastDot = cleaned.lastIndexOf(".");
    if (lastDot <= 0) return "";
    return cleaned.slice(lastDot);
  }

  private getWallItemAuthorName(wallItem: Record<string, any>) {
    const attendeeName = wallItem.attendee_name?.trim();
    if (attendeeName) {
      return attendeeName;
    }

    const firstName = wallItem.author_first_name?.trim() ?? "";
    const lastName = wallItem.author_last_name?.trim() ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      return fullName;
    }

    const profileName =
      wallItem.author_idp_profile &&
      typeof wallItem.author_idp_profile === "object"
        ? wallItem.author_idp_profile.name
        : undefined;
    if (typeof profileName === "string" && profileName.trim()) {
      return profileName.trim();
    }

    const email = wallItem.author_email?.trim();
    if (email) {
      return email.split("@")[0];
    }

    return undefined;
  }

  private async syncMetaDefinitions(
    trx: any,
    meetId: string,
    metaDefinitions: MeetMetaDefinitionInputDto[],
  ) {
    const cleaned = metaDefinitions
      .map((definition, index) => ({
        id: definition.id,
        meet_id: meetId,
        field_key: definition.fieldKey || `field_${index + 1}`,
        label: definition.label,
        field_type: definition.fieldType,
        required: Boolean(definition.required),
        position: index,
        config: definition.config ?? {},
      }))
      .filter((definition) => definition.label);
    const updatedAtValue = trx.fn?.now ? trx.fn.now() : new Date().toISOString();

    const existing = (await trx("meet_meta_definitions")
      .where({ meet_id: meetId })
      .select("id", "field_key")) as Array<{
      id: string;
      field_key: string;
    }>;

    const existingById = new Map(
      existing.map((definition) => [
        definition.id,
        definition,
      ]),
    );
    const existingByFieldKey = new Map(
      existing.map((definition) => [
        definition.field_key,
        definition,
      ]),
    );

    const matchedExistingIds = new Set<string>();
    const updates: Array<{
      id: string;
      field_key: string;
      label: string;
      field_type: string;
      required: boolean;
      position: number;
      config: Record<string, any>;
    }> = [];
    const inserts: Array<{
      meet_id: string;
      field_key: string;
      label: string;
      field_type: string;
      required: boolean;
      position: number;
      config: Record<string, any>;
    }> = [];

    cleaned.forEach((definition) => {
      const matchedById =
        definition.id && existingById.has(definition.id)
          ? existingById.get(definition.id)
          : undefined;
      const matchedByFieldKey =
        !matchedById && existingByFieldKey.has(definition.field_key)
          ? existingByFieldKey.get(definition.field_key)
          : undefined;
      const matched =
        matchedById ??
        (matchedByFieldKey &&
        !matchedExistingIds.has(matchedByFieldKey.id)
          ? matchedByFieldKey
          : undefined);

      if (matched) {
        matchedExistingIds.add(matched.id);
        updates.push({
          id: matched.id,
          field_key: definition.field_key,
          label: definition.label,
          field_type: definition.field_type,
          required: definition.required,
          position: definition.position,
          config: definition.config,
        });
        return;
      }

      inserts.push({
        meet_id: definition.meet_id,
        field_key: definition.field_key,
        label: definition.label,
        field_type: definition.field_type,
        required: definition.required,
        position: definition.position,
        config: definition.config,
      });
    });

    const idsToDelete = existing
      .filter((definition) => !matchedExistingIds.has(definition.id))
      .map((definition) => definition.id);

    if (idsToDelete.length > 0) {
      const answeredMetaDefinition = await trx("meet_meta_values")
        .whereIn("meta_definition_id", idsToDelete)
        .first("meta_definition_id");

      if (answeredMetaDefinition) {
        throw new BadRequestException(
          "You cannot remove a meet question that already has attendee answers.",
        );
      }

      await trx("meet_meta_definitions")
        .where({ meet_id: meetId })
        .whereIn("id", idsToDelete)
        .del();
    }

    for (const definition of updates) {
      await trx("meet_meta_definitions")
        .where({ meet_id: meetId, id: definition.id })
        .update({
          field_key: `tmp_sync_${definition.id}`,
          updated_at: updatedAtValue,
        });
    }

    for (const definition of updates) {
      await trx("meet_meta_definitions")
        .where({ meet_id: meetId, id: definition.id })
        .update({
          field_key: definition.field_key,
          label: definition.label,
          field_type: definition.field_type,
          required: definition.required,
          position: definition.position,
          config: definition.config,
          updated_at: updatedAtValue,
        });
    }

    if (inserts.length > 0) {
      await trx("meet_meta_definitions").insert(inserts);
    }
  }

  private async addOrganizerAsAttendee(
    trx: any,
    meetId: string,
    organizerId: string,
    now: string,
  ) {
    const organizer = await trx("users")
      .where({ id: organizerId })
      .first("first_name", "last_name", "email", "phone");
    const organizerName = organizer
      ? `${organizer.first_name ?? ""} ${organizer.last_name ?? ""}`.trim()
      : "";
    const [attendee] = await trx("meet_attendees").insert(
      {
        meet_id: meetId,
        user_id: organizerId,
        name: organizerName || null,
        email: organizer?.email ?? null,
        phone: organizer?.phone ?? null,
        status: "confirmed",
        responded_at: now,
        created_at: now,
        updated_at: now,
      },
      ["*"],
    );
    const previousAnswers = await this.findPreviousAnswers(
      organizerId,
      meetId,
      trx,
    );
    const metaDefinitions = await trx("meet_meta_definitions")
      .where({ meet_id: meetId })
      .select("id", "field_key");
    const metaRecords = metaDefinitions
      .map((definition: { id: string; field_key: string }) => {
        const value = previousAnswers[definition.field_key];
        if (value === undefined || value === null || value === "") {
          return null;
        }
        return {
          meet_id: meetId,
          attendee_id: attendee.id,
          meta_definition_id: definition.id,
          value,
        };
      })
      .filter(Boolean) as Array<{
      meet_id: string;
      attendee_id: string;
      meta_definition_id: string;
      value: string;
    }>;
    if (metaRecords.length > 0) {
      await trx("meet_meta_values").insert(metaRecords);
    }
  }

  async listAttendeeMessages(meetId: string, attendeeId: string) {
    const rows = await this.db
      .getClient()("messages as m")
      .join("message_contents as mc", "mc.id", "m.message_content_id")
      .where("m.meet_id", meetId)
      .andWhere("m.attendee_id", attendeeId)
      .orderBy("m.timestamp", "desc")
      .select(
        "m.message_id",
        "m.timestamp",
        "m.from",
        "m.to",
        "m.is_read",
        "mc.content",
      );
    return rows.map((row: any) => ({
      id: row.message_id,
      timestamp: row.timestamp,
      from: row.from,
      to: row.to,
      isRead: row.is_read ?? false,
      content: row.content,
    }));
  }

  async listAttendeeHistory(meetId: string, attendeeId: string) {
    const attendee = await this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId, id: attendeeId })
      .first("email");

    if (!attendee) {
      throw new NotFoundException("Attendee not found");
    }

    const email = attendee.email?.trim().toLowerCase();
    if (!email) {
      return [];
    }

    const rows = await this.db
      .getClient()("meet_attendees as ma")
      .join("meets as m", "m.id", "ma.meet_id")
      .whereRaw("LOWER(ma.email) = ?", [email])
      .andWhereNot("ma.id", attendeeId)
      .orderBy("m.start_time", "desc")
      .select(
        "ma.meet_id",
        "ma.status",
        "m.status_id",
        "m.start_time",
        "m.name",
      );

    return rows.map((row: any) => ({
      meetId: row.meet_id,
      date: row.start_time,
      meetName: row.name,
      attendeeStatus:
        row.status_id === MEET_STATUS.Completed && row.status === "confirmed"
          ? "no-show"
          : row.status,
    }));
  }

  async markAttendeeMessageRead(meetId: string, messageId: string) {
    const updated = await this.db
      .getClient()("messages")
      .where({ meet_id: meetId, message_id: messageId })
      .update({ is_read: true })
      .returning("message_id");
    return Array.isArray(updated) ? updated[0] : updated;
  }

  private toAttendeeDto(attendee: Record<string, any>) {
    return {
      id: attendee.id,
      meetId: attendee.meet_id ?? undefined,
      userId: attendee.user_id ?? undefined,
      status: attendee.status ?? undefined,
      sequence: attendee.sequence ?? undefined,
      respondedAt: attendee.responded_at ?? undefined,
      name: attendee.name ?? undefined,
      phone: attendee.phone ?? undefined,
      email: attendee.email ?? undefined,
      guests: attendee.guests ?? undefined,
      guestOf: attendee.guest_of ?? undefined,
      isMinor: attendee.is_minor ?? undefined,
      guardianName: attendee.guardian_name ?? undefined,
      indemnityAccepted: attendee.indemnity_accepted ?? undefined,
      indemnityMinors: attendee.indemnity_minors ?? undefined,
      paidFullAt: attendee.paid_full_at ?? undefined,
      paidDepositAt: attendee.paid_deposit_at ?? undefined,
      createdAt: attendee.created_at ?? undefined,
      updatedAt: attendee.updated_at ?? undefined,
    };
  }
}
