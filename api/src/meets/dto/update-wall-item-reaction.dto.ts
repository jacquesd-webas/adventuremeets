import { ApiProperty } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsUUID } from "class-validator";

export const wallItemReactionValues = ["like", "dislike", "heart"] as const;

export type WallItemReaction = (typeof wallItemReactionValues)[number];

export class UpdateWallItemReactionDto {
  @ApiProperty({ enum: wallItemReactionValues })
  @IsIn(wallItemReactionValues)
  reaction!: WallItemReaction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  attendeeId?: string;
}
