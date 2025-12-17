import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_meta_values", (table) => {
    table.dropForeign(["user_id"]);
    table.dropUnique(["meta_definition_id", "user_id"]);
    table.dropIndex(["meet_id", "user_id"]);
  });

  await knex.schema.alterTable("meet_meta_values", (table) => {
    table.renameColumn("user_id", "attendee_id");
  });

  await knex.raw(`
    UPDATE "meet_meta_values"
    SET "attendee_id" = "meet_attendees"."id"
    FROM "meet_attendees"
    WHERE "meet_meta_values"."meet_id" = "meet_attendees"."meet_id"
      AND "meet_meta_values"."attendee_id" = "meet_attendees"."user_id"
  `);

  await knex.schema.alterTable("meet_meta_values", (table) => {
    table
      .foreign("attendee_id")
      .references("id")
      .inTable("meet_attendees")
      .onDelete("CASCADE");
    table.unique(["meta_definition_id", "attendee_id"]);
    table.index(["meet_id", "attendee_id"]);
  });

  await knex.schema.alterTable("meet_attendees", (table) => {
    table.uuid("user_id").nullable().alter();
    table.string("name");
    table.string("phone");
    table.string("email");
  });

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

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "meet_attendees"
    DROP CONSTRAINT IF EXISTS "meet_attendees_identity_check"
  `);

  await knex.schema.alterTable("meet_attendees", (table) => {
    table.dropColumn("name");
    table.dropColumn("phone");
    table.dropColumn("email");
    table.uuid("user_id").notNullable().alter();
  });

  await knex.schema.alterTable("meet_meta_values", (table) => {
    table.dropForeign(["attendee_id"]);
    table.dropUnique(["meta_definition_id", "attendee_id"]);
    table.dropIndex(["meet_id", "attendee_id"]);
  });

  await knex.schema.alterTable("meet_meta_values", (table) => {
    table.renameColumn("attendee_id", "user_id");
  });

  await knex.raw(`
    UPDATE "meet_meta_values"
    SET "user_id" = "meet_attendees"."user_id"
    FROM "meet_attendees"
    WHERE "meet_meta_values"."meet_id" = "meet_attendees"."meet_id"
      AND "meet_meta_values"."user_id" = "meet_attendees"."id"
  `);

  await knex.schema.alterTable("meet_meta_values", (table) => {
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.unique(["meta_definition_id", "user_id"]);
    table.index(["meet_id", "user_id"]);
  });
}
