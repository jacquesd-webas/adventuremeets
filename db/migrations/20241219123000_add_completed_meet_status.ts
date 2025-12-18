import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex("meet_statuses").where({ id: 7 }).first();
  if (!exists) {
    await knex("meet_statuses").insert({ id: 7, name: "Completed" });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex("meet_statuses").where({ id: 7 }).del();
}
