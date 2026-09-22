import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.dropForeign(["user_id"]);
  });

  await knex.schema.alterTable("meet_attendees", (table) => {
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.dropForeign(["user_id"]);
  });

  await knex.schema.alterTable("meet_attendees", (table) => {
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });
}
