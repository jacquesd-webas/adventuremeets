import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

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
}
