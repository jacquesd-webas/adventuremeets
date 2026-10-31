import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("organization_config", (table) => {
    table
      .uuid("organization_id")
      .primary()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table.boolean("whatsapp_connect_requested").notNullable().defaultTo(false);
    table.string("whatsapp_status", 20).notNullable().defaultTo("disconnected");
    table.string("whatsapp_phone", 32);
    table.text("whatsapp_qr");
    table.timestamp("whatsapp_qr_expires_at", { useTz: true });
    table.text("whatsapp_error");
    table.timestamp("whatsapp_connected_at", { useTz: true });
    table
      .timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE organization_config
    ADD CONSTRAINT organization_config_whatsapp_status_check
    CHECK (whatsapp_status IN ('disconnected', 'connecting', 'qr', 'connected', 'disconnecting', 'error'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("organization_config");
}
