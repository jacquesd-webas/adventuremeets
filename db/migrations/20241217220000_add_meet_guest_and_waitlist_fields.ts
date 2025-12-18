import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.boolean("allow_guests").notNullable().defaultTo(false);
    table.integer("max_guests");
    table.text("waitlist_message");
    table.boolean("allow_minor_indemnity").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("allow_minor_indemnity");
    table.dropColumn("waitlist_message");
    table.dropColumn("max_guests");
    table.dropColumn("allow_guests");
  });
}
