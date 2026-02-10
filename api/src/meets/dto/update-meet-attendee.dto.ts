import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeetMetaValueInputDto } from './create-meet-attendee.dto';

export class UpdateMeetAttendeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
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
  indemnityAccepted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indemnityMinors?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "User id (UUID)" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidFullAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidDepositAt?: string;

  @ApiPropertyOptional({ type: [MeetMetaValueInputDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MeetMetaValueInputDto)
  metaValues?: MeetMetaValueInputDto[];
}
