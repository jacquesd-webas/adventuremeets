import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.string("first_name");
    table.string("last_name");
    table.string("phone");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("phone");
    table.dropColumn("last_name");
    table.dropColumn("first_name");
  });
}
