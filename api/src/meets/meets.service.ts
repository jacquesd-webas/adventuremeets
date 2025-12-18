import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CreateMeetDto, MeetMetaDefinitionInputDto } from './dto/create-meet.dto';
import { MeetDto } from './dto/meet.dto';
import { CreateMeetAttendeeDto } from './dto/create-meet-attendee.dto';
import { UpdateMeetDto } from './dto/update-meet.dto';
import { UpdateMeetAttendeeDto } from './dto/update-meet-attendee.dto';
import { hoursToMilliseconds } from 'date-fns';

@Injectable()
export class MeetsService {
  constructor(private readonly db: DatabaseService) {}

  private static readonly shareCodeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  async findAll(upcomingOnly = false, page = 1, limit = 20, organizationIds: string[] = []) {
    const query = this.db.getClient()('meets').select('*');
    const now = new Date();
    const cutoff = new Date(Date.now() + hoursToMilliseconds(24));
    if (upcomingOnly) {
      query.where('end_time', '<=', cutoff.toISOString());
    }
    query.orderBy('start_time', 'asc');

    const totalQuery = this.db.getClient()('meets').count<{ count: string }[]>('* as count');
    if (upcomingOnly) {
      totalQuery.whereBetween('start_time', [now.toISOString(), cutoff.toISOString()]);
    }
    if (organizationIds.length > 0) {
      query.whereIn('organization_id', organizationIds);
      totalQuery.whereIn('organization_id', organizationIds);
    }
    const [{ count }] = await totalQuery;
    const total = Number(count);
    const items = await query.limit(limit).offset((page - 1) * limit);
    return { items, total, page, limit };
  }

  async findOne(idOrCode: string): Promise<MeetDto> {
    // TODO: Fix the user's firstname / lastname retrieval
    let query = this.db
      .getClient()('meets as m')
      .leftJoin('users as u', 'u.id', 'm.organizer_id')
      .select(
      'm.*',
      this.db.getClient().raw(`trim(concat(coalesce(u.idp_profile->>'firstName', u.email), ' ', coalesce(u.idp_profile->>'lastName', ''))) as organizer_name`),
      );

    if (idOrCode.match(/^[0-9a-fA-F-]{36}$/)) {
      query = query.where('m.id', idOrCode);
    } else {
      query = query.where('m.share_code', idOrCode);
    }
    const meet = await query.first();
    if (!meet) {
      throw new NotFoundException('Meet not found');
    }
    const metaDefinitions = await this.db
      .getClient()('meet_meta_definitions')
      .where({ meet_id: meet.id })
      .orderBy('position', 'asc')
      .select(
        'id',
        'field_key',
        'label',
        'field_type',
        'required',
        'position',
        'config',
      );
    return this.toMeetDto(meet, metaDefinitions);
  }

  async create(dto: CreateMeetDto) {
    const now = new Date().toISOString();
    const currencyId = await this.resolveCurrencyId(dto.currencyId, dto.currencyCode);
    const statusId = dto.statusId ?? 1;
    const shareCode = this.generateShareCode(12);
    const created = await this.db.getClient().transaction(async (trx) => {
      const [meet] = await trx('meets').insert(this.toDbRecord({ ...dto, currencyId, statusId, shareCode }, now), ['*']);
      if (dto.metaDefinitions) {
        await this.syncMetaDefinitions(trx, meet.id, dto.metaDefinitions);
      }
      return meet;
    });
    return created;
  }

  async update(id: string, dto: UpdateMeetDto) {
    const currencyId = await this.resolveCurrencyId(dto.currencyId, dto.currencyCode);
    const updated = await this.db.getClient().transaction(async (trx) => {
      const [meet] = await trx('meets').where({ id }).update(this.toDbRecord({ ...dto, currencyId }), ['*']);
      if (!meet) {
        throw new NotFoundException('Meet not found');
      }
      if (dto.metaDefinitions) {
        await this.syncMetaDefinitions(trx, id, dto.metaDefinitions);
      }
      return meet;
    });
    return updated;
  }

