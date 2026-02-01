import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { TemplateMetaDefinitionInputDto } from "./create-template.dto";

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  indemnity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  approvedResponse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  rejectResponse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  waitlistResponse?: string;

  @ApiPropertyOptional({ type: [TemplateMetaDefinitionInputDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TemplateMetaDefinitionInputDto)
  metaDefinitions?: TemplateMetaDefinitionInputDto[];
}
