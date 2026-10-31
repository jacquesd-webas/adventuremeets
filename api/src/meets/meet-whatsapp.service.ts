import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { MeetDto } from "./dto/meet.dto";
import { ObjectStorageService } from "../storage/object-storage.service";
import { SendMeetWhatsappDto } from "./dto/send-meet-whatsapp.dto";

type WhatsappChat = { id: string; name: string; isGroup: boolean };

@Injectable()
export class MeetWhatsappService {
  constructor(private readonly storage: ObjectStorageService) {}

  private async request<T>(path: string, body?: unknown): Promise<T> {
    const serviceUrl =
      process.env.WHATSAPP_SERVICE_URL || "http://127.0.0.1:3010";
    const apiKey = process.env.WORKER_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "WhatsApp service is not configured",
      );
    }

    let response: Response;
    try {
      response = await fetch(`${serviceUrl.replace(/\/+$/, "")}${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          "x-api-key": apiKey,
          ...(body ? { "content-type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(body ? 60_000 : 20_000),
      });
    } catch {
      throw new ServiceUnavailableException("WhatsApp service is unavailable");
    }
    let result: { error?: string };
    try {
      result = (await response.json()) as { error?: string };
    } catch {
      throw new ServiceUnavailableException(
        "WhatsApp service returned an invalid response",
      );
    }
    if (!response.ok) {
      if (response.status === 400) {
        throw new BadRequestException(
          result.error || "WhatsApp request failed",
        );
      }
      throw new ServiceUnavailableException("WhatsApp service is unavailable");
    }
    return result as T;
  }

  listChats(meet: MeetDto): Promise<WhatsappChat[]> {
    return this.request<WhatsappChat[]>(
      `/chats?organizationId=${encodeURIComponent(meet.organizationId!)}`,
    );
  }

  async send(meet: MeetDto, dto: SendMeetWhatsappDto): Promise<{ sent: true }> {
    let image: { mimeType: string; base64: string } | undefined;
    const primaryImage =
      meet.images?.find((item) => item.isPrimary) ?? meet.images?.[0];
    if (dto.includeImage && !primaryImage?.objectKey) {
      throw new BadRequestException(
        "Meet has no primary image available for WhatsApp",
      );
    }
    if (dto.includeImage && primaryImage?.objectKey) {
      const storedImage = await this.storage.getImage(primaryImage.objectKey);
      if (storedImage.size > 8 * 1024 * 1024) {
        throw new BadRequestException("Meet image is too large for WhatsApp");
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of storedImage.stream) {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) {
          throw new BadRequestException("Meet image is too large for WhatsApp");
        }
        chunks.push(chunk);
      }
      image = {
        mimeType: storedImage.contentType,
        base64: Buffer.concat(chunks).toString("base64"),
      };
    }
    return this.request<{ sent: true }>("/send", {
      organizationId: meet.organizationId,
      chatId: dto.chatId,
      message: dto.message.trim(),
      image,
    });
  }
}
