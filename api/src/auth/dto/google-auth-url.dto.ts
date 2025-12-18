import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GoogleAuthUrlDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  redirectUri?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;
}
