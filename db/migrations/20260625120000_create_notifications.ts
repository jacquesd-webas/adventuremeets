import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("notification_types", (table) => {
    table.integer("id").primary();
    table.string("name").notNullable().unique();
  });

  await knex("notification_types").insert([
    { id: 1, name: "new_meet" },
    { id: 2, name: "organizer_new_attendee" },
    { id: 3, name: "organiser_reminder_responses_needed" },
    { id: 4, name: "organizer_last_minute_attendee" },
    { id: 5, name: "organizer_reminder_checkin_needed" },
  ]);

  await knex.schema.createTable("notifications", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("organization_id")
      .nullable()
      .references("id")
      .inTable("organizations")
      .onDelete("SET NULL");
    table
      .uuid("meet_id")
      .nullable()
      .references("id")
      .inTable("meets")
      .onDelete("SET NULL");
    table
      .uuid("attendee_id")
      .nullable()
      .references("id")
      .inTable("meet_attendees")
      .onDelete("SET NULL");
    table
      .uuid("user_id")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .integer("notification_type_id")
      .notNullable()
      .references("id")
      .inTable("notification_types")
      .onDelete("RESTRICT");
    table.string("hash");

    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.index(["organization_id", "created_at"]);
    table.index(["meet_id", "created_at"]);
    table.index(["attendee_id", "created_at"]);
    table.index(["user_id", "created_at"]);
    table.index(["notification_type_id", "created_at"]);
    table.index(["notification_type_id", "hash", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("notifications");
  await knex.schema.dropTableIfExists("notification_types");
}
