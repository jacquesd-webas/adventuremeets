import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.string("ice_phone");
    table.string("ice_name");
    table.string("ice_medical_aid");
    table.string("ice_medical_aid_number");
    table.timestamp("ice_dob");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("ice_dob");
    table.dropColumn("ice_medical_aid_number");
    table.dropColumn("ice_medical_aid");
    table.dropColumn("ice_name");
    table.dropColumn("ice_phone");
  });
}
