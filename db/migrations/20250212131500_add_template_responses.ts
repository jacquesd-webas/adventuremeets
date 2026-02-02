import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("templates", (table) => {
    table.text("approved_response");
    table.text("reject_response");
    table.text("waitlist_response");
    table.text("indemnity");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("templates", (table) => {
    table.dropColumn("indemnity");
    table.dropColumn("approved_response");
    table.dropColumn("reject_response");
    table.dropColumn("waitlist_response");
  });
}
