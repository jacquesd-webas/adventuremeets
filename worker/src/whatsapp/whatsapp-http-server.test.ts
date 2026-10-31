import { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";
import { describe, expect, it, vi } from "vitest";
import { createWhatsappHttpServer } from "./whatsapp-http-server";
import { WhatsappSessionManager } from "./whatsapp-session-manager";

async function request(
  server: ReturnType<typeof createWhatsappHttpServer>,
  method: string,
  url: string,
  key?: string,
  body?: unknown,
) {
  const incoming = Object.assign(
    Readable.from(
      body === undefined ? [] : [Buffer.from(JSON.stringify(body))],
    ),
    { method, url, headers: key ? { "x-api-key": key } : {} },
  ) as IncomingMessage;
  return new Promise<{ status: number; body: unknown }>((resolve) => {
    let status = 200;
    const response = {
      writeHead: (code: number) => {
        status = code;
      },
      end: (data: string) => resolve({ status, body: JSON.parse(data) }),
    } as ServerResponse;
    server.emit("request", incoming, response);
  });
}

describe("WhatsApp internal HTTP server", () => {
  it("requires its key and validates messages before sending", async () => {
    const sessions = {
      listChats: vi
        .fn()
        .mockResolvedValue([
          { id: "group@g.us", name: "Group", isGroup: true },
        ]),
      sendMeetMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as WhatsappSessionManager;
    const server = createWhatsappHttpServer(sessions, "secret");

    expect(
      (await request(server, "GET", "/chats?organizationId=org-1")).status,
    ).toBe(401);
    expect(
      (await request(server, "GET", "/chats?organizationId=org-1", "secret"))
        .body,
    ).toEqual([{ id: "group@g.us", name: "Group", isGroup: true }]);
    expect(
      (
        await request(server, "POST", "/send", "secret", {
          organizationId: "org-1",
          chatId: "group@g.us",
          message: "",
        })
      ).status,
    ).toBe(400);
    expect(sessions.sendMeetMessage).not.toHaveBeenCalled();

    expect(
      (
        await request(server, "POST", "/send", "secret", {
          organizationId: "org-1",
          chatId: "group@g.us",
          message: "Hello",
        })
      ).status,
    ).toBe(200);
    expect(sessions.sendMeetMessage).toHaveBeenCalledWith(
      "org-1",
      "group@g.us",
      "Hello",
      undefined,
    );
  });
});
