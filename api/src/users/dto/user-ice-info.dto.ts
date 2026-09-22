import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class UserIceInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icePhone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iceName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iceMedicalAid?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iceMedicalAidNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iceMedicalHistory?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  iceDob?: string | null;
}
