import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsPositive,
  IsNumber,
  IsDateString,
} from "class-validator/types";

export class MeetMetaDefinitionDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString()
  fieldKey!: string;

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsString()
  fieldType!: string;

  @ApiProperty()
  @IsBoolean()
  required!: boolean;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  position!: number;

  @ApiPropertyOptional()
  config?: Record<string, any>;
}

export class MeetDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  organizerId!: string;

  @ApiPropertyOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  canViewAllMeets?: boolean;

  @ApiPropertyOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional()
  @IsNumber()
  locationLong?: number;

  @ApiPropertyOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsDateString()
  openingDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  closingDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  confirmDate?: string;

  @ApiPropertyOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  waitlistSize?: number;

  @ApiPropertyOptional()
  @IsNumber()
  statusId?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  autoPlacement?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  autoPromoteWaitlist?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  allowGuests?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  maxGuests?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional()
  @IsString()
  confirmMessage?: string;

  @ApiPropertyOptional()
  @IsString()
  rejectMessage?: string;

  @ApiPropertyOptional()
  @IsString()
  waitlistMessage?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  hasIndemnity?: boolean;

  @ApiPropertyOptional()
  @IsString()
  indemnity?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  allowMinorIndemnity?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  currencyId?: number | null;

  @ApiPropertyOptional()
  @IsString()
  currencySymbol?: string;

  @ApiPropertyOptional()
  @IsNumber()
  costCents?: number;

  @ApiPropertyOptional()
  @IsNumber()
  depositCents?: number;

  @ApiPropertyOptional()
  @IsString()
  shareCode?: string;

  @ApiPropertyOptional()
  @IsString()
  organizerName?: string;

  @ApiPropertyOptional()
  @IsString()
  organizerFirstName?: string;

  @ApiPropertyOptional()
  @IsString()
  organizerLastName?: string;

  @ApiPropertyOptional()
  @IsString()
  organizerEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  organizerPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsNumber()
  attendeeCount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  waitlistCount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  confirmedCount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  checkedInCount?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  timesTbc?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional()
  @IsString()
  myAttendeeStatus?: string;

  @ApiPropertyOptional({ type: [MeetMetaDefinitionDto] })
  metaDefinitions?: MeetMetaDefinitionDto[];
}
