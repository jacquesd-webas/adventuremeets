import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateWorkflowDto {
  @ApiProperty({ example: "Post-meet expenses" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "meet.report_generated" })
  @IsString()
  @IsNotEmpty()
  trigger!: string;

  @ApiProperty({ example: "expense_submission" })
  @IsString()
  @IsNotEmpty()
  actionType!: string;

  @ApiProperty({ example: {} })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
