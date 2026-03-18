import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MeetMetaValueInputDto {
  @ApiPropertyOptional()
  @IsUUID()
  definitionId!: string;

  @ApiPropertyOptional()
  @IsString()
  value!: string;
}

export class GuestInputDto {
  @ApiPropertyOptional()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsBoolean()
  isMinor!: boolean;
}

export class CreateMeetAttendeeDto {
  @ApiPropertyOptional({ description: 'Existing user id (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.userId)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.userId)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => !o.userId)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  guests?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMinor?: boolean;

  @ApiPropertyOptional({ description: 'Attendee id for guest-of relation (UUID)' })
  @IsOptional()
  @IsUUID()
  guestOf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  GuardianName?: string;

  @ApiPropertyOptional({ type: [GuestInputDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GuestInputDto)
  guestsList?: GuestInputDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  indemnityAccepted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indemnityMinors?: string;

  @ApiPropertyOptional({ type: [MeetMetaValueInputDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MeetMetaValueInputDto)
  metaValues?: MeetMetaValueInputDto[];
}
