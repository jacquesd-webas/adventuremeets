import { EventEmitter } from "events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Client, MessageMedia } from "whatsapp-web.js";
import { Knex } from "knex";
import { WhatsappSessionManager } from "./whatsapp-session-manager";

vi.mock("whatsapp-web.js", () => ({
  Client: vi.fn(),
  LocalAuth: vi.fn(),
  MessageMedia: vi.fn(),
}));
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WhatsappSessionManager", () => {
  it("publishes a QR code, marks a number connected, and unlinks it", async () => {
    vi.stubGlobal("window", {
      require: () => ({
        Chat: {
          getModelsArray: () => [
            {
              id: { $1: "group-1@g.us" },
              formattedTitle: "Hiking group",
              groupMetadata: { announce: false },
            },
            {
              id: { _serialized: "read-only@g.us" },
              name: "Read only",
              groupMetadata: { announce: true },
            },
            { id: { _serialized: "status@broadcast" }, name: "Status" },
          ],
        },
      }),
    });
    const client = Object.assign(new EventEmitter(), {
      info: { wid: { user: "27123456789" } },
      initialize: vi.fn().mockResolvedValue(undefined),
      pupPage: {
        evaluate: vi
          .fn()
          .mockImplementation(async (callback: () => unknown) => callback()),
      },
      sendMessage: vi.fn().mockResolvedValue({ id: "message-1" }),
      logout: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(Client).mockImplementation(() => client as unknown as Client);

    const row: Record<string, any> = {
      organization_id: "11111111-1111-4111-8111-111111111111",
      whatsapp_connect_requested: true,
      whatsapp_status: "disconnected",
    };
    const db = Object.assign(
      (_table: string) => ({
        select: async () => [row],
        where: (filter: Record<string, unknown>) => ({
          update: async (values: Record<string, unknown>) => {
            if (
              filter.whatsapp_connect_requested !== undefined &&
              filter.whatsapp_connect_requested !==
                row.whatsapp_connect_requested
            )
              return 0;
            Object.assign(row, values);
            return 1;
          },
        }),
      }),
      { fn: { now: () => new Date() } },
    ) as unknown as Knex;

    const manager = new WhatsappSessionManager(db);
    await manager.reconcile();
    await vi.waitFor(() => expect(client.initialize).toHaveBeenCalledOnce());

    client.emit("qr", "pairing-code");
    await vi.waitFor(() => expect(row.whatsapp_status).toBe("qr"));
    expect(row.whatsapp_qr).toBe("pairing-code");

    client.emit("ready");
    await vi.waitFor(() => expect(row.whatsapp_status).toBe("connected"));
    expect(row.whatsapp_phone).toBe("27123456789");
    expect(row.whatsapp_qr).toBeNull();

    expect(await manager.listChats(row.organization_id)).toEqual([
      { id: "group-1@g.us", name: "Hiking group", isGroup: true },
    ]);
    expect(client.pupPage.evaluate).toHaveBeenCalledOnce();
    await expect(
      manager.sendMeetMessage(row.organization_id, "unknown@g.us", "Hello"),
    ).rejects.toThrow("Select an existing WhatsApp chat");
    await manager.sendMeetMessage(
      row.organization_id,
      "group-1@g.us",
      "Meet details",
      {
        mimeType: "image/jpeg",
        base64: "aW1hZ2U=",
      },
    );
    expect(MessageMedia).toHaveBeenCalledWith("image/jpeg", "aW1hZ2U=");
    expect(client.sendMessage).toHaveBeenCalledWith(
      "group-1@g.us",
      expect.anything(),
      { caption: "Meet details", waitUntilMsgSent: true },
    );

    row.whatsapp_connect_requested = false;
    row.whatsapp_status = "disconnecting";
    await manager.reconcile();
    expect(client.logout).toHaveBeenCalledOnce();
    expect(row.whatsapp_status).toBe("disconnected");
  });

  it("keeps a paired connection requested during service shutdown", async () => {
    const client = Object.assign(new EventEmitter(), {
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
    });
    client.destroy.mockImplementation(async () => {
      client.emit("disconnected", "NAVIGATION");
    });
    vi.mocked(Client).mockImplementation(() => client as unknown as Client);
    const row: Record<string, any> = {
      organization_id: "11111111-1111-4111-8111-111111111111",
      whatsapp_connect_requested: true,
      whatsapp_status: "connected",
    };
    const db = Object.assign(
      (table: string) => ({
        select: async () => [row],
        where: () => ({
          update: async (values: Record<string, unknown>) => {
            if (table === "organization_config") Object.assign(row, values);
            return 1;
          },
        }),
      }),
      { fn: { now: () => new Date() } },
    ) as unknown as Knex;

    const manager = new WhatsappSessionManager(db);
    await manager.reconcile();
    await vi.waitFor(() => expect(client.initialize).toHaveBeenCalledOnce());
    await manager.shutdown();

    expect(row.whatsapp_connect_requested).toBe(true);
    expect(row.whatsapp_status).not.toBe("error");
  });

  it("reports a connection that never becomes ready", async () => {
    vi.useFakeTimers();
    try {
      const client = Object.assign(new EventEmitter(), {
        initialize: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(Client).mockImplementation(() => client as unknown as Client);
      const row: Record<string, any> = {
        organization_id: "11111111-1111-4111-8111-111111111111",
        whatsapp_connect_requested: true,
        whatsapp_status: "connecting",
      };
      const db = Object.assign(
        () => ({
          select: async () => [row],
          where: () => ({
            update: async (values: Record<string, unknown>) => {
              Object.assign(row, values);
              return 1;
            },
          }),
        }),
        { fn: { now: () => new Date() } },
      ) as unknown as Knex;
      const manager = new WhatsappSessionManager(db);
      await manager.reconcile();
      await vi.advanceTimersByTimeAsync(90_000);
      expect(row.whatsapp_status).toBe("error");
      expect(row.whatsapp_connect_requested).toBe(false);
      await manager.shutdown();
    } finally {
      vi.useRealTimers();
    }
  });
});
