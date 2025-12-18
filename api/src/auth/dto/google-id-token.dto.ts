import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GoogleIdTokenDto {
  @ApiProperty()
  @IsString()
  idToken!: string;
}
