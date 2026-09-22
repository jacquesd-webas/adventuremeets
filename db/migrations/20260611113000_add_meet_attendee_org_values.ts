import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasOrg1Value = await knex.schema.hasColumn(
    "meet_attendees",
    "org1_value",
  );
  const hasOrg2Value = await knex.schema.hasColumn(
    "meet_attendees",
    "org2_value",
  );

  await knex.schema.alterTable("meet_attendees", (table) => {
    if (!hasOrg1Value) {
      table.text("org1_value").nullable();
    }
    if (!hasOrg2Value) {
      table.text("org2_value").nullable();
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasOrg1Value = await knex.schema.hasColumn(
    "meet_attendees",
    "org1_value",
  );
  const hasOrg2Value = await knex.schema.hasColumn(
    "meet_attendees",
    "org2_value",
  );

  await knex.schema.alterTable("meet_attendees", (table) => {
    if (hasOrg1Value) {
      table.dropColumn("org1_value");
    }
    if (hasOrg2Value) {
      table.dropColumn("org2_value");
    }
  });
}
