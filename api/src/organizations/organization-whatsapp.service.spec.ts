import { DatabaseService } from "../database/database.service";
import { OrganizationWhatsappService } from "./organization-whatsapp.service";

describe("OrganizationWhatsappService", () => {
  const organization = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: "org-1" }),
  };
  const config = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    onConflict: jest.fn().mockReturnThis(),
    merge: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(1),
  };
  const client = Object.assign(
    (table: string) => (table === "organizations" ? organization : config),
    { fn: { now: () => "now" } },
  );
  const service = new OrganizationWhatsappService({
    getClient: () => client,
  } as unknown as DatabaseService);

  beforeEach(() => {
    jest.clearAllMocks();
    organization.first.mockResolvedValue({ id: "org-1" });
  });

  it("returns only a current pairing QR code", async () => {
    config.first.mockResolvedValueOnce({
      whatsapp_status: "qr",
      whatsapp_qr: "fresh-code",
      whatsapp_qr_expires_at: new Date(Date.now() + 30_000),
    });
    await expect(service.getConnection("org-1")).resolves.toMatchObject({
      status: "qr",
      qr: "fresh-code",
    });

    config.first.mockResolvedValueOnce({
      whatsapp_status: "qr",
      whatsapp_qr: "expired-code",
      whatsapp_qr_expires_at: new Date(Date.now() - 30_000),
    });
    await expect(service.getConnection("org-1")).resolves.toMatchObject({
      qr: null,
    });
  });

  it("records a connection request for the WhatsApp worker", async () => {
    config.first
      .mockResolvedValueOnce({ whatsapp_status: "disconnected" })
      .mockResolvedValueOnce({ whatsapp_status: "connecting" });

    await expect(service.connect("org-1")).resolves.toMatchObject({
      status: "connecting",
    });
    expect(config.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        whatsapp_connect_requested: true,
        whatsapp_status: "connecting",
      }),
    );
  });

  it("requests unlinking without exposing a QR code", async () => {
    config.first.mockResolvedValueOnce({ whatsapp_status: "disconnecting" });
    await expect(service.disconnect("org-1")).resolves.toMatchObject({
      status: "disconnecting",
      qr: null,
    });
    expect(config.update).toHaveBeenCalledWith(
      expect.objectContaining({
        whatsapp_connect_requested: false,
        whatsapp_status: "disconnecting",
        whatsapp_qr: null,
      }),
    );
  });
});
