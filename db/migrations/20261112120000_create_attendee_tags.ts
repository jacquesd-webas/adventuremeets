import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("attendee_tags", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("attendee_id")
      .notNullable()
      .references("id")
      .inTable("meet_attendees")
      .onDelete("CASCADE");
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table.string("tag", 255).notNullable();

    table.index(["meet_id", "tag"]);
    table.unique(["attendee_id", "tag"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("attendee_tags");
}
