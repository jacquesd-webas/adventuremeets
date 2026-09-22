import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table
      .boolean("require_email")
      .notNullable()
      .defaultTo(true);
    table
      .boolean("require_phone")
      .notNullable()
      .defaultTo(true);
    table
      .boolean("require_org1")
      .notNullable()
      .defaultTo(false);
    table
      .boolean("require_org2")
      .notNullable()
      .defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("require_email");
    table.dropColumn("require_phone");
    table.dropColumn("require_org1");
    table.dropColumn("require_org2");
  });
}
