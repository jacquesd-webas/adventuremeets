import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasCustomField1HelperText = await knex.schema.hasColumn(
    "organizations",
    "custom_field1_helper_text",
  );
  const hasCustomField2HelperText = await knex.schema.hasColumn(
    "organizations",
    "custom_field2_helper_text",
  );

  if (!hasCustomField1HelperText || !hasCustomField2HelperText) {
    await knex.schema.alterTable("organizations", (table) => {
      if (!hasCustomField1HelperText) {
        table.string("custom_field1_helper_text");
      }
      if (!hasCustomField2HelperText) {
        table.string("custom_field2_helper_text");
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCustomField1HelperText = await knex.schema.hasColumn(
    "organizations",
    "custom_field1_helper_text",
  );
  const hasCustomField2HelperText = await knex.schema.hasColumn(
    "organizations",
    "custom_field2_helper_text",
  );

  if (hasCustomField1HelperText || hasCustomField2HelperText) {
    await knex.schema.alterTable("organizations", (table) => {
      if (hasCustomField1HelperText) {
        table.dropColumn("custom_field1_helper_text");
      }
      if (hasCustomField2HelperText) {
        table.dropColumn("custom_field2_helper_text");
      }
    });
  }
}
