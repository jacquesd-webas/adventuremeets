import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

type WhatsappConnection = {
  status: string;
  phone: string | null;
  qr: string | null;
  connectedAt: string | null;
  error: string | null;
};

@Injectable()
export class OrganizationWhatsappService {
  constructor(private readonly database: DatabaseService) {}

  private async assertOrganizationExists(organizationId: string) {
    const organization = await this.database
      .getClient()("organizations")
      .where({ id: organizationId })
      .first("id");
    if (!organization) throw new NotFoundException("Organization not found");
  }

  async getConnection(organizationId: string): Promise<WhatsappConnection> {
    await this.assertOrganizationExists(organizationId);
    const row = await this.database
      .getClient()("organization_config")
      .where({ organization_id: organizationId })
      .first(
        "whatsapp_status",
        "whatsapp_phone",
        "whatsapp_qr",
        "whatsapp_qr_expires_at",
        "whatsapp_connected_at",
        "whatsapp_error",
      );

    return {
      status: row?.whatsapp_status ?? "disconnected",
      phone: row?.whatsapp_phone ?? null,
      qr:
        row?.whatsapp_status === "qr" &&
        row.whatsapp_qr_expires_at &&
        new Date(row.whatsapp_qr_expires_at).getTime() > Date.now()
          ? row.whatsapp_qr
          : null,
      connectedAt: row?.whatsapp_connected_at ?? null,
      error: row?.whatsapp_error ?? null,
    };
  }

  async connect(organizationId: string): Promise<WhatsappConnection> {
    await this.assertOrganizationExists(organizationId);
    const db = this.database.getClient();
    const existing = await db("organization_config")
      .where({ organization_id: organizationId })
      .first("whatsapp_status");
    if (existing?.whatsapp_status === "connected") {
      return this.getConnection(organizationId);
    }

    await db("organization_config")
      .insert({
        organization_id: organizationId,
        whatsapp_connect_requested: true,
        whatsapp_status: "connecting",
        whatsapp_phone: null,
        whatsapp_qr: null,
        whatsapp_qr_expires_at: null,
        whatsapp_error: null,
        updated_at: db.fn.now(),
      })
      .onConflict("organization_id")
      .merge({
        whatsapp_connect_requested: true,
        whatsapp_status: "connecting",
        whatsapp_phone: null,
        whatsapp_qr: null,
        whatsapp_qr_expires_at: null,
        whatsapp_error: null,
        updated_at: db.fn.now(),
      });
    return this.getConnection(organizationId);
  }

  async disconnect(organizationId: string): Promise<WhatsappConnection> {
    await this.assertOrganizationExists(organizationId);
    const db = this.database.getClient();
    await db("organization_config")
      .where({ organization_id: organizationId })
      .update({
        whatsapp_connect_requested: false,
        whatsapp_status: "disconnecting",
        whatsapp_qr: null,
        whatsapp_qr_expires_at: null,
        updated_at: db.fn.now(),
      });
    return this.getConnection(organizationId);
  }
}
