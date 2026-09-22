import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_ice_info", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE")
      .unique();
    table.string("ice_phone");
    table.string("ice_name");
    table.string("ice_medical_aid");
    table.string("ice_medical_aid_number");
    table.text("ice_medical_history");
    table.timestamp("ice_dob");
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("ice_dob");
    table.dropColumn("ice_medical_aid_number");
    table.dropColumn("ice_medical_aid");
    table.dropColumn("ice_name");
    table.dropColumn("ice_phone");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.string("ice_phone");
    table.string("ice_name");
    table.string("ice_medical_aid");
    table.string("ice_medical_aid_number");
    table.timestamp("ice_dob");
  });

  await knex.schema.dropTableIfExists("user_ice_info");
}
