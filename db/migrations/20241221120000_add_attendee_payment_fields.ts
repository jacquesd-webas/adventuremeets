import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.timestamp("paid_deposit_at", { useTz: true });
    table.timestamp("paid_full_at", { useTz: true });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.dropColumn("paid_deposit_at");
    table.dropColumn("paid_full_at");
  });
}
