import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from "class-validator";

export class OrderWallItemFavouritesDto {
  @ApiProperty({
    type: [String],
    description: "Ordered wall item ids, highest-priority favourite first",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  wallItemIds!: string[];
}
