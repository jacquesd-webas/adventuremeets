import { existsSync } from "fs";
import { rm } from "fs/promises";
import { join } from "path";
import knex, { Knex } from "knex";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";

export type WhatsappChat = {
  id: string;
  name: string;
  isGroup: boolean;
};

function safeGroupError(error: unknown, title: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .split(title)
    .join("[meet title]")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[number]")
    .slice(0, 500);
}

export function createWhatsappDb(): Knex {
  return knex({
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "db",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "adventuremeets",
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    },
    pool: { min: 1, max: 5 },
  });
}

export class WhatsappSessionManager {
  private readonly clients = new Map<string, Client>();
  private readonly readyIds = new Set<string>();
  private readonly connectionTimers = new Map<string, NodeJS.Timeout>();
  private running = false;
  private readonly sessionDir =
    process.env.WHATSAPP_SESSION_DIR || "/var/lib/adventuremeets/whatsapp";

  constructor(private readonly db: Knex) {}

  async reconcile() {
    if (this.running) return;
    this.running = true;
    try {
      const rows = await this.db("organization_config").select(
        "organization_id",
        "whatsapp_connect_requested",
        "whatsapp_status",
      );
      const configuredIds = new Set<string>();
      for (const row of rows) {
        const organizationId = row.organization_id as string;
        configuredIds.add(organizationId);
        if (row.whatsapp_connect_requested) {
          if (!this.clients.has(organizationId))
            await this.start(organizationId);
        } else if (
          this.clients.has(organizationId) ||
          row.whatsapp_status === "disconnecting"
        ) {
          await this.disconnect(organizationId);
        }
      }
      for (const organizationId of this.clients.keys()) {
        if (!configuredIds.has(organizationId))
          await this.disconnect(organizationId);
      }
    } finally {
      this.running = false;
    }
  }

