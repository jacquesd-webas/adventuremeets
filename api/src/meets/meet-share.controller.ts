import { Controller, Get, NotFoundException, Param, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { Public } from "../auth/decorators/public.decorator";
import { MeetsService } from "./meets.service";
import { buildMeetSharePageHtml } from "./meet-share-page";

@Public()
@Controller("share")
export class MeetShareController {
  constructor(private readonly meetsService: MeetsService) {}

  @Get(":code")
  async shareMeetSignup(
    @Param("code") code: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const meet = await this.meetsService.findOne(code);
    if (!meet) throw new NotFoundException("Meet not found");

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const { html } = buildMeetSharePageHtml({
      req,
      code,
      frontendUrl,
      meetName: meet.name,
      meetDescription: meet.description,
      meetImageUrl: meet.imageUrl,
    });

    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  }
}
