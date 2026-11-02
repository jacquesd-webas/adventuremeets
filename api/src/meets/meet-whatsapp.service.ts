import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { MeetDto } from "./dto/meet.dto";
import { ObjectStorageService } from "../storage/object-storage.service";
import { SendMeetWhatsappDto } from "./dto/send-meet-whatsapp.dto";
import { DatabaseService } from "../database/database.service";
import { MEET_STATUS } from "./constants/meet-status.enum";

type WhatsappChat = { id: string; name: string; isGroup: boolean };

@Injectable()
export class MeetWhatsappService {
  constructor(
    private readonly storage: ObjectStorageService,
    private readonly database: DatabaseService,
  ) {}

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

  async connectionStatus(meet: MeetDto): Promise<{ connected: boolean }> {
    const row = await this.database
      .getClient()("organization_config")
      .where({ organization_id: meet.organizationId })
      .first("whatsapp_status");
    return { connected: row?.whatsapp_status === "connected" };
  }

  async groupInviteLink(meet: MeetDto): Promise<{ url: string }> {
    const row = await this.database
      .getClient()("meets")
      .where({ id: meet.id })
      .first("organization_id", "whatsapp_group_id");
    if (!row?.whatsapp_group_id) {
      throw new BadRequestException("This meet has no WhatsApp group");
    }
    return this.request<{ url: string }>(
      `/groups/invite?organizationId=${encodeURIComponent(row.organization_id)}&chatId=${encodeURIComponent(row.whatsapp_group_id)}`,
    );
  }

  async createGroup(
    meet: MeetDto,
  ): Promise<{ chatId: string; organizerAdded: boolean }> {
    return this.database.getClient().transaction(async (trx) => {
      const row = await trx("meets")
        .where({ id: meet.id })
        .forUpdate()
        .first(
          "id",
          "name",
          "organization_id",
          "organizer_id",
          "status_id",
          "whatsapp_group_id",
        );
      if (!row || row.status_id === MEET_STATUS.Draft) {
        throw new BadRequestException(
          "Publish the meet before creating its WhatsApp group",
        );
      }
      if (row.whatsapp_group_id) {
        return { chatId: row.whatsapp_group_id, organizerAdded: true };
      }
      const connection = await trx("organization_config")
        .where({ organization_id: row.organization_id })
        .first("whatsapp_status");
      if (connection?.whatsapp_status !== "connected") {
        throw new BadRequestException(
          "Connect the organisation WhatsApp number first",
        );
      }
      const organizer = await trx("users")
        .where({ id: row.organizer_id })
        .first("phone");
      const group = await this.request<{
        chatId: string;
        organizerAdded: boolean;
      }>("/groups", {
        organizationId: row.organization_id,
        title: row.name.slice(0, 100),
        organizerPhone: organizer?.phone ?? null,
      });
      await trx("meets")
        .where({ id: row.id })
        .update({ whatsapp_group_id: group.chatId, updated_at: trx.fn.now() });
      return group;
    });
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