  private async start(organizationId: string) {
    const localSessionDir = join(this.sessionDir, `session-${organizationId}`);
    for (const lockFile of [
      "SingletonLock",
      "SingletonSocket",
      "SingletonCookie",
    ]) {
      await rm(join(localSessionDir, lockFile), { force: true });
    }
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: organizationId,
        dataPath: this.sessionDir,
      }),
      puppeteer: {
        headless: true,
        executablePath: process.env.WHATSAPP_CHROME_PATH || undefined,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });
    this.clients.set(organizationId, client);
    this.connectionTimers.set(
      organizationId,
      setTimeout(() => {
        void this.fail(
          organizationId,
          "WhatsApp did not finish connecting. Reconnect the phone.",
          client,
        ).catch((error) =>
          console.error(
            `WhatsApp timeout update failed for ${organizationId}`,
            error,
          ),
        );
      }, 90_000),
    );

    client.on("qr", (qr) => {
      if (this.clients.get(organizationId) !== client) return;
      this.clearConnectionTimer(organizationId);
      void this.db("organization_config")
        .where({
          organization_id: organizationId,
          whatsapp_connect_requested: true,
        })
        .update({
          whatsapp_status: "qr",
          whatsapp_qr: qr,
          whatsapp_qr_expires_at: new Date(Date.now() + 60_000),
          whatsapp_error: null,
          updated_at: this.db.fn.now(),
        })
        .catch((error) =>
          console.error(
            `WhatsApp QR update failed for ${organizationId}`,
            error,
          ),
        );
    });

    client.on("ready", () => {
      if (this.clients.get(organizationId) !== client) return;
      this.clearConnectionTimer(organizationId);
      this.readyIds.add(organizationId);
      void this.db("organization_config")
        .where({
          organization_id: organizationId,
          whatsapp_connect_requested: true,
        })
        .update({
          whatsapp_status: "connected",
          whatsapp_phone: client.info?.wid?.user ?? null,
          whatsapp_qr: null,
          whatsapp_qr_expires_at: null,
          whatsapp_error: null,
          whatsapp_connected_at: this.db.fn.now(),
          updated_at: this.db.fn.now(),
        })
        .catch((error) =>
          console.error(
            `WhatsApp ready update failed for ${organizationId}`,
            error,
          ),
        );
    });

    client.on("auth_failure", (message) => {
      void this.fail(
        organizationId,
        `Authentication failed: ${message}`,
        client,
      ).catch((error) =>
        console.error(
          `WhatsApp failure update failed for ${organizationId}`,
          error,
        ),
      );
    });
    client.on("disconnected", (reason) => {
      void this.fail(organizationId, `Disconnected: ${reason}`, client).catch(
        (error) =>
          console.error(
            `WhatsApp disconnect update failed for ${organizationId}`,
            error,
          ),
      );
    });

    void this.db("organization_config")
      .where({
        organization_id: organizationId,
        whatsapp_connect_requested: true,
      })
      .update({ whatsapp_status: "connecting", updated_at: this.db.fn.now() })
      .then((updated) =>
        updated && this.clients.get(organizationId) === client
          ? client.initialize()
          : undefined,
      )
      .catch((error) =>
        this.fail(
          organizationId,
          error?.message || "Connection failed",
          client,
        ),
      );
  }

  private async fail(organizationId: string, reason: string, client: Client) {
    if (this.clients.get(organizationId) !== client) return;
    this.clearConnectionTimer(organizationId);
    this.readyIds.delete(organizationId);
    this.clients.delete(organizationId);
    try {
      await this.db("organization_config")
        .where({
          organization_id: organizationId,
          whatsapp_connect_requested: true,
        })
        .update({
          whatsapp_connect_requested: false,
          whatsapp_status: "error",
          whatsapp_qr: null,
          whatsapp_qr_expires_at: null,
          whatsapp_error: reason.slice(0, 500),
          updated_at: this.db.fn.now(),
        });
    } finally {
      await client.destroy().catch(() => undefined);
    }
  }

  private async disconnect(organizationId: string) {
    const client = this.clients.get(organizationId);
    this.clearConnectionTimer(organizationId);
    this.readyIds.delete(organizationId);
    this.clients.delete(organizationId);
    if (client) {
      await client.logout().catch(() => undefined);
      await client.destroy().catch(() => undefined);
    }
    const localSessionDir = join(this.sessionDir, `session-${organizationId}`);
    if (existsSync(localSessionDir)) {
      await rm(localSessionDir, { recursive: true, force: true });
    }
    await this.db("organization_config")
      .where({
        organization_id: organizationId,
        whatsapp_connect_requested: false,
      })
      .update({
        whatsapp_status: "disconnected",
        whatsapp_phone: null,
        whatsapp_qr: null,
        whatsapp_qr_expires_at: null,
        whatsapp_error: null,
        updated_at: this.db.fn.now(),
      });
  }

  async shutdown() {
    const clients = [...this.clients.values()];
    this.clients.clear();
    this.readyIds.clear();
    for (const organizationId of this.connectionTimers.keys()) {
      this.clearConnectionTimer(organizationId);
    }
    await Promise.all(
      clients.map((client) => client.destroy().catch(() => undefined)),
    );
  }

  private clearConnectionTimer(organizationId: string) {
    const timer = this.connectionTimers.get(organizationId);
    if (timer) clearTimeout(timer);
    this.connectionTimers.delete(organizationId);
  }

  private getReadyClient(organizationId: string): Client {
    const client = this.clients.get(organizationId);
    if (!client || !this.readyIds.has(organizationId)) {
      throw new Error("WhatsApp is not connected");
    }
    return client;
  }

  async listChats(organizationId: string): Promise<WhatsappChat[]> {
    // getChats() serializes each chat's last message. WhatsApp Web can reject
    // that message lookup for one chat and prevent the entire list from loading.
    const page = this.getReadyClient(organizationId).pupPage;
    if (!page) throw new Error("WhatsApp browser is not available");
    const chats: Array<WhatsappChat & { isReadOnly: boolean }> =
      await page.evaluate(() => {
        type BrowserChatModel = {
          id?: { _serialized?: string; $1?: string; user?: string };
          formattedTitle?: string;
          name?: string;
          isReadOnly?: boolean;
          groupMetadata?: { announce?: boolean };
        };
        const browserWindow = window as typeof window & {
          require: (module: string) => {
            Chat: { getModelsArray: () => BrowserChatModel[] };
          };
        };
        return browserWindow
          .require("WAWebCollections")
          .Chat.getModelsArray()
          .map((chat: BrowserChatModel) => {
            const id = chat.id?._serialized ?? chat.id?.$1;
            return {
              id,
              name:
                chat.formattedTitle ||
                chat.name ||
                chat.id?.user ||
                "Unknown chat",
              isGroup: id?.endsWith("@g.us") ?? false,
              isReadOnly: Boolean(
                chat.isReadOnly || chat.groupMetadata?.announce,
              ),
            };
          });
      });
    return chats
      .filter(
        (chat) => !chat.isReadOnly && /@(g\.us|c\.us|lid)$/.test(chat.id || ""),
      )
      .map((chat) => ({
        id: chat.id,
        name: chat.name,
        isGroup: chat.isGroup,
      }));
  }

  async sendMeetMessage(
    organizationId: string,
    chatId: string,
    message: string,
    image?: { mimeType: string; base64: string },
  ): Promise<void> {
    const client = this.getReadyClient(organizationId);
    const chats = await this.listChats(organizationId);
    if (!chats.some((chat) => chat.id === chatId)) {
      throw new Error("Select an existing WhatsApp chat");
    }
    const sent = image
      ? await client.sendMessage(
          chatId,
          new MessageMedia(image.mimeType, image.base64),
          { caption: message, waitUntilMsgSent: true },
        )
      : await client.sendMessage(chatId, message, { waitUntilMsgSent: true });
    if (!sent) throw new Error("WhatsApp did not confirm the message was sent");
  }

  async getGroupInviteLink(
    organizationId: string,
    chatId: string,
  ): Promise<{ url: string }> {
    const page = this.getReadyClient(organizationId).pupPage;
    if (!page) throw new Error("WhatsApp browser is not available");
    const code = await page.evaluate(async (groupId) => {
      type InviteModule = {
        requireBundle?: () => Promise<unknown>;
        fetchMexGroupInviteCode?: (
          id: string,
        ) => Promise<{ code?: string } | string>;
      };
      const browserWindow = window as typeof window & {
        require: (name: string) => InviteModule | undefined;
      };
      if (
        typeof browserWindow.require("WAWebMexFetchGroupInviteCodeJob")
          ?.fetchMexGroupInviteCode !== "function"
      ) {
        await browserWindow
          .require("WAWebGroupInviteLinkDrawerLoadable")
          ?.requireBundle?.();
      }
      const fetchCode = browserWindow.require(
        "WAWebMexFetchGroupInviteCodeJob",
      )?.fetchMexGroupInviteCode;
      if (typeof fetchCode !== "function")
        throw new Error("WhatsApp group invite module is unavailable");
      const result = await fetchCode(groupId);
      return typeof result === "string" ? result : result?.code;
    }, chatId);
    if (typeof code !== "string" || !/^[a-zA-Z0-9_-]+$/.test(code)) {
      throw new Error("WhatsApp did not return a group invite link");
    }
    return { url: `https://chat.whatsapp.com/${code}` };
  }

  async createMeetGroup(
    organizationId: string,
    title: string,
    organizerPhone: string | null,
  ): Promise<{ chatId: string; organizerAdded: boolean }> {
    const startedAt = Date.now();
    let stage = "connection";
    console.info("WhatsApp group creation started", {
      organizationId,
      organizerPhonePresent: Boolean(organizerPhone),
    });
    try {
      const client = this.getReadyClient(organizationId);
      const organizationPhone = client.info?.wid?.user?.replace(/\D/g, "");
      if (!organizationPhone)
        throw new Error("Organisation WhatsApp number is unavailable");

      const phone = organizerPhone?.replace(/\D/g, "") || null;
      const participants: string[] = [];
      if (phone && phone !== organizationPhone) {
        stage = "organizer lookup";
        const contact = await client.getNumberId(phone);
        if (!contact?._serialized) {
          throw new Error(
            "Organiser phone number is not registered on WhatsApp. Use an international number.",
          );
        }
        participants.push(contact._serialized);
      }

      stage = "group module";
      const page = client.pupPage;
      if (!page) throw new Error("WhatsApp browser is not available");
      const groupModuleReady = await page.evaluate(async () => {
        type GroupModule = {
          createGroup?: unknown;
          requireBundle?: () => Promise<unknown>;
        };
        const browserWindow = window as typeof window & {
          require: (name: string) => GroupModule | undefined;
        };
        if (
          typeof browserWindow.require("WAWebGroupCreateJob")?.createGroup !==
          "function"
        ) {
          const loader = browserWindow.require("WAWebNewGroupFlowLoadable");
          if (typeof loader?.requireBundle !== "function") return false;
          await loader.requireBundle();
        }
        return (
          typeof browserWindow.require("WAWebGroupCreateJob")?.createGroup ===
          "function"
        );
      });
      if (!groupModuleReady) {
        throw new Error(
          "WhatsApp group creation module is unavailable after loading",
        );
      }
      console.info("WhatsApp group creation module ready", { organizationId });

      stage = "createGroup";
      console.info("WhatsApp group creation requested", {
        organizationId,
        organizerNeedsAdding: participants.length > 0,
      });
      const result = await client.createGroup(title, participants);
      if (typeof result === "string" || !result.gid?._serialized) {
        throw new Error(
          typeof result === "string"
            ? result
            : "WhatsApp did not create the group",
        );
      }
      stage = "participant result";
      const organizerStatus =
        participants.length > 0
          ? (result.participants?.[participants[0]] ??
            Object.values(result.participants ?? {}).find(
              (participant) => !participant.isGroupCreator,
            ))
          : undefined;
      const organizerAdded =
        phone === organizationPhone || organizerStatus?.statusCode === 200;
      console.info("WhatsApp group creation succeeded", {
        organizationId,
        durationMs: Date.now() - startedAt,
        organizerAdded,
        organizerStatusCode: organizerStatus?.statusCode ?? null,
      });
      return { chatId: result.gid._serialized, organizerAdded };
    } catch (error) {
      const message = safeGroupError(error, title);
      console.error("WhatsApp group creation failed", {
        organizationId,
        stage,
        durationMs: Date.now() - startedAt,
        error: message,
      });
      throw new Error(message);
    }
  }
}
