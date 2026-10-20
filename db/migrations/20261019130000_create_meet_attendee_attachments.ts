import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("meet_attendee_attachments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table
      .uuid("attendee_id")
      .notNullable()
      .references("id")
      .inTable("meet_attendees")
      .onDelete("CASCADE");
    table.string("kind").notNullable();
    table.string("object_key").notNullable();
    table.string("filename").notNullable();
    table.string("content_type").notNullable();
    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(["attendee_id", "kind"]);
    table.index(["meet_id", "attendee_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("meet_attendee_attachments");
}
