import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.string("checkin_pin", 6).nullable();
    table.boolean("allow_walkins").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("allow_walkins");
    table.dropColumn("checkin_pin");
  });
}
