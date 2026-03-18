import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(
    "meet_attendee_indemnity_acceptances",
    (table) => {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table
        .uuid("attendee_id")
        .notNullable()
        .references("id")
        .inTable("meet_attendees")
        .onDelete("CASCADE");
      table
        .uuid("meet_id")
        .notNullable()
        .references("id")
        .inTable("meets")
        .onDelete("CASCADE");
      table.timestamp("accepted_at", { useTz: true }).defaultTo(knex.fn.now());
      table.text("indemnity_text_hash");
      table.string("acceptance_ip");
      table.text("acceptance_user_agent");
      table.string("accepted_by_name");
      table.string("accepted_by_email");
      table.string("accepted_by_phone");
      table.string("locale");
      table.string("time_zone");
      table.index(["attendee_id"]);
      table.index(["meet_id"]);
      table.index(["accepted_at"]);
    },
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(
    "meet_attendee_indemnity_acceptances",
  );
}
