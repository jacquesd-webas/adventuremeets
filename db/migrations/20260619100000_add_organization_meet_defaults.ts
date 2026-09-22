import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasDefaultTemplateId = await knex.schema.hasColumn(
    "organizations",
    "default_template_id",
  );
  const hasDefaultRequireIndemnity = await knex.schema.hasColumn(
    "organizations",
    "default_require_indemnity",
  );
  const hasDefaultAutoApproveAttendees = await knex.schema.hasColumn(
    "organizations",
    "default_auto_approve_attendees",
  );
  const hasDefaultAllowGuests = await knex.schema.hasColumn(
    "organizations",
    "default_allow_guests",
  );
  const hasDefaultAllowSelfCheckin = await knex.schema.hasColumn(
    "organizations",
    "default_allow_self_checkin",
  );
  const hasDefaultAllowWalkins = await knex.schema.hasColumn(
    "organizations",
    "default_allow_walkins",
  );

  if (
    !hasDefaultTemplateId ||
    !hasDefaultRequireIndemnity ||
    !hasDefaultAutoApproveAttendees ||
    !hasDefaultAllowGuests ||
    !hasDefaultAllowSelfCheckin ||
    !hasDefaultAllowWalkins
  ) {
    await knex.schema.alterTable("organizations", (table) => {
      if (!hasDefaultTemplateId) {
        table.uuid("default_template_id");
      }
      if (!hasDefaultRequireIndemnity) {
        table
          .boolean("default_require_indemnity")
          .notNullable()
          .defaultTo(false);
      }
      if (!hasDefaultAutoApproveAttendees) {
        table
          .boolean("default_auto_approve_attendees")
          .notNullable()
          .defaultTo(false);
      }
      if (!hasDefaultAllowGuests) {
        table.boolean("default_allow_guests").notNullable().defaultTo(false);
      }
      if (!hasDefaultAllowSelfCheckin) {
        table
          .boolean("default_allow_self_checkin")
          .notNullable()
          .defaultTo(false);
      }
      if (!hasDefaultAllowWalkins) {
        table.boolean("default_allow_walkins").notNullable().defaultTo(false);
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasDefaultTemplateId = await knex.schema.hasColumn(
    "organizations",
    "default_template_id",
  );
  const hasDefaultRequireIndemnity = await knex.schema.hasColumn(
    "organizations",
    "default_require_indemnity",
  );
  const hasDefaultAutoApproveAttendees = await knex.schema.hasColumn(
    "organizations",
    "default_auto_approve_attendees",
  );
  const hasDefaultAllowGuests = await knex.schema.hasColumn(
    "organizations",
    "default_allow_guests",
  );
  const hasDefaultAllowSelfCheckin = await knex.schema.hasColumn(
    "organizations",
    "default_allow_self_checkin",
  );
  const hasDefaultAllowWalkins = await knex.schema.hasColumn(
    "organizations",
    "default_allow_walkins",
  );

  if (
    hasDefaultTemplateId ||
    hasDefaultRequireIndemnity ||
    hasDefaultAutoApproveAttendees ||
    hasDefaultAllowGuests ||
    hasDefaultAllowSelfCheckin ||
    hasDefaultAllowWalkins
  ) {
    await knex.schema.alterTable("organizations", (table) => {
      if (hasDefaultTemplateId) {
        table.dropColumn("default_template_id");
      }
      if (hasDefaultRequireIndemnity) {
        table.dropColumn("default_require_indemnity");
      }
      if (hasDefaultAutoApproveAttendees) {
        table.dropColumn("default_auto_approve_attendees");
      }
      if (hasDefaultAllowGuests) {
        table.dropColumn("default_allow_guests");
      }
      if (hasDefaultAllowSelfCheckin) {
        table.dropColumn("default_allow_self_checkin");
      }
      if (hasDefaultAllowWalkins) {
        table.dropColumn("default_allow_walkins");
      }
    });
  }
}
