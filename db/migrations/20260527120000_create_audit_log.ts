import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("audit_log", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("org_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table
      .uuid("user_id")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .uuid("attendee_id")
      .nullable()
      .references("id")
      .inTable("meet_attendees")
      .onDelete("SET NULL");
    table
      .uuid("meet_id")
      .nullable()
      .references("id")
      .inTable("meets")
      .onDelete("SET NULL");
    table.text("description").notNullable();
    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.index(["org_id", "created_at"]);
    table.index(["org_id", "user_id", "created_at"]);
    table.index(["org_id", "attendee_id", "created_at"]);
    table.index(["meet_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_log");
}
