import { ArrayMaxSize, IsArray, IsString, MaxLength } from "class-validator";

export class UpdateAttendeeNotesAndTagsDto {
  @IsString()
  @MaxLength(10000)
  notes!: string;

  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  tags!: string[];
}
