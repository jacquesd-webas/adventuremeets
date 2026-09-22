import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";
import { NotificationTypeName } from "./send-notification.dto";

export class SendNotificationResponseDto {
  @ApiProperty({ example: "sent" })
  @IsString()
  status!: string;

  @ApiProperty({ enum: NotificationTypeName })
  notificationType!: NotificationTypeName;

  @ApiProperty({
    example: "6af0ae9f-7b3d-4f43-96cc-e0d6eea1b9fc",
  })
  @IsUUID()
  notificationId!: string;

  @ApiProperty({ example: "person@example.com" })
  @IsString()
  to!: string;
}
