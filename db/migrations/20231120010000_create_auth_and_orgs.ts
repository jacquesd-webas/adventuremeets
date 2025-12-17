import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  await knex.schema.createTable("organizations", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("email").unique().index();
    table.boolean("email_verified").defaultTo(false);
    table.timestamp("email_verified_at", { useTz: true });
    table.string("password_hash");
    table.string("password_salt");
    table.string("password_reset_token");
    table.timestamp("password_reset_expires_at", { useTz: true });
    table.string("email_verification_token");
    table.timestamp("last_login_at", { useTz: true });
    table.integer("login_attempts").notNullable().defaultTo(0);
    table.timestamp("last_login_attempt_at", { useTz: true });
    table.timestamp("locked_until", { useTz: true });
    table.string("login_captcha_required_reason");
    table.string("idp_provider"); // google, facebook, etc.
    table.string("idp_subject"); // subject/user id from provider
    table.jsonb("idp_profile"); // raw profile snapshot if needed
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("user_organization_memberships", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("organization_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    table.string("role").notNullable().defaultTo("member");
    table.string("status").notNullable().defaultTo("active"); // invited, active, suspended
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.unique(["user_id", "organization_id"]);
  });

  await knex.schema.createTable("organization_meta_definitions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("organization_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table.string("field_key").notNullable();
    table.string("label").notNullable();
    table.string("field_type").notNullable(); // text, number, date, select, etc.
    table.boolean("required").notNullable().defaultTo(false);
    table.integer("position").notNullable().defaultTo(0);
    table.jsonb("config").defaultTo("{}"); // definition of what to ask (options, placeholder)
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.unique(["organization_id", "field_key"]);
  });

  await knex.schema.createTable("user_meta_values", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("meta_definition_id")
      .notNullable()
      .references("id")
      .inTable("organization_meta_definitions")
      .onDelete("CASCADE");
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("organization_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    table.text("value").notNullable(); // stored as text (no JSON) but can be parsed per field_type
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.unique(["user_id", "organization_id", "meta_definition_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("user_meta_values");
  await knex.schema.dropTableIfExists("organization_meta_definitions");
  await knex.schema.dropTableIfExists("user_organization_memberships");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("organizations");
}
