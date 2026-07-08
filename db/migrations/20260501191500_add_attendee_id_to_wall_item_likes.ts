import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wall_item_likes", (table) => {
    table
      .uuid("attendee_id")
      .nullable()
      .references("id")
      .inTable("meet_attendees")
      .onDelete("CASCADE");
  });

  await knex.schema.alterTable("wall_item_likes", (table) => {
    table.uuid("user_id").nullable().alter();
    table.index(["attendee_id"]);
    table.unique(["wall_item_id", "attendee_id"]);
  });

  await knex.raw(`
    ALTER TABLE "wall_item_likes"
    ADD CONSTRAINT "wall_item_likes_actor_check"
    CHECK (num_nonnulls("user_id", "attendee_id") = 1)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "wall_item_likes"
    DROP CONSTRAINT IF EXISTS "wall_item_likes_actor_check"
  `);

  await knex.schema.alterTable("wall_item_likes", (table) => {
    table.dropUnique(["wall_item_id", "attendee_id"]);
    table.dropIndex(["attendee_id"]);
    table.dropColumn("attendee_id");
  });

  await knex.schema.alterTable("wall_item_likes", (table) => {
    table.uuid("user_id").notNullable().alter();
  });
}
