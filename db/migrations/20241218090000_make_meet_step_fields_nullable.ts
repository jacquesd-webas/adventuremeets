import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.boolean("has_indemnity").nullable().alter();
    table.boolean("allow_minor_indemnity").nullable().alter();
    table.boolean("allow_guests").nullable().alter();
    table.bigInteger("cost_cents").nullable().alter();
    table.bigInteger("deposit_cents").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.boolean("has_indemnity").notNullable().defaultTo(false).alter();
    table.boolean("allow_minor_indemnity").notNullable().defaultTo(false).alter();
    table.boolean("allow_guests").notNullable().defaultTo(false).alter();
    table.bigInteger("cost_cents").notNullable().defaultTo(0).alter();
    table.bigInteger("deposit_cents").notNullable().defaultTo(0).alter();
  });
}
