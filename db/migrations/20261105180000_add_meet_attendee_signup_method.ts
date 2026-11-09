import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.string("signup_method", 1).nullable();
  });
  await knex.raw(`
    ALTER TABLE meet_attendees
    ADD CONSTRAINT meet_attendees_signup_method_check
    CHECK (signup_method IN ('I', 'S', 'W', 'M'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_attendees", (table) => {
    table.dropColumn("signup_method");
  });
}
