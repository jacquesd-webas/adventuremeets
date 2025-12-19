import { CreateUserDto } from "../../users/dto/create-user.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class RegisterDto extends CreateUserDto {
  @ApiProperty({ example: "Password123!" })
  password!: string;

  @ApiProperty({
    required: false,
    description: "reCAPTCHA token for email/password registration",
  })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
