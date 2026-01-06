import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class MeetMetaDefinitionInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  fieldKey!: string;

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsString()
  fieldType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  config?: Record<string, any>;
}

export class CreateMeetDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Organizer user id (UUID)' })
  @IsOptional()
  @IsString()
  organizerId?: string;

  @ApiPropertyOptional({ description: 'Organization id (UUID)' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Latitude for meet location' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  locationLat?: number;

  @ApiPropertyOptional({ description: 'Longitude for meet location' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  locationLong?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  openingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  confirmDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  waitlistSize?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  statusId?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoPlacement?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoPromoteWaitlist?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowGuests?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxGuests?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  confirmMessage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectMessage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  waitlistMessage?: string;

  @ApiPropertyOptional({ description: 'Requires indemnity waiver' })
  @IsOptional()
  @IsBoolean()
  hasIndemnity?: boolean;

  @ApiPropertyOptional({ description: 'Indemnity text' })
  @IsOptional()
  @IsString()
  indemnity?: string;

  @ApiPropertyOptional({ description: 'Allow minors to accept indemnity' })
  @IsOptional()
  @IsBoolean()
  allowMinorIndemnity?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  currencyId?: number | null;

  @ApiPropertyOptional({ description: 'Currency code (ISO 4217)' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Cost in currency units (e.g. 12.34)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costCents?: number;

  @ApiPropertyOptional({ description: 'Deposit in currency units (e.g. 12.34)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositCents?: number;

  @ApiPropertyOptional({ description: 'Times to be confirmed' })
  @IsOptional()
  @IsBoolean()
  timesTbc?: boolean;

  @ApiPropertyOptional({ type: [MeetMetaDefinitionInputDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MeetMetaDefinitionInputDto)
  metaDefinitions?: MeetMetaDefinitionInputDto[];
}
