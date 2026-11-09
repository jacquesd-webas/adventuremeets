import type { Knex } from "knex";

const nobodyEmail = "nobody@adventuremeets.com";

export async function up(knex: Knex): Promise<void> {
  await knex("users").insert({
    email: nobodyEmail,
    first_name: "Nobody",
    password_hash: "*LOCKED*",
  });
}

export async function down(knex: Knex): Promise<void> {
  const nobody = await knex("users").where({ email: nobodyEmail }).first("id");
  if (!nobody) return;
  const meet = await knex("meets")
    .where({ organizer_id: nobody.id })
    .first("id");
  if (meet) {
    throw new Error(
      "Cannot remove the Nobody user while imported meets use it",
    );
  }
  await knex("users").where({ id: nobody.id }).del();
}
