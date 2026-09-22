import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CloneMeetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}
