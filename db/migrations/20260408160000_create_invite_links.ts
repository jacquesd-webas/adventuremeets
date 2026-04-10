import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("invite_links", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("org_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("expires_at", { useTz: true }).notNullable();
    table.timestamp("accepted_at", { useTz: true }).nullable();
    table.timestamp("declined_at", { useTz: true }).nullable();
    table.string("email").notNullable();
    table.string("token").notNullable().unique();
    table
      .integer("role_id")
      .notNullable()
      .defaultTo(4)
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");
    table
      .uuid("created_by")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.index(["org_id"]);
    table.index(["email"]);
    table.index(["expires_at"]);
    table.index(["accepted_at"]);
    table.index(["declined_at"]);
    table.index(["role_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("invite_links");
}
