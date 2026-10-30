import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("meet_indemnity_templates", (table) => {
    table
      .uuid("meet_id")
      .primary()
      .references("id")
      .inTable("meets")
      .onDelete("CASCADE");
    table.string("object_key").notNullable();
    table.string("filename").notNullable();
    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("meet_indemnity_templates");
}
