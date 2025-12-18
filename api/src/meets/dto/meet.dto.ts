import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetMetaDefinitionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fieldKey!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  fieldType!: string;

  @ApiProperty()
  required!: boolean;

  @ApiProperty()
  position!: number;

  @ApiPropertyOptional()
  config?: Record<string, any>;
}

export class MeetDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  organizerId!: string;

  @ApiPropertyOptional()
  organizationId?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  locationLat?: number;

  @ApiPropertyOptional()
  locationLong?: number;

  @ApiPropertyOptional()
  startTime?: string;

  @ApiPropertyOptional()
  endTime?: string;

  @ApiPropertyOptional()
  openingDate?: string;

  @ApiPropertyOptional()
  closingDate?: string;

  @ApiPropertyOptional()
  scheduledDate?: string;

  @ApiPropertyOptional()
  confirmDate?: string;

  @ApiPropertyOptional()
  capacity?: number;

  @ApiPropertyOptional()
  waitlistSize?: number;

  @ApiPropertyOptional()
  statusId?: number;

  @ApiPropertyOptional()
  autoPlacement?: boolean;

  @ApiPropertyOptional()
  autoPromoteWaitlist?: boolean;

  @ApiPropertyOptional()
  allowGuests?: boolean;

  @ApiPropertyOptional()
  maxGuests?: number;

  @ApiPropertyOptional()
  isVirtual?: boolean;

  @ApiPropertyOptional()
  confirmMessage?: string;

  @ApiPropertyOptional()
  rejectMessage?: string;

  @ApiPropertyOptional()
  waitlistMessage?: string;

  @ApiPropertyOptional()
  hasIndemnity?: boolean;

  @ApiPropertyOptional()
  indemnity?: string;

  @ApiPropertyOptional()
  allowMinorIndemnity?: boolean;

  @ApiPropertyOptional()
  currencyId?: number | null;

  @ApiPropertyOptional()
  costCents?: number;

  @ApiPropertyOptional()
  depositCents?: number;

  @ApiPropertyOptional()
  shareCode?: string;

  @ApiPropertyOptional()
  organizerName?: string;

  @ApiPropertyOptional({ type: [MeetMetaDefinitionDto] })
  metaDefinitions?: MeetMetaDefinitionDto[];
}
