import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class AttendeeHistoryItemDto {
  @ApiProperty()
  @IsUUID()
  meetId!: string;

  @ApiProperty()
  @IsString()
  date!: string;

  @ApiProperty()
  @IsString()
  meetName!: string;

  @ApiProperty()
  @IsString()
  attendeeStatus!: string;
}
