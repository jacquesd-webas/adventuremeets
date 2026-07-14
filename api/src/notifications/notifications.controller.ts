import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { SendNotificationResponseDto } from "./dto/send-notification-response.dto";
import { WorkerApiKeyGuard } from "./guards/worker-api-key.guard";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiHeader({
  name: "x-api-key",
  required: true,
  description: "Worker API key",
})
@UseGuards(WorkerApiKeyGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: "Send a worker-triggered notification email" })
  @ApiResponse({
    status: 201,
    type: SendNotificationResponseDto,
  })
  async send(
    @Body() dto: SendNotificationDto,
  ): Promise<SendNotificationResponseDto> {
    return this.notificationsService.sendNotification(dto);
  }
}
