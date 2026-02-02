import { CreateUserDto } from "../../users/dto/create-user.dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class RegisterDto extends CreateUserDto {
  @ApiProperty({ example: "Password123!" })
  password!: string;

  @ApiPropertyOptional({
    description: "reCAPTCHA token for email/password registration",
  })
  @IsOptional()
  @IsString()
  captchaToken?: string;

  @ApiPropertyOptional({
    description: "Referring attendee ID for meet sign-up linking",
  })
  @IsOptional()
  @IsString()
  attendeeId?: string;
}
