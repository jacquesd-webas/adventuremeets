import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.text("invitation_wording");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("invitation_wording");
  });
}
