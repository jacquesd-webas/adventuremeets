import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("meet_images", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table.text("image_base64").notNullable();
    table.boolean("is_primary").notNullable().defaultTo(false);
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.index(["meet_id"]);
  });

  await knex.schema.alterTable("meets", (table) => {
    table.decimal("location_lat", 10, 7);
    table.decimal("location_long", 10, 7);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("location_long");
    table.dropColumn("location_lat");
  });
  await knex.schema.dropTableIfExists("meet_images");
}
