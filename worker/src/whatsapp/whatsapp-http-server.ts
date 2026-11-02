import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { WhatsappSessionManager } from "./whatsapp-session-manager";

const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

function respond(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) throw new Error("Request is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createWhatsappHttpServer(
  sessions: WhatsappSessionManager,
  apiKey: string,
): Server {
  if (!apiKey)
    throw new Error("WORKER_API_KEY is required for WhatsApp requests");

  return createServer(async (request, response) => {
    if (request.headers["x-api-key"] !== apiKey) {
      respond(response, 401, { error: "Unauthorized" });
      return;
    }

    const url = new URL(request.url || "/", "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/chats") {
        const organizationId = url.searchParams.get("organizationId");
        if (!organizationId) {
          respond(response, 400, { error: "Organization is required" });
          return;
        }
        respond(response, 200, await sessions.listChats(organizationId));
        return;
      }

      if (request.method === "GET" && url.pathname === "/groups/invite") {
        const organizationId = url.searchParams.get("organizationId");
        const chatId = url.searchParams.get("chatId");
        if (!organizationId || !chatId?.endsWith("@g.us")) {
          respond(response, 400, {
            error: "Organization and group are required",
          });
          return;
        }
        respond(
          response,
          200,
          await sessions.getGroupInviteLink(organizationId, chatId),
        );
        return;
      }

      if (request.method === "POST" && url.pathname === "/send") {
        const body = await readJson(request);
        if (!body || typeof body !== "object")
          throw new Error("Invalid request");
        const { organizationId, chatId, message, image } = body as Record<
          string,
          unknown
        >;
        if (
          typeof organizationId !== "string" ||
          typeof chatId !== "string" ||
          typeof message !== "string" ||
          !message.trim() ||
          message.length > 3000 ||
          (image !== undefined &&
            (!image ||
              typeof image !== "object" ||
              typeof (image as Record<string, unknown>).mimeType !== "string" ||
              typeof (image as Record<string, unknown>).base64 !== "string"))
        )
          throw new Error("Invalid message");

        await sessions.sendMeetMessage(
          organizationId,
          chatId,
          message,
          image as { mimeType: string; base64: string } | undefined,
        );
        respond(response, 200, { sent: true });
        return;
      }
      if (request.method === "POST" && url.pathname === "/groups") {
        const body = await readJson(request);
        if (!body || typeof body !== "object")
          throw new Error("Invalid request");
        const { organizationId, title, organizerPhone } = body as Record<
          string,
          unknown
        >;
        if (
          typeof organizationId !== "string" ||
          !organizationId ||
          typeof title !== "string" ||
          !title.trim() ||
          title.length > 100 ||
          (organizerPhone !== null && typeof organizerPhone !== "string")
        )
          throw new Error("Invalid group request");
        respond(
          response,
          200,
          await sessions.createMeetGroup(
            organizationId,
            title.trim(),
            organizerPhone,
          ),
        );
        return;
      }
      respond(response, 404, { error: "Not found" });
    } catch (error) {
      respond(response, 400, {
        error:
          error instanceof Error ? error.message : "WhatsApp request failed",
      });
    }
  });
}
