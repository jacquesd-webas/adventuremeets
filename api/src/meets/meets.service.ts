import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { DatabaseService } from "../database/database.service";
import {
  CreateMeetDto,
  MeetMetaDefinitionInputDto,
} from "./dto/create-meet.dto";
import { MeetDto } from "./dto/meet.dto";
import { CreateMeetAttendeeDto } from "./dto/create-meet-attendee.dto";
import { UpdateMeetDto } from "./dto/update-meet.dto";
import { UpdateMeetAttendeeDto } from "./dto/update-meet-attendee.dto";
import { CreateMeetImageDto } from "./dto/create-meet-image.dto";
import { MinioService } from "../storage/minio.service";
import { v4 as uuid } from "uuid";

@Injectable()
export class MeetsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly minio: MinioService,
  ) {}

  private static readonly shareCodeChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  async findAll(
    view = "all",
    page = 1,
    limit = 20,
    organizationIds: string[] = [],
    isOrganizer = false,
    userId?: string,
    fromTime: Date | null = null,
    toTime: Date | null = null,
    search: string | null = null,
  ) {
    const attendeeCounts = this.db
      .getClient()("meet_attendees")
      .select("meet_id")
      .count<
        {
          meet_id: string;
          attendee_count: number;
          waitlist_count: number;
          checked_in_count: number;
          confirmed_count: number;
        }[]
      >("* as attendee_count")
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status = 'waitlisted' then 1 else 0 end) as waitlist_count`,
          ),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status in ('confirmed', 'checked-in', 'attended') then 1 else 0 end) as confirmed_count`,
          ),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status in ('checked-in', 'attended') then 1 else 0 end) as checked_in_count`,
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

    // If the user is not an organizer, only show meets they are attending or meets that are open
    if (!isOrganizer) {
      query.where((qb) => {
        qb.whereExists(function () {
          this.select("*")
            .from("meet_attendees as ma2")
            .whereRaw("ma2.meet_id = m.id")
            .andWhere("ma2.user_id", userId!);
        });
        qb.orWhere("m.status_id", "3"); // Open
      });
    }

    if (view === "upcoming") {
      query.where("start_time", ">=", new Date().toISOString());
      query.whereNotIn("status_id", [1, 2]); // Not Draft or Cancelled
      query.orderBy("start_time", "asc");
      totalQuery.where("start_time", ">=", new Date().toISOString());
      totalQuery.whereNotIn("status_id", [1, 2]); // Not Draft or Cancelled
    }
    if (view === "past") {
      query.where("start_time", "<", new Date().toISOString());
      query.whereNotIn("status_id", [1, 2]); // Not Draft or Cancelled
      query.orderBy("start_time", "desc");
      totalQuery.where("start_time", "<", new Date().toISOString());
      totalQuery.whereNotIn("status_id", [1, 2]); // Not Draft or Cancelled
    }
    if (view === "draft") {
      query.where("status_id", "1"); // Draft
      totalQuery.where("status_id", "1"); // Draft
    }
    if (organizationIds.length > 0) {
      query.whereIn("m.organization_id", organizationIds);
      totalQuery.whereIn("organization_id", organizationIds);
    }
    if (!isOrganizer) {
      query.where("m.is_hidden", false);
      totalQuery.where("is_hidden", false);
    }
    if (fromTime) {
      query.where("start_time", ">=", fromTime.toISOString());
      totalQuery.where("start_time", ">=", fromTime.toISOString());
    }
    if (toTime) {
      query.where("start_time", "<=", toTime.toISOString());
      totalQuery.where("start_time", "<=", toTime.toISOString());
    }
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      query.where((qb) => {
        qb.whereRaw("lower(m.name) like ?", [like])
          .orWhereRaw("lower(m.location) like ?", [like])
          .orWhereRaw("lower(m.description) like ?", [like]);
      });
      totalQuery.where((qb) => {
        qb.whereRaw("lower(name) like ?", [like])
          .orWhereRaw("lower(location) like ?", [like])
          .orWhereRaw("lower(description) like ?", [like]);
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
      .count<
        {
          meet_id: string;
          attendee_count: number;
          waitlist_count: number;
          checked_in_count: number;
          confirmed_count: number;
        }[]
      >("* as attendee_count")
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status = 'waitlisted' then 1 else 0 end) as waitlist_count`,
          ),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status in ('confirmed', 'checked-in', 'attended') then 1 else 0 end) as confirmed_count`,
          ),
      )
      .select(
        this.db
          .getClient()
          .raw(
            `sum(case when status in ('checked-in', 'attended') then 1 else 0 end) as checked_in_count`,
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
    const image = await this.db
      .getClient()("meet_images")
      .where({ meet_id: meet.id, is_primary: true })
      .orderBy([
        { column: "created_at", order: "desc" },
        { column: "id", order: "desc" },
      ])
      .first();
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
      image_url: image?.url ?? meet.image_url ?? undefined,
    };
    return this.toMeetDto(meetWithImage, metaDefinitions);
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
        this.toDbRecord({ ...dto, currencyId, statusId, shareCode }, now),
        ["*"],
      );
      if (dto.metaDefinitions) {
        await this.syncMetaDefinitions(trx, meet.id, dto.metaDefinitions);
      }
      if (dto.organizerId) {
        const organizer = await trx("users")
          .where({ id: dto.organizerId })
          .first("first_name", "last_name", "email", "phone");
        const organizerName = organizer
          ? `${organizer.first_name ?? ""} ${organizer.last_name ?? ""}`.trim()
          : "";
        const [attendee] = await trx("meet_attendees").insert(
          {
            meet_id: meet.id,
            user_id: dto.organizerId,
            name: organizerName || null,
            email: organizer?.email ?? null,
            phone: organizer?.phone ?? null,
            status: "confirmed",
            created_at: now,
            updated_at: now,
          },
          ["*"],
        );
        const previousAnswers = await this.findPreviousAnswers(
          dto.organizerId,
          meet.id,
          trx,
        );
        const metaDefinitions = await trx("meet_meta_definitions")
          .where({ meet_id: meet.id })
          .select("id", "field_key");
        const metaRecords = metaDefinitions
          .map((definition) => {
            const value = previousAnswers[definition.field_key];
            if (value === undefined || value === null || value === "") {
              return null;
            }
            return {
              meet_id: meet.id,
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
      return meet;
    });
    return created;
  }

  async update(id: string, dto: UpdateMeetDto) {
    const currencyId = await this.resolveCurrencyId(
      dto.currencyId,
      dto.currencyCode,
    );
    const updated = await this.db.getClient().transaction(async (trx) => {
      const updatedRows = (await trx("meets")
        .where({ id })
        .update(this.toDbRecord({ ...dto, currencyId }), ["*"])) as unknown;
      const meet = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
      if (!meet) {
        throw new NotFoundException("Meet not found");
      }
      if (dto.metaDefinitions) {
        await this.syncMetaDefinitions(trx, id, dto.metaDefinitions);
      }
      return meet as any;
    });
    return updated;
  }

  async updateStatus(id: string, statusId: number) {
    const updatedRows = (await this.db
      .getClient()("meets")
      .where({ id })
      .update({ status_id: statusId, updated_at: new Date().toISOString() }, [
        "*",
      ])) as unknown;
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
    if (!updated) {
      throw new NotFoundException("Meet not found");
    }
    return updated as any;
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
    return { attendee: this.toAttendeeDto(attendee) };
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
      .select("id", "label", "field_type", "required", "position");
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
      .select("id", "label", "field_type", "required", "position");
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

  async findAttendeeByContact(meetId: string, email?: string, phone?: string) {
    if (!email && !phone) {
      throw new BadRequestException("Email or phone is required");
    }
    const query = this.db
      .getClient()("meet_attendees")
      .where({ meet_id: meetId });
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

  async addAttendee(meetId: string, dto: CreateMeetAttendeeDto) {
    const created = await this.db.getClient().transaction(async (trx) => {
      const [attendee] = await trx("meet_attendees").insert(
        {
          meet_id: meetId,
          user_id: dto.userId ?? null,
          name: dto.name ?? null,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          guests: dto.guests ?? null,
          indemnity_accepted: dto.indemnityAccepted ?? null,
          indemnity_minors: dto.indemnityMinors ?? null,
        },
        ["*"],
      );
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
  }

  async updateAttendee(
    meetId: string,
    attendeeId: string,
    dto: UpdateMeetAttendeeDto,
    options?: { resetCancelledToPending?: boolean },
  ) {
    const updated = await this.db.getClient().transaction(async (trx) => {
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

  async addImage(meetId: string, file: any, dto: CreateMeetImageDto) {
    const extension = file.mimetype.split("/")[1] || "jpg";
    const objectKey = `meets/${meetId}/${uuid()}.${extension}`;
    const uploaded = await this.minio.upload(
      objectKey,
      file.buffer,
      file.mimetype,
    );
    const [created] = await this.db
      .getClient()("meet_images")
      .insert(
        {
          meet_id: meetId,
          object_key: uploaded.objectKey,
          url: uploaded.url,
          content_type: file.mimetype,
          size_bytes: file.size,
          is_primary: dto.isPrimary ?? false,
          created_at: new Date().toISOString(),
        },
        ["*"],
      );
    return { image: created };
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

  private generateShareCode(length: number) {
    const chars = MeetsService.shareCodeChars;
    const bytes = randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i += 1) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  private toMeetDto(
    meet: Record<string, any>,
    metaDefinitions: Record<string, any>[],
  ): MeetDto {
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

    await trx("meet_meta_definitions").where({ meet_id: meetId }).del();
    if (cleaned.length > 0) {
      await trx("meet_meta_definitions").insert(cleaned);
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
      notifiedAt: attendee.notified_at ?? undefined,
      name: attendee.name ?? undefined,
      phone: attendee.phone ?? undefined,
      email: attendee.email ?? undefined,
      guests: attendee.guests ?? undefined,
      indemnityAccepted: attendee.indemnity_accepted ?? undefined,
      indemnityMinors: attendee.indemnity_minors ?? undefined,
      paidFullAt: attendee.paid_full_at ?? undefined,
      paidDepositAt: attendee.paid_deposit_at ?? undefined,
      createdAt: attendee.created_at ?? undefined,
      updatedAt: attendee.updated_at ?? undefined,
    };
  }
}
