import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export enum NotificationTypeName {
  NewMeet = "new_meet",
  OrganizerNewAttendee = "organizer_new_attendee",
  OrganiserReminderResponsesNeeded = "organiser_reminder_responses_needed",
  OrganizerLastMinuteAttendee = "organizer_last_minute_attendee",
  OrganizerReminderCheckinNeeded = "organizer_reminder_checkin_needed",
}

export class SendNotificationDto {
  @ApiProperty({ enum: NotificationTypeName })
  @IsEnum(NotificationTypeName)
  notificationType!: NotificationTypeName;

  @ApiProperty({
    description: "Meet the notification relates to",
    example: "9e2e9ecc-3a32-4e67-bf1e-977da44cffc5",
  })
  @IsUUID()
  meetId!: string;

  @ApiPropertyOptional({
    description: "Recipient user for new_meet notifications",
    example: "d4af78e4-d9b0-402d-959d-b8f219f7d5fe",
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: "Attendee that triggered the notification",
    example: "87cf1a7c-3f87-4d63-bf71-c8863317e027",
  })
  @IsOptional()
  @IsUUID()
  attendeeId?: string;
}
