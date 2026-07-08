import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wall_item_likes", (table) => {
    table.string("reaction");
  });

  await knex("wall_item_likes").update({ reaction: "like" });

  await knex.schema.alterTable("wall_item_likes", (table) => {
    table.string("reaction").notNullable().alter();
  });

  await knex.raw(`
    ALTER TABLE "wall_item_likes"
    ADD CONSTRAINT "wall_item_likes_reaction_check"
    CHECK ("reaction" IN ('like', 'dislike', 'heart'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "wall_item_likes"
    DROP CONSTRAINT IF EXISTS "wall_item_likes_reaction_check"
  `);

  await knex.schema.alterTable("wall_item_likes", (table) => {
    table.dropColumn("reaction");
  });
}
