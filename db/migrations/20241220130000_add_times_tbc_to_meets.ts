import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.boolean("times_tbc").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("times_tbc");
  });
}
