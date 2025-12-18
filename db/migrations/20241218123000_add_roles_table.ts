import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("roles", (table) => {
    table.integer("id").primary();
    table.string("name").notNullable().unique();
  });

  await knex("roles").insert([
    { id: 1, name: "superuser" },
    { id: 2, name: "admin" },
    { id: 3, name: "organizer" },
    { id: 4, name: "member" }
  ]);

  await knex.schema.alterTable("user_organization_memberships", (table) => {
    table
      .integer("role_id")
      .notNullable()
      .defaultTo(4)
      .references("id")
      .inTable("roles")
      .onDelete("RESTRICT");
  });

  await knex("user_organization_memberships")
    .where({ role: "superuser" })
    .update({ role_id: 1 });
  await knex("user_organization_memberships")
    .where({ role: "admin" })
    .update({ role_id: 2 });
  await knex("user_organization_memberships")
    .where({ role: "organizer" })
    .update({ role_id: 3 });
  await knex("user_organization_memberships")
    .where({ role: "member" })
    .update({ role_id: 4 });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user_organization_memberships", (table) => {
    table.dropColumn("role_id");
  });
  await knex.schema.dropTableIfExists("roles");
}
