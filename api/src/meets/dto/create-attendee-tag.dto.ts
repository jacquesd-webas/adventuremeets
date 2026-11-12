import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateAttendeeTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tag!: string;
}
