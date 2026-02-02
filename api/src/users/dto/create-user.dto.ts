import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: "Plain password; hash before storing" })
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iceMedicalAid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iceMedicalAidNumber?: string;

  @ApiPropertyOptional({ description: "ICE date of birth" })
  @IsOptional()
  @IsDateString()
  iceDob?: string;

  @ApiPropertyOptional({
    description: "IDP provider name (google, facebook, etc.)",
  })
  @IsOptional()
  @IsString()
  idpProvider?: string;

  @ApiPropertyOptional({ description: "IDP subject/user id" })
  @IsOptional()
  @IsString()
  idpSubject?: string;

  @ApiPropertyOptional({ description: "Organization ID" })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ description: "IDP profile payload" })
  @IsOptional()
  idpProfile?: Record<string, any>;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
