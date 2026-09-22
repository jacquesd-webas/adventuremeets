import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateWallItemCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  attendeeId?: string;

  @ApiPropertyOptional()
  @IsString()
  comment!: string;
}
