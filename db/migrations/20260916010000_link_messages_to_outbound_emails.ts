import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("messages", (table) => {
    table.uuid("outbound_email_id").nullable()
      .references("id").inTable("outbound_emails").onDelete("SET NULL").index();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("messages", (table) => {
    table.dropColumn("outbound_email_id");
  });
}
