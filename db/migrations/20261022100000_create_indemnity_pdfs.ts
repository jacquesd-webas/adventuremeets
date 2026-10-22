import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("indemnity_pdfs", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("object_key").notNullable();
    table.index("object_key");
    table.string("filename").notNullable();
    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.schema.alterTable("meets", (table) => {
    table
      .uuid("indemnity_pdfs_id")
      .nullable()
      .references("id")
      .inTable("indemnity_pdfs")
      .onDelete("SET NULL");
    table.index("indemnity_pdfs_id");
  });

  await knex.raw(`
    INSERT INTO indemnity_pdfs (id, object_key, filename, created_at)
    SELECT meet_id, object_key, filename, created_at
    FROM meet_indemnity_templates
  `);
  await knex.raw(`
    UPDATE meets AS m
    SET indemnity_pdfs_id = old.meet_id
    FROM meet_indemnity_templates AS old
    WHERE old.meet_id = m.id
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.dropColumn("indemnity_pdfs_id");
  });
  await knex.schema.dropTable("indemnity_pdfs");
}
