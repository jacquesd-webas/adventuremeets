import { Controller, Get, Header, Query, StreamableFile } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { ObjectStorageService } from "./object-storage.service";

@Controller("storage")
export class ObjectStorageController {
  constructor(private readonly storage: ObjectStorageService) {}

  @Public()
  @Get("images")
  @Header("Cache-Control", "public, max-age=86400")
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Content-Security-Policy", "sandbox")
  async getImage(@Query("key") key: string) {
    const { stream, contentType, size } = await this.storage.getImage(key);
    return new StreamableFile(stream, {
      type: contentType,
      length: size,
    });
  }
}
