import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  const hasGuestOf = await knex.schema.hasColumn("meet_attendees", "guest_of")
  if (!hasGuestOf) {
    await knex.schema.alterTable("meet_attendees", (table) => {
      table
        .uuid("guest_of")
        .nullable()
        .references("id")
        .inTable("meet_attendees")
        .onDelete("SET NULL")
      table.index(["guest_of"])
    })
  }
  const hasIsMinor = await knex.schema.hasColumn("meet_attendees", "is_minor")
  if (!hasIsMinor) {
    await knex.schema.alterTable("meet_attendees", (table) => {
      table.boolean("is_minor").notNullable().defaultTo(false)
    })
  }
  const hasGuardianName = await knex.schema.hasColumn(
    "meet_attendees",
    "guardian_name",
  )
  if (!hasGuardianName) {
    await knex.schema.alterTable("meet_attendees", (table) => {
      table.text("guardian_name").nullable()
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasGuestOf = await knex.schema.hasColumn("meet_attendees", "guest_of")
  if (hasGuestOf) {
    await knex.schema.alterTable("meet_attendees", (table) => {
      table.dropIndex(["guest_of"])
      table.dropForeign(["guest_of"])
      table.dropColumn("guest_of")
    })
  }
  const hasIsMinor = await knex.schema.hasColumn("meet_attendees", "is_minor")
  if (hasIsMinor) {
    await knex.schema.alterTable("meet_attendees", (table) => {
      table.dropColumn("is_minor")
    })
  }
  const hasGuardianName = await knex.schema.hasColumn(
    "meet_attendees",
    "guardian_name",
  )
  if (hasGuardianName) {
    await knex.schema.alterTable("meet_attendees", (table) => {
      table.dropColumn("guardian_name")
    })
  }
}
