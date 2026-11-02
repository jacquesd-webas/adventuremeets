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
    let groupModuleLoaded = false;
    const requireGroupBundle = vi.fn(async () => {
      groupModuleLoaded = true;
    });
    let inviteModuleLoaded = false;
    const requireInviteBundle = vi.fn(async () => {
      inviteModuleLoaded = true;
    });
    vi.stubGlobal("window", {
      require: (name: string) => {
        if (name === "WAWebGroupCreateJob") {
          return groupModuleLoaded ? { createGroup: vi.fn() } : undefined;
        }
        if (name === "WAWebNewGroupFlowLoadable") {
          return { requireBundle: requireGroupBundle };
        }
        if (name === "WAWebMexFetchGroupInviteCodeJob") {
          return inviteModuleLoaded
            ? {
                fetchMexGroupInviteCode: vi
                  .fn()
                  .mockResolvedValue({ code: "InviteCode123" }),
              }
            : undefined;
        }
        if (name === "WAWebGroupInviteLinkDrawerLoadable") {
          return { requireBundle: requireInviteBundle };
        }
        return {
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
        };
      },
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
      getNumberId: vi
        .fn()
        .mockResolvedValue({ _serialized: "27987654321@c.us" }),
      createGroup: vi.fn().mockResolvedValue({
        gid: { _serialized: "new-group@g.us" },
        participants: { "27987654321@c.us": { statusCode: 200 } },
      }),
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

    expect(
      await manager.createMeetGroup(
        row.organization_id,
        "Mountain walk",
        "+27 98 765 4321",
      ),
    ).toEqual({
      chatId: "new-group@g.us",
      organizerAdded: true,
    });
    expect(client.getNumberId).toHaveBeenCalledWith("27987654321");
    expect(client.createGroup).toHaveBeenCalledWith("Mountain walk", [
      "27987654321@c.us",
    ]);
    expect(requireGroupBundle).toHaveBeenCalledOnce();

    expect(
      await manager.getGroupInviteLink(row.organization_id, "new-group@g.us"),
    ).toEqual({
      url: "https://chat.whatsapp.com/InviteCode123",
    });
    expect(requireInviteBundle).toHaveBeenCalledOnce();

    expect(
      await manager.createMeetGroup(
        row.organization_id,
        "Same number",
        "+27 12 345 6789",
      ),
    ).toEqual({
      chatId: "new-group@g.us",
      organizerAdded: true,
    });
    expect(client.createGroup).toHaveBeenLastCalledWith("Same number", []);
    expect(requireGroupBundle).toHaveBeenCalledOnce();

    const logError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    client.createGroup.mockResolvedValueOnce(
      "CreateGroupError [TypeError]: Secret Meet failed for 27987654321 at https://example.com/debug",
    );
    await expect(
      manager.createMeetGroup(
        row.organization_id,
        "Secret Meet",
        "+27 98 765 4321",
      ),
    ).rejects.toThrow("[meet title] failed for [number] at [url]");
    expect(logError).toHaveBeenCalledWith(
      "WhatsApp group creation failed",
      expect.objectContaining({
        organizationId: row.organization_id,
        stage: "createGroup",
        error:
          "CreateGroupError [TypeError]: [meet title] failed for [number] at [url]",
      }),
    );
    logError.mockRestore();

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
