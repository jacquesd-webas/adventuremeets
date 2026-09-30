import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmIndemnityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}
