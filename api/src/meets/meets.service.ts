import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateMeetDto } from './dto/create-meet.dto';
import { UpdateMeetDto } from './dto/update-meet.dto';
import { hoursToMilliseconds } from 'date-fns';

@Injectable()
export class MeetsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(upcomingOnly = false, page = 1, limit = 20) {
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
    const [{ count }] = await totalQuery;
    const total = Number(count);
    const items = await query.limit(limit).offset((page - 1) * limit);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const meet = await this.db.getClient()('meets').where({ id }).first();
    if (!meet) {
      throw new NotFoundException('Meet not found');
    }
    return meet;
  }

  async create(dto: CreateMeetDto) {
    const now = new Date().toISOString();
    const [created] = await this.db
      .getClient()('meets')
      .insert(this.toDbRecord(dto, now), ['*']);
    return created;
  }

  async update(id: string, dto: UpdateMeetDto) {
    const [updated] = await this.db
      .getClient()('meets')
      .where({ id })
      .update(this.toDbRecord(dto), ['*']);
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

  private toDbRecord(dto: Partial<CreateMeetDto>, now?: string) {
    const record: any = {
      name: dto.name,
      description: dto.description,
      organizer_id: dto.organizerId,
      location: dto.location,
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
      is_virtual: dto.isVirtual,
      access_link: dto.accessLink,
      confirm_message: dto.confirmMessage,
      reject_message: dto.rejectMessage,
      currency_id: dto.currencyId ?? null,
      cost_cents: this.toCents(dto.costCents),
      deposit_cents: this.toCents(dto.depositCents),
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

  private toCents(amount?: number | null) {
    if (amount === undefined || amount === null) {
      return undefined;
    }
    return Math.round((amount + Number.EPSILON) * 100);
  }
}