  async updateStatus(id: string, statusId: number) {
    const [updated] = await this.db
      .getClient()('meets')
      .where({ id })
      .update({ status_id: statusId, updated_at: new Date().toISOString() }, ['*']);
    if (!updated) {
      throw new NotFoundException('Meet not found');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.db.getClient()('meets').where({ id }).del();
    if (!deleted) {
      throw new NotFoundException('Meet not found');
    }
    return { deleted: true };
  }

  async listStatuses() {
    const statuses = await this.db.getClient()('meet_statuses').select('id', 'name').orderBy('id', 'asc');
    return { statuses };
  }

  async listAttendees(meetId: string) {
    const attendees = await this.db.getClient()('meet_attendees').where({ meet_id: meetId }).select('*');
    return { attendees };
  }

  async findAttendeeByContact(meetId: string, email?: string, phone?: string) {
    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }
    const query = this.db.getClient()('meet_attendees').where({ meet_id: meetId });
    if (email && phone) {
      query.andWhere((builder) => {
        builder.whereRaw('lower(email) = ?', [email.toLowerCase()]).orWhere({ phone });
      });
    } else if (email) {
      query.andWhereRaw('lower(email) = ?', [email.toLowerCase()]);
    } else if (phone) {
      query.andWhere({ phone });
    }
    const attendee = await query.first();
    return { attendee: attendee || null };
  }

  async addAttendee(meetId: string, dto: CreateMeetAttendeeDto) {
    const [created] = await this.db
      .getClient()('meet_attendees')
      .insert(
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
        ['*'],
      );
    return { attendee: created };
  }

  async updateAttendee(meetId: string, attendeeId: string, dto: UpdateMeetAttendeeDto) {
    const [updated] = await this.db
      .getClient()('meet_attendees')
      .where({ meet_id: meetId, id: attendeeId })
      .update(
        {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          guests: dto.guests,
          indemnity_accepted: dto.indemnityAccepted,
          indemnity_minors: dto.indemnityMinors,
          updated_at: new Date().toISOString()
        },
        ['*'],
      );
    if (!updated) {
      throw new NotFoundException('Attendee not found');
    }
    return { attendee: updated };
  }

  async removeAttendee(meetId: string, attendeeId: string) {
    const query = this.db.getClient()('meet_attendees').where({ meet_id: meetId, id: attendeeId });
    const deleted = await query.del();
    if (!deleted) {
      throw new NotFoundException('Attendee not found');
    }
    return { deleted: true };
  }

  private toDbRecord(dto: Partial<CreateMeetDto> & { shareCode?: string }, now?: string) {
    const record: any = {
      name: dto.name,
      description: dto.description,
      organizer_id: dto.organizerId,
      organization_id: dto.organizationId,
      location: dto.location,
      location_lat: dto.locationLat,
      location_long: dto.locationLong,
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

  private async resolveCurrencyId(currencyId?: number | null, currencyCode?: string) {
    if (currencyId !== undefined) {
      return currencyId;
    }
    if (!currencyCode) {
      return undefined;
    }
    const code = currencyCode.trim().toUpperCase();
    const currency = await this.db.getClient()('currencies').where({ code }).first<{ id: number }>('id');
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
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  private toMeetDto(meet: Record<string, any>, metaDefinitions: Record<string, any>[]): MeetDto {
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
      rejectMessage: meet.reject_message ?? undefined,
      waitlistMessage: meet.waitlist_message ?? undefined,
      hasIndemnity: meet.has_indemnity ?? undefined,
      indemnity: meet.indemnity ?? undefined,
      allowMinorIndemnity: meet.allow_minor_indemnity ?? undefined,
      currencyId: meet.currency_id ?? undefined,
      costCents: meet.cost_cents ?? undefined,
      depositCents: meet.deposit_cents ?? undefined,
      shareCode: meet.share_code ?? undefined,
      organizerName: meet.organizer_name ?? undefined,
      metaDefinitions: metaDefinitions.map((definition) => ({
        id: definition.id,
        fieldKey: definition.field_key,
        label: definition.label,
        fieldType: definition.field_type,
        required: definition.required,
        position: definition.position,
        config: definition.config
      }))
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
        config: definition.config ?? {}
      }))
      .filter((definition) => definition.label);

    await trx('meet_meta_definitions').where({ meet_id: meetId }).del();
    if (cleaned.length > 0) {
      await trx('meet_meta_definitions').insert(cleaned);
    }
  }
}
