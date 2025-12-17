import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
  await knex.schema.alterTable("meets", (table) => {
    table
      .string("share_code", 24)
      .notNullable()
      .defaultTo(knex.raw(`substr(encode(gen_random_bytes(12), 'hex'), 1, 12)`))
      .unique()
      .index();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("share_code");
  });
}
