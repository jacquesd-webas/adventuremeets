import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("templates", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("organization_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table.string("name").notNullable();
    table.text("description");
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("deleted_at", { useTz: true });
    table.index(["organization_id"]);
  });

  await knex.schema.alterTable("organization_meta_definitions", (table) => {
    table.dropForeign(["organization_id"]);
  });
  await knex.raw(
    'ALTER TABLE "organization_meta_definitions" DROP CONSTRAINT IF EXISTS "organization_meta_definitions_organization_id_field_key_unique"'
  );
  await knex.schema.alterTable("organization_meta_definitions", (table) => {
    table.dropColumn("organization_id");
    table
      .uuid("template_id")
      .notNullable()
      .references("id")
      .inTable("templates")
      .onDelete("CASCADE");
    table.unique(["template_id", "field_key"]);
    table.index(["template_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization_meta_definitions", (table) => {
    table.dropForeign(["template_id"]);
    table.dropIndex(["template_id"]);
    table.dropColumn("template_id");
    table
      .uuid("organization_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
  });
  await knex.raw(
    'ALTER TABLE "organization_meta_definitions" DROP CONSTRAINT IF EXISTS "organization_meta_definitions_template_id_field_key_unique"'
  );
  await knex.schema.alterTable("organization_meta_definitions", (table) => {
    table.unique(["organization_id", "field_key"]);
  });
  await knex.schema.dropTableIfExists("templates");
}
