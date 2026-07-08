import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasCustomField1Name = await knex.schema.hasColumn(
    "organizations",
    "custom_field1_name",
  );
  const hasCustomField2Name = await knex.schema.hasColumn(
    "organizations",
    "custom_field2_name",
  );

  if (!hasCustomField1Name || !hasCustomField2Name) {
    await knex.schema.alterTable("organizations", (table) => {
      if (!hasCustomField1Name) {
        table.string("custom_field1_name");
      }
      if (!hasCustomField2Name) {
        table.string("custom_field2_name");
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCustomField1Name = await knex.schema.hasColumn(
    "organizations",
    "custom_field1_name",
  );
  const hasCustomField2Name = await knex.schema.hasColumn(
    "organizations",
    "custom_field2_name",
  );

  if (hasCustomField1Name || hasCustomField2Name) {
    await knex.schema.alterTable("organizations", (table) => {
      if (hasCustomField1Name) {
        table.dropColumn("custom_field1_name");
      }
      if (hasCustomField2Name) {
        table.dropColumn("custom_field2_name");
      }
    });
  }
}
