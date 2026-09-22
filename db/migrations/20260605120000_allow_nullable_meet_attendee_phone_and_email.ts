import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "meet_attendees"
    DROP CONSTRAINT IF EXISTS "meet_attendees_identity_check"
  `);

  await knex.raw(`
    ALTER TABLE "meet_attendees"
    ADD CONSTRAINT "meet_attendees_identity_check"
    CHECK (
      "user_id" IS NOT NULL OR "name" IS NOT NULL
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "meet_attendees"
    DROP CONSTRAINT IF EXISTS "meet_attendees_identity_check"
  `);

  await knex.raw(`
    ALTER TABLE "meet_attendees"
    ADD CONSTRAINT "meet_attendees_identity_check"
    CHECK (
      "user_id" IS NOT NULL OR (
        "name" IS NOT NULL AND
        "phone" IS NOT NULL AND
        "email" IS NOT NULL
      )
    )
  `);
}
