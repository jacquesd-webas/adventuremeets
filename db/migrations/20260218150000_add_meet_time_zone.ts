import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasTimeZone = await knex.schema.hasColumn("meets", "time_zone");
  if (!hasTimeZone) {
    await knex.schema.alterTable("meets", (table) => {
      table.string("time_zone").defaultTo("Africa/Johannesburg");
    });
  }

  await knex("meets")
    .whereNull("time_zone")
    .update({ time_zone: "Africa/Johannesburg" });
}

export async function down(knex: Knex): Promise<void> {
  const hasTimeZone = await knex.schema.hasColumn("meets", "time_zone");
  if (hasTimeZone) {
    await knex.schema.alterTable("meets", (table) => {
      table.dropColumn("time_zone");
    });
  }
}
