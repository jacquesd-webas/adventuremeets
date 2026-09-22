import { Controller, Get, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { Public } from "../auth/decorators/public.decorator";
import { EmailService } from "./email.service";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
);

@Public()
@Controller("email")
export class EmailTrackingController {
  constructor(private readonly emailService: EmailService) {}

  @Get("open/:trackingToken")
  async trackOpen(
    @Param("trackingToken") trackingToken: string,
    @Res() response: Response,
  ) {
    if (/^[a-f0-9]{48}$/i.test(trackingToken)) {
      await this.emailService.recordOpened(trackingToken);
    }

    response.setHeader("Content-Type", "image/gif");
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return response.status(200).send(TRANSPARENT_GIF);
  }
}
