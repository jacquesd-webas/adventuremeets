import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  await knex.schema.createTable("meet_statuses", (table) => {
    table.integer("id").primary(); // static ids: 1 Draft, 2 Published, 3 Closed, 4 Cancelled, 5 Postponed
    table.string("name").notNullable().unique();
  });

  await knex("meet_statuses").insert([
    { id: 1, name: "Draft" },
    { id: 2, name: "Published" },
    { id: 3, name: "Closed" },
    { id: 4, name: "Cancelled" },
    { id: 5, name: "Postponed" }
  ]);

  await knex.schema.createTable("meets", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.text("description");
    table
      .uuid("organizer_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("location").notNullable();
    table.timestamp("start_time", { useTz: true }).notNullable();
    table.timestamp("end_time", { useTz: true }).notNullable();
    table.timestamp("opening_date", { useTz: true }).notNullable();
    table.timestamp("closing_date", { useTz: true }).notNullable();
    table.timestamp("scheduled_date", { useTz: true }).notNullable(); // date attendees should block off
    table.timestamp("confirm_date", { useTz: true }); // when organizer confirms final attendee list
    table.integer("capacity").notNullable().defaultTo(0);
    table.integer("waitlist_size").notNullable().defaultTo(0);
    table
      .integer("status_id")
      .notNullable()
      .defaultTo(1)
      .references("id")
      .inTable("meet_statuses")
      .onDelete("RESTRICT");
    table.boolean("auto_placement").notNullable().defaultTo(true); // true = auto-place until capacity; false = organizer assigns
    table.boolean("auto_promote_waitlist").notNullable().defaultTo(true); // auto-fill from waitlist when space opens
    table.boolean("is_virtual").notNullable().defaultTo(false);
    table.string("access_link"); // virtual link if applicable
    table.text("confirm_message");
    table.text("reject_message");
    table.jsonb("meta_definition").defaultTo("{}"); // structure describing extra questions (AV style)
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.index(["organizer_id", "status_id"]);
    table.index(["opening_date", "closing_date"]);
  });

  await knex.schema.createTable("meet_attendees", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("status").notNullable().defaultTo("pending"); // pending, confirmed, waitlisted, canceled
    table.integer("sequence").notNullable().defaultTo(0); // ordering for waitlist/attendee
    table.timestamp("responded_at", { useTz: true });
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.unique(["meet_id", "user_id"]);
  });

  await knex.schema.createTable("meet_meta_definitions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meet_id")
      .notNullable()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table.string("field_key").notNullable();
    table.string("label").notNullable();
    table.string("field_type").notNullable();
    table.boolean("required").notNullable().defaultTo(false);
    table.integer("position").notNullable().defaultTo(0);
    table.jsonb("config").defaultTo("{}"); // options, placeholder, etc.
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.unique(["meet_id", "field_key"]);
  });

  await knex.schema.createTable("meet_meta_values", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meta_definition_id")
      .notNullable()
      .references("id")
      .inTable("meet_meta_definitions")
      .onDelete("CASCADE");
    table.uuid("meet_id").notNullable().references("id").inTable("meets").onDelete("CASCADE");
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.text("value").notNullable(); // stored as text (no JSON) per AV-style field
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.unique(["meta_definition_id", "user_id"]);
    table.index(["meet_id", "user_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("meet_meta_values");
  await knex.schema.dropTableIfExists("meet_meta_definitions");
  await knex.schema.dropTableIfExists("meet_attendees");
  await knex.schema.dropTableIfExists("meets");
  await knex.schema.dropTableIfExists("meet_statuses");
}
