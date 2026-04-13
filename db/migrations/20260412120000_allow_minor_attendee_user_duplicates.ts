import type { Knex } from "knex";

const LEGACY_UNIQUE_CONSTRAINT =
  "meet_attendees_meet_id_user_id_unique";
const NON_MINOR_UNIQUE_INDEX =
  "meet_attendees_meet_id_user_id_non_minor_unique";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "meet_attendees"
    DROP CONSTRAINT IF EXISTS "${LEGACY_UNIQUE_CONSTRAINT}"
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS "${NON_MINOR_UNIQUE_INDEX}"
    ON "meet_attendees" ("meet_id", "user_id")
    WHERE "user_id" IS NOT NULL AND "is_minor" = false
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS "${NON_MINOR_UNIQUE_INDEX}"
  `);

  await knex.raw(`
    ALTER TABLE "meet_attendees"
    ADD CONSTRAINT "${LEGACY_UNIQUE_CONSTRAINT}"
    UNIQUE ("meet_id", "user_id")
  `);
}
