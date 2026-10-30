import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE "meet_meta_definitions" DROP CONSTRAINT "meet_meta_definitions_category_check"',
  );
  await knex.raw(
    "ALTER TABLE \"meet_meta_definitions\" ADD CONSTRAINT \"meet_meta_definitions_category_check\" CHECK (category IN ('T', 'M', 'I', 'F', 'P'))",
  );
  await knex("meet_meta_definitions")
    .whereNotNull("pdf_form_field_id")
    .update({ category: "P" });
}

export async function down(knex: Knex): Promise<void> {
  await knex("meet_meta_definitions")
    .where({ category: "P" })
    .update({ category: "F" });
  await knex.raw(
    'ALTER TABLE "meet_meta_definitions" DROP CONSTRAINT "meet_meta_definitions_category_check"',
  );
  await knex.raw(
    "ALTER TABLE \"meet_meta_definitions\" ADD CONSTRAINT \"meet_meta_definitions_category_check\" CHECK (category IN ('T', 'M', 'I', 'F'))",
  );
}
