import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasIsPrivate = await knex.schema.hasColumn("organizations", "is_private");
  if (!hasIsPrivate) {
    await knex.schema.alterTable("organizations", (table) => {
      table.boolean("is_private").notNullable().defaultTo(true);
    });
  }

  const hasTheme = await knex.schema.hasColumn("organizations", "theme");
  if (!hasTheme) {
    await knex.schema.alterTable("organizations", (table) => {
      table.string("theme");
    });
  }

  const hasCanViewAllMeets = await knex.schema.hasColumn(
    "organizations",
    "can_view_all_meets",
  );
  if (!hasCanViewAllMeets) {
    await knex.schema.alterTable("organizations", (table) => {
      table.boolean("can_view_all_meets").notNullable().defaultTo(true);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTheme = await knex.schema.hasColumn("organizations", "theme");
  if (hasTheme) {
    await knex.schema.alterTable("organizations", (table) => {
      table.dropColumn("theme");
    });
  }

  const hasIsPrivate = await knex.schema.hasColumn("organizations", "is_private");
  if (hasIsPrivate) {
    await knex.schema.alterTable("organizations", (table) => {
      table.dropColumn("is_private");
    });
  }
}
