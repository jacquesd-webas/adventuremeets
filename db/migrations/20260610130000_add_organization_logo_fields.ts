import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasLogoObjectKey = await knex.schema.hasColumn(
    "organizations",
    "logo_object_key",
  );
  const hasLogoUrl = await knex.schema.hasColumn("organizations", "logo_url");

  if (!hasLogoObjectKey || !hasLogoUrl) {
    await knex.schema.alterTable("organizations", (table) => {
      if (!hasLogoObjectKey) {
        table.string("logo_object_key");
      }
      if (!hasLogoUrl) {
        table.string("logo_url");
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasLogoUrl = await knex.schema.hasColumn("organizations", "logo_url");
  const hasLogoObjectKey = await knex.schema.hasColumn(
    "organizations",
    "logo_object_key",
  );

  if (hasLogoUrl || hasLogoObjectKey) {
    await knex.schema.alterTable("organizations", (table) => {
      if (hasLogoUrl) {
        table.dropColumn("logo_url");
      }
      if (hasLogoObjectKey) {
        table.dropColumn("logo_object_key");
      }
    });
  }
}
