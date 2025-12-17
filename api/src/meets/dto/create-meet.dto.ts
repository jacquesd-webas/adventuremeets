import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMeetDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Organizer user id (UUID)' })
  @IsString()
  organizerId!: string;

  @ApiProperty()
  @IsString()
  location!: string;

  @ApiProperty()
  @IsDateString()
  startTime!: string;

  @ApiProperty()
  @IsDateString()
  endTime!: string;

  @ApiProperty()
  @IsDateString()
  openingDate!: string;

  @ApiProperty()
  @IsDateString()
  closingDate!: string;

  @ApiProperty()
  @IsDateString()
  scheduledDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  confirmDate?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  capacity!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  waitlistSize!: number;

  @ApiProperty({ default: 1 })
  @IsInt()
  statusId!: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  autoPlacement = true;

  @ApiProperty({ default: true })
  @IsBoolean()
  autoPromoteWaitlist = true;

  @ApiProperty({ default: false })
  @IsBoolean()
  isVirtual = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessLink?: string;

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
  @IsInt()
  currencyId?: number | null;

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
}
