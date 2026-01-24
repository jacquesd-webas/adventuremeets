import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organizations", (table) => {
    table
      .boolean("can_view_all_meets")
      .notNullable()
      .defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organizations", (table) => {
    table.dropColumn("can_view_all_meets");
  });
}
