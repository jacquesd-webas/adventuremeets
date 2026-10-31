import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class SendMeetWhatsappDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  message!: string;

  @IsOptional()
  @IsBoolean()
  includeImage?: boolean;
}
