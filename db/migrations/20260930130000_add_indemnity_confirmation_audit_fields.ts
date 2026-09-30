import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(
    "meet_attendee_indemnity_acceptances",
    (table) => {
      table.timestamp("confirmed_at", { useTz: true });
      table.string("confirmation_method");
    },
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(
    "meet_attendee_indemnity_acceptances",
    (table) => {
      table.dropColumn("confirmation_method");
      table.dropColumn("confirmed_at");
    },
  );
}
