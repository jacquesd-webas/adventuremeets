import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "meet_meta_definitions"
      ALTER COLUMN "field_key" TYPE text,
      ALTER COLUMN "label" TYPE text
  `);
  await knex.raw(`
    ALTER TABLE "organization_meta_definitions"
      ALTER COLUMN "field_key" TYPE text,
      ALTER COLUMN "label" TYPE text
  `);
  await knex.raw(`
    ALTER TABLE "user_meta_values"
      ALTER COLUMN "key" TYPE text
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM "meet_meta_definitions"
        WHERE length("field_key") > 255 OR length("label") > 255
      ) OR EXISTS (
        SELECT 1 FROM "organization_meta_definitions"
        WHERE length("field_key") > 255 OR length("label") > 255
      ) OR EXISTS (
        SELECT 1 FROM "user_meta_values" WHERE length("key") > 255
      ) THEN
        RAISE EXCEPTION 'Cannot restore varchar(255): meta labels or keys exceed 255 characters';
      END IF;
    END
    $$
  `);
  await knex.raw(`
    ALTER TABLE "user_meta_values"
      ALTER COLUMN "key" TYPE varchar(255)
  `);
  await knex.raw(`
    ALTER TABLE "organization_meta_definitions"
      ALTER COLUMN "field_key" TYPE varchar(255),
      ALTER COLUMN "label" TYPE varchar(255)
  `);
  await knex.raw(`
    ALTER TABLE "meet_meta_definitions"
      ALTER COLUMN "field_key" TYPE varchar(255),
      ALTER COLUMN "label" TYPE varchar(255)
  `);
}
