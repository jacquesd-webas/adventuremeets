import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class PreviewMeetMessageItemDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("all", { each: true })
  attendeeIds!: string[];

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsBoolean()
  includeStatusUrl?: boolean;

  @IsOptional()
  @IsBoolean()
  sendAsGroup?: boolean;
}

export class PreviewMeetMessageDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => PreviewMeetMessageItemDto)
  messages!: PreviewMeetMessageItemDto[];
}
