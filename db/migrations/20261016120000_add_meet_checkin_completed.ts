import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.boolean("checkin_completed").notNullable().defaultTo(false);
  });

  await knex("meets").where("status_id", 7).update({ checkin_completed: true });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("checkin_completed");
  });
}
