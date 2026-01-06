import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("message_contents", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("content_hash", 64).notNullable().index();
    table.text("content").notNullable();
    table.unique(["content_hash"]);
  });

  await knex.schema.createTable("messages", (table) => {
    table.uuid("message_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.timestamp("timestamp", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table
      .uuid("attendee_id")
      .references("id")
      .inTable("meet_attendees")
      .onDelete("CASCADE")
      .index();
    table
      .uuid("meet_id")
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE")
      .index();
    table.string("from", 255).notNullable();
    table.string("to", 255).notNullable();
    table
      .uuid("message_content_id")
      .notNullable()
      .references("id")
      .inTable("message_contents")
      .onDelete("RESTRICT")
      .index();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("message_contents");
}
