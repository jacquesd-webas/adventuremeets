import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { MeetImageAspect } from "../image-aspect";
import {
  wallItemReactionValues,
  type WallItemReaction,
} from "./update-wall-item-reaction.dto";

export class WallItemDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  meetId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  attendeeId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aspect?: MeetImageAspect;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sizeBytes?: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  favourite!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  likesCount!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  dislikesCount!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  heartsCount!: number;

  @ApiProperty()
  @IsBoolean()
  likedByMe!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(wallItemReactionValues)
  myReaction?: WallItemReaction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdAt?: string;
}
