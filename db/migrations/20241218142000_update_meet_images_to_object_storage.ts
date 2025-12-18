import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_images", (table) => {
    table.dropColumn("image_base64");
    table.string("object_key").notNullable();
    table.string("url").notNullable();
    table.string("content_type");
    table.bigInteger("size_bytes");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_images", (table) => {
    table.dropColumn("size_bytes");
    table.dropColumn("content_type");
    table.dropColumn("url");
    table.dropColumn("object_key");
    table.text("image_base64").notNullable();
  });
}
