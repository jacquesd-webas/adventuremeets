import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wall_item", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table
      .uuid("created_by")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("attendee_id")
      .nullable()
      .references("id")
      .inTable("meet_attendees")
      .onDelete("SET NULL");
    table.text("comment");
    table.integer("stars");
    table.string("object_key");
    table.string("url");
    table.string("content_type");
    table.bigInteger("size_bytes");
    table.string("aspect", 1);
    table.integer("favourite").notNullable().defaultTo(0);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(["meet_id"]);
  });

  await knex.raw(`
    ALTER TABLE "wall_item"
    ADD CONSTRAINT "wall_item_stars_check"
    CHECK ("stars" IS NULL OR ("stars" >= 1 AND "stars" <= 5))
  `);

  await knex.raw(`
    ALTER TABLE "wall_item"
    ADD CONSTRAINT "wall_item_content_check"
    CHECK (
      "comment" IS NOT NULL OR
      "stars" IS NOT NULL OR
      "object_key" IS NOT NULL OR
      "url" IS NOT NULL
    )
  `);

  await knex.raw(`
    ALTER TABLE "wall_item"
    ADD CONSTRAINT "wall_item_creator_check"
    CHECK (
      "created_by" IS NOT NULL OR
      "attendee_id" IS NOT NULL
    )
  `);

  await knex.schema.createTable("wall_item_likes", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("wall_item_id")
      .notNullable()
      .references("id")
      .inTable("wall_item")
      .onDelete("CASCADE");
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["wall_item_id", "user_id"]);
    table.index(["wall_item_id"]);
    table.index(["user_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wall_item_likes");

  await knex.raw(`
    ALTER TABLE "wall_item"
    DROP CONSTRAINT IF EXISTS "wall_item_creator_check"
  `);

  await knex.raw(`
    ALTER TABLE "wall_item"
    DROP CONSTRAINT IF EXISTS "wall_item_content_check"
  `);

  await knex.raw(`
    ALTER TABLE "wall_item"
    DROP CONSTRAINT IF EXISTS "wall_item_stars_check"
  `);

  await knex.schema.dropTableIfExists("wall_item");
}
