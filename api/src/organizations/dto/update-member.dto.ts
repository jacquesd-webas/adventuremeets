import { IsIn, IsOptional, IsString } from "class-validator";

const roleOptions = ["superuser", "admin", "organizer", "member"] as const;
const statusOptions = ["active", "disabled"] as const;

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @IsIn(roleOptions)
  role?: (typeof roleOptions)[number];

  @IsOptional()
  @IsString()
  @IsIn(statusOptions)
  status?: (typeof statusOptions)[number];
}
