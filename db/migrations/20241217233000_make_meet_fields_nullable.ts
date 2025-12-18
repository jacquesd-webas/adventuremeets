import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.string("location").nullable().alter();
    table.timestamp("start_time", { useTz: true }).nullable().alter();
    table.timestamp("end_time", { useTz: true }).nullable().alter();
    table.timestamp("opening_date", { useTz: true }).nullable().alter();
    table.timestamp("closing_date", { useTz: true }).nullable().alter();
    table.timestamp("scheduled_date", { useTz: true }).nullable().alter();
    table.integer("capacity").nullable().alter();
    table.integer("waitlist_size").nullable().alter();
    table.integer("status_id").nullable().alter();
    table.boolean("auto_placement").nullable().alter();
    table.boolean("auto_promote_waitlist").nullable().alter();
    table.boolean("is_virtual").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("meets", (table) => {
    table.string("location").notNullable().alter();
    table.timestamp("start_time", { useTz: true }).notNullable().alter();
    table.timestamp("end_time", { useTz: true }).notNullable().alter();
    table.timestamp("opening_date", { useTz: true }).notNullable().alter();
    table.timestamp("closing_date", { useTz: true }).notNullable().alter();
    table.timestamp("scheduled_date", { useTz: true }).notNullable().alter();
    table.integer("capacity").notNullable().alter();
    table.integer("waitlist_size").notNullable().alter();
    table.integer("status_id").notNullable().alter();
    table.boolean("auto_placement").notNullable().alter();
    table.boolean("auto_promote_waitlist").notNullable().alter();
    table.boolean("is_virtual").notNullable().alter();
  });
}
