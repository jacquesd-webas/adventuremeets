import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class UpdateWallItemFavouriteDto {
  @ApiProperty({ minimum: 0 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  favourite!: number;
}
