import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MeetsService } from './meets.service';
import { CreateMeetAttendeeDto } from './dto/create-meet-attendee.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateMeetAttendeeDto } from './dto/update-meet-attendee.dto';

@ApiTags('Meet Attendees')
@Controller('meets/:meetId/attendees')
export class MeetAttendeesController {
  constructor(private readonly meetsService: MeetsService) {}

  @Get()
  list(@Param('meetId') meetId: string, @Query('filter') filter?: string) {
    return this.meetsService.listAttendees(meetId, filter);
  }

  @Public()
  @Get('check')
  check(@Param('meetId') meetId: string, @Query('email') email?: string, @Query('phone') phone?: string) {
    return this.meetsService.findAttendeeByContact(meetId, email, phone);
  }

  @Public()
  @Post()
  add(@Param('meetId') meetId: string, @Body() dto: CreateMeetAttendeeDto) {
    return this.meetsService.addAttendee(meetId, dto);
  }

  @Public()
  @Patch(':attendeeId')
  update(@Param('meetId') meetId: string, @Param('attendeeId') attendeeId: string, @Body() dto: UpdateMeetAttendeeDto) {
    return this.meetsService.updateAttendee(meetId, attendeeId, dto);
  }

  @Public()
  @Delete(':attendeeId')
  remove(@Param('meetId') meetId: string, @Param('attendeeId') attendeeId: string) {
    return this.meetsService.removeAttendee(meetId, attendeeId);
  }
}
