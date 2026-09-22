import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_images", (table) => {
    table.string("aspect", 1).notNullable().defaultTo("O");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_images", (table) => {
    table.dropColumn("aspect");
  });
}
