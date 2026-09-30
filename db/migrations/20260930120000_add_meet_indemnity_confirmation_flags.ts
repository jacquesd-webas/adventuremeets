import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table
      .boolean("need_indemnity_confirmation_email")
      .notNullable()
      .defaultTo(false);
    table
      .boolean("need_indemnity_confirmation_phone")
      .notNullable()
      .defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("need_indemnity_confirmation_phone");
    table.dropColumn("need_indemnity_confirmation_email");
  });
}
