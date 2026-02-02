import { Body, Controller, Headers, Post, Req, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('incoming')
@Controller()
export class IncomingMailController {
  constructor(private readonly db: DatabaseService) {}

  @Public()
  @Post('incoming')
  @ApiOperation({ summary: 'Incoming mail webhook' })
  @ApiHeader({ name: 'X-Rcpt-To', required: true, description: '<meet_id>@adventuremeets.apps.fringecoding.com' })
  @ApiHeader({ name: 'X-Mail-From', required: true, description: 'Sender email address' })
  @ApiHeader({ name: 'X-Client-IP', required: false, description: 'Origin IP (if provided by MTA)' })
  @ApiConsumes('message/rfc822', 'text/plain')
  @ApiBody({
    description: 'Raw RFC822 message body',
    schema: { type: 'string', example: 'Subject: Test\r\n\r\nThis is the body.' },
    required: true,
  })
  async handleIncoming(
    @Headers('x-rcpt-to') rcptTo: string | string[],
    @Headers('x-mail-from') mailFrom: string | string[],
    @Headers('x-client-ip') clientIp: string | string[],
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rcpt = Array.isArray(rcptTo) ? rcptTo[0] : rcptTo;
    const sender = Array.isArray(mailFrom) ? mailFrom[0] : mailFrom;
    const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp;

    const mailDomain = process.env.MAIL_DOMAIN || 'adventuremeets.apps.fringecoding.com';
    const match = rcpt?.match(new RegExp(`<?([^@<>]+)@${mailDomain.replace('.', '\\.')}>?`, 'i'));
    const meetId = match?.[1];

    const rawBody =
      (req as any).rawBody?.toString?.() ??
      (typeof body === 'string' ? body : typeof body === 'object' ? JSON.stringify(body) : '');

    console.log(
      JSON.stringify(
        {
          rcpt,
          sender,
          clientIp: ip,
          meetId,
          bodyLength: rawBody.length,
        },
        null,
        2,
      ),
    );

    if (!meetId || !sender || !rawBody) {
      res.status(HttpStatus.OK);
      return { status: 'ignored' };
    }

    const db = this.db.getClient();

    const organizer = await db('meets as m')
      .leftJoin('users as u', 'u.id', 'm.organizer_id')
      .select('u.email as organizer_email')
      .where('m.id', meetId)
      .first();

    const attendee = await db('meet_attendees')
      .select('id')
      .where('meet_id', meetId)
      .andWhereRaw('lower(email) = lower(?)', [sender])
      .first();

    const hash = crypto.createHash('sha256').update(rawBody).digest('hex');

    let contentId: string | undefined;
    const existing = await db('message_contents').select('id').where({ content_hash: hash }).first();
    if (existing) {
      contentId = existing.id;
    } else {
      const [inserted] = await db('message_contents')
        .insert({ content_hash: hash, content: rawBody })
        .returning('id');
      contentId = inserted.id;
    }

    await db('messages').insert({
      meet_id: meetId,
      attendee_id: attendee?.id ?? null,
      from: sender,
      to: organizer?.organizer_email ?? null,
      message_content_id: contentId,
    });

    res.status(HttpStatus.CREATED);
    return { status: 'ok' };
  }
}
