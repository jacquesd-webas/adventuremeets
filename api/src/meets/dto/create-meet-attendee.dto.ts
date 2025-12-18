import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';

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
  indemnityAccepted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indemnityMinors?: string;
}
