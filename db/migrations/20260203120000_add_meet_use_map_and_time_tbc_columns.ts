import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.renameColumn("times_tbc", "start_time_tbc");
  });

  await knex.schema.alterTable("meets", (table) => {
    table.boolean("end_time_tbc").notNullable().defaultTo(false);
    table.boolean("use_map").notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("end_time_tbc");
    table.dropColumn("use_map");
  });

  await knex.schema.alterTable("meets", (table) => {
    table.renameColumn("start_time_tbc", "times_tbc");
  });
}
