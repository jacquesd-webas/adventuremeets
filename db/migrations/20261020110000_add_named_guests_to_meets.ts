import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.boolean("named_guests").notNullable().defaultTo(false);
  });
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.jsonb("guests_list");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.dropColumn("guests_list");
  });
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("named_guests");
  });
}
