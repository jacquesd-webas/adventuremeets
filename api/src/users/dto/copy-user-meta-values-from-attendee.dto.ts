import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class CopyUserMetaValuesFromAttendeeDto {
  @ApiProperty()
  @IsString()
  meetId!: string;

  @ApiProperty()
  @IsUUID()
  attendeeId!: string;
}
