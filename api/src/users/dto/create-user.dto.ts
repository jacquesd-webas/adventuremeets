import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: "Plain password; hash before storing" })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: "IDP provider name (google, facebook, etc.)" })
  @IsOptional()
  @IsString()
  idpProvider?: string;

  @ApiPropertyOptional({ description: "IDP subject/user id" })
  @IsOptional()
  @IsString()
  idpSubject?: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
