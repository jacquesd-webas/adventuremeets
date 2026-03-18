import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasAttempts = await knex.schema.hasColumn(
    "users",
    "email_verification_attempts"
  );
  if (!hasAttempts) {
    await knex.schema.alterTable("users", (table) => {
      table.integer("email_verification_attempts").notNullable().defaultTo(0);
    });
  }

  const hasLockedUntil = await knex.schema.hasColumn(
    "users",
    "email_verification_locked_until"
  );
  if (!hasLockedUntil) {
    await knex.schema.alterTable("users", (table) => {
      table.timestamp("email_verification_locked_until", { useTz: true });
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasAttempts = await knex.schema.hasColumn(
    "users",
    "email_verification_attempts"
  );
  if (hasAttempts) {
    await knex.schema.alterTable("users", (table) => {
      table.dropColumn("email_verification_attempts");
    });
  }

  const hasLockedUntil = await knex.schema.hasColumn(
    "users",
    "email_verification_locked_until"
  );
  if (hasLockedUntil) {
    await knex.schema.alterTable("users", (table) => {
      table.dropColumn("email_verification_locked_until");
    });
  }
}
