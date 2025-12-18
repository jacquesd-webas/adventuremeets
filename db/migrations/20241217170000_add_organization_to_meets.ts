import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table
      .uuid("organization_id")
      .nullable()
      .references("id")
      .inTable("organizations")
      .onDelete("SET NULL");
    table.index(["organization_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropIndex(["organization_id"]);
    table.dropColumn("organization_id");
  });
}
