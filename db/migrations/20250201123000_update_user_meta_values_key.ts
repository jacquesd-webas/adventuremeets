import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user_meta_values", (table) => {
    table.dropColumn("meta_definition_id");
    table.string("key").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user_meta_values", (table) => {
    table.dropColumn("key");
    table.uuid("meta_definition_id");
  });
}
