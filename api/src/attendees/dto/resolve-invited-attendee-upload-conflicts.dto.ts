import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { MeetMetaValueInputDto } from "./create-meet-attendee.dto";

export class ResolveInvitedAttendeeUploadConflictAttendeeDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  rowNumber?: number;

  @ApiProperty({ type: [MeetMetaValueInputDto], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MeetMetaValueInputDto)
  metaValues?: MeetMetaValueInputDto[];
}

export class ResolveInvitedAttendeeUploadConflictItemDto {
  @ApiProperty({ enum: ["replace", "add_as_minor"] })
  @IsIn(["replace", "add_as_minor"])
  action!: "replace" | "add_as_minor";

  @ApiProperty()
  @IsUUID()
  existingAttendeeId!: string;

  @ApiProperty({
    type: ResolveInvitedAttendeeUploadConflictAttendeeDto,
  })
  @ValidateNested()
  @Type(() => ResolveInvitedAttendeeUploadConflictAttendeeDto)
  attendee!: ResolveInvitedAttendeeUploadConflictAttendeeDto;
}

export class ResolveInvitedAttendeeUploadConflictsDto {
  @ApiProperty({ type: [ResolveInvitedAttendeeUploadConflictItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResolveInvitedAttendeeUploadConflictItemDto)
  resolutions!: ResolveInvitedAttendeeUploadConflictItemDto[];
}
