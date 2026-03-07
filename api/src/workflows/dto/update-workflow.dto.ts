import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateWorkflowDto {
  @ApiProperty({ example: "Post-meet expenses" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ example: {} })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;
}
