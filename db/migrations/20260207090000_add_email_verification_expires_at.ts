import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(
    "users",
    "email_verification_expires_at"
  );
  if (!hasColumn) {
    await knex.schema.alterTable("users", (table) => {
      table.timestamp("email_verification_expires_at", { useTz: true });
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(
    "users",
    "email_verification_expires_at"
  );
  if (hasColumn) {
    await knex.schema.alterTable("users", (table) => {
      table.dropColumn("email_verification_expires_at");
    });
  }
}
