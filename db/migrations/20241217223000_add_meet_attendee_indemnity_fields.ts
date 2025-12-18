import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.integer("guests").notNullable().defaultTo(0);
    table.boolean("indemnity_accepted").notNullable().defaultTo(false);
    table.text("indemnity_minors");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.dropColumn("indemnity_minors");
    table.dropColumn("indemnity_accepted");
    table.dropColumn("guests");
  });
}
