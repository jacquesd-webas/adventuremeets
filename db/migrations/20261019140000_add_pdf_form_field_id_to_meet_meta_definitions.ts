import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_meta_definitions", (table) => {
    table.text("pdf_form_field_id").nullable().defaultTo(null);
  });

  await knex("meet_meta_definitions")
    .whereRaw("config ->> 'source' = ?", ["indemnity-pdf"])
    .whereRaw("jsonb_typeof(config -> 'pdfFieldName') = 'string'")
    .update({ pdf_form_field_id: knex.raw("config ->> 'pdfFieldName'") });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meet_meta_definitions", (table) => {
    table.dropColumn("pdf_form_field_id");
  });
}
