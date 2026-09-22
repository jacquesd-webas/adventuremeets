import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("users", "email_verified");
  if (hasColumn) {
    await knex.schema.alterTable("users", (table) => {
      table.dropColumn("email_verified");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("users", "email_verified");
  if (!hasColumn) {
    await knex.schema.alterTable("users", (table) => {
      table.boolean("email_verified").defaultTo(false);
    });
  }
}
