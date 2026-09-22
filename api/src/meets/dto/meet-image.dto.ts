import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsString, IsUUID } from "class-validator";
import { MeetImageAspect } from "../image-aspect";

export class MeetImageDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  meetId!: string;

  @ApiProperty()
  @IsString()
  url!: string;

  @ApiProperty()
  @IsBoolean()
  isPrimary!: boolean;

  @ApiProperty()
  @IsString()
  aspect!: MeetImageAspect;

  @ApiPropertyOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  sizeBytes?: number;

  @ApiPropertyOptional()
  @IsString()
  createdAt?: string;
}
