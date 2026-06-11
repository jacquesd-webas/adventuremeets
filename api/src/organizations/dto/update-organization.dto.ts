import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canViewAllMeets?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customField1Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customField2Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customField1HelperText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customField2HelperText?: string;
}
