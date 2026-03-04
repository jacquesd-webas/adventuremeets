import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class UpdateMeetStatusDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  statusId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyAttendees?: boolean;
}
