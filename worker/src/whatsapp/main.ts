import * as dotenv from "dotenv";
import {
  createWhatsappDb,
  WhatsappSessionManager,
} from "./whatsapp-session-manager";
import { createWhatsappHttpServer } from "./whatsapp-http-server";

dotenv.config();

const db = createWhatsappDb();
const sessions = new WhatsappSessionManager(db);
const server = createWhatsappHttpServer(
  sessions,
  process.env.WORKER_API_KEY || "",
);
server.listen(Number(process.env.WHATSAPP_PORT) || 3010);
let stopping = false;

async function tick() {
  if (stopping) return;
  try {
    await sessions.reconcile();
  } catch (error) {
    console.error("WhatsApp session reconciliation failed", error);
  }
}

const timer = setInterval(() => void tick(), 3000);
void tick();

async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await sessions.shutdown();
  await db.destroy();
}

process.on("SIGINT", () => void shutdown().then(() => process.exit(0)));
process.on("SIGTERM", () => void shutdown().then(() => process.exit(0)));
