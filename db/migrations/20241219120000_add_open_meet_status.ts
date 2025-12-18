import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx("meet_statuses")
      .where("id", ">=", 3)
      .update({ id: trx.raw("id + 10") });

    await trx("meet_statuses")
      .where("id", ">=", 13)
      .update({ id: trx.raw("id - 9") });

    await trx("meet_statuses").insert({ id: 3, name: "Open" });

    await trx("meets")
      .where("status_id", ">=", 3)
      .update({ status_id: trx.raw("status_id + 10") });

    await trx("meets")
      .where("status_id", ">=", 13)
      .update({ status_id: trx.raw("status_id - 9") });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx("meets")
      .where("status_id", ">=", 4)
      .update({ status_id: trx.raw("status_id + 9") });

    await trx("meet_statuses").where({ id: 3 }).del();

    await trx("meet_statuses")
      .where("id", ">=", 4)
      .update({ id: trx.raw("id - 1") });

    await trx("meets")
      .where("status_id", ">=", 13)
      .update({ status_id: trx.raw("status_id - 10") });
  });
}
