import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("users", "is_verified");
  if (hasColumn) {
    await knex.schema.alterTable("users", (table) => {
      table.renameColumn("is_verified", "is_disabled");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("users", "is_disabled");
  if (hasColumn) {
    await knex.schema.alterTable("users", (table) => {
      table.renameColumn("is_disabled", "is_verified");
    });
  }
}
