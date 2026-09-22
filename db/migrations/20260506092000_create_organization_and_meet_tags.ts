import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("organization_tags", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("organization_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table.string("name").notNullable();
    table.string("color").notNullable();

    table.index(["organization_id"]);
  });

  await knex.schema.createTable("meet_tags", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table
      .uuid("tag_id")
      .notNullable()
      .references("id")
      .inTable("organization_tags")
      .onDelete("CASCADE");

    table.index(["meet_id"]);
    table.index(["tag_id"]);
    table.unique(["meet_id", "tag_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("meet_tags");
  await knex.schema.dropTableIfExists("organization_tags");
}
