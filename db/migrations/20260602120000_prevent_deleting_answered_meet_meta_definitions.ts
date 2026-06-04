import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_meta_values", (table) => {
    table.dropForeign(["meta_definition_id"]);
  });

  await knex.schema.alterTable("meet_meta_values", (table) => {
    table
      .foreign("meta_definition_id")
      .references("id")
      .inTable("meet_meta_definitions")
      .onDelete("RESTRICT");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_meta_values", (table) => {
    table.dropForeign(["meta_definition_id"]);
  });

  await knex.schema.alterTable("meet_meta_values", (table) => {
    table
      .foreign("meta_definition_id")
      .references("id")
      .inTable("meet_meta_definitions")
      .onDelete("CASCADE");
  });
}
