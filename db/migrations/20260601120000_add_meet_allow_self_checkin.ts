import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.boolean("allow_self_checkin").notNullable().defaultTo(false);
    table.boolean("allow_walkins").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("allow_walkins");
    table.dropColumn("allow_self_checkin");
  });
}
