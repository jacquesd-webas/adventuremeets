import { CreateUserDto } from "../../users/dto/create-user.dto";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto extends CreateUserDto {
  @ApiProperty({ example: "Password123!" })
  password!: string;
}
