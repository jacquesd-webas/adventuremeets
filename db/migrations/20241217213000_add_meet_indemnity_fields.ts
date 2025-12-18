import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.boolean("has_indemnity").notNullable().defaultTo(false);
    table.text("indemnity");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("indemnity");
    table.dropColumn("has_indemnity");
  });
}
