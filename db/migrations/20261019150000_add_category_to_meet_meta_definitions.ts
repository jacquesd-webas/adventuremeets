import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_meta_definitions", (table) => {
    table.string("category", 1).notNullable().defaultTo("F");
    table.check(
      "category in ('T', 'M', 'I', 'F')",
      undefined,
      "meet_meta_definitions_category_check",
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_meta_definitions", (table) => {
    table.dropColumn("category");
  });
}
