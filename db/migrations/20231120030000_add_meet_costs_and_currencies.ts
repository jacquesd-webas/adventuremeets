import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("currencies", (table) => {
    table.increments("id").primary();
    table.string("code", 3).notNullable().unique(); // ISO 4217 alpha-3
    table.string("name").notNullable();
    table.string("symbol", 8);
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex("currencies").insert([
    { code: "ZAR", name: "South African Rand", symbol: "R" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" }
  ]);

  await knex.schema.table("meets", (table) => {
    table
      .integer("currency_id")
      .unsigned()
      .references("id")
      .inTable("currencies")
      .onDelete("SET NULL");
    table.bigInteger("cost_cents").notNullable().defaultTo(0);
    table.bigInteger("deposit_cents").notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("meets", (table) => {
    table.dropColumns("currency_id", "cost_cents", "deposit_cents");
  });
  await knex.schema.dropTableIfExists("currencies");
}
