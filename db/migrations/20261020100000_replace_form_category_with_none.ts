import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE "meet_meta_definitions" DROP CONSTRAINT "meet_meta_definitions_category_check"',
  );
  await knex.raw(
    'ALTER TABLE "meet_meta_definitions" ALTER COLUMN "category" SET DEFAULT \'N\'',
  );
  await knex("meet_meta_definitions")
    .where({ category: "F" })
    .update({ category: "N" });
  await knex.raw(
    "ALTER TABLE \"meet_meta_definitions\" ADD CONSTRAINT \"meet_meta_definitions_category_check\" CHECK (category IN ('T', 'M', 'I', 'N', 'P'))",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE "meet_meta_definitions" DROP CONSTRAINT "meet_meta_definitions_category_check"',
  );
  await knex.raw(
    'ALTER TABLE "meet_meta_definitions" ALTER COLUMN "category" SET DEFAULT \'F\'',
  );
  await knex("meet_meta_definitions")
    .where({ category: "N" })
    .update({ category: "F" });
  await knex.raw(
    "ALTER TABLE \"meet_meta_definitions\" ADD CONSTRAINT \"meet_meta_definitions_category_check\" CHECK (category IN ('T', 'M', 'I', 'F', 'P'))",
  );
}
