import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("outbound_emails");
  if (exists) return;

  await knex.schema.createTable("outbound_emails", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("organization_id")
      .nullable()
      .references("id")
      .inTable("organizations")
      .onDelete("SET NULL");
    table
      .uuid("meet_id")
      .nullable()
      .references("id")
      .inTable("meets")
      .onDelete("SET NULL");
    table
      .uuid("attendee_id")
      .nullable()
      .references("id")
      .inTable("meet_attendees")
      .onDelete("SET NULL");
    table
      .uuid("user_id")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.string("recipient_email").notNullable();
    table.string("subject").notNullable();
    table.string("template_name");
    table
      .string("status")
      .notNullable()
      .defaultTo("pending");
    table.string("transport_message_id");
    table.string("provider_message_id");
    table.string("tracking_token");
    table.string("bounce_type");
    table.text("failure_reason");

    table.timestamp("queued_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("sent_at", { useTz: true });
    table.timestamp("delivered_at", { useTz: true });
    table.timestamp("bounced_at", { useTz: true });
    table.timestamp("opened_at", { useTz: true });
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(["organization_id", "created_at"]);
    table.index(["meet_id", "created_at"]);
    table.index(["attendee_id", "created_at"]);
    table.index(["user_id", "created_at"]);
    table.index(["recipient_email", "created_at"]);
    table.index(["status", "created_at"]);
    table.unique(["tracking_token"]);
  });

  await knex.raw(`
    ALTER TABLE "outbound_emails"
    ADD CONSTRAINT "outbound_emails_status_check"
    CHECK (
      "status" IN ('pending', 'sent', 'delivered', 'bounced', 'failed', 'opened', 'complained')
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "outbound_emails"
    DROP CONSTRAINT IF EXISTS "outbound_emails_status_check"
  `);

  await knex.schema.dropTableIfExists("outbound_emails");
}
