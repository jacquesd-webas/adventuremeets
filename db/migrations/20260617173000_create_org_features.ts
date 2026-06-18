import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("org_features");
  if (!exists) {
    await knex.schema.createTable("org_features", (table) => {
      table
        .uuid("organization_id")
        .primary()
        .references("id")
        .inTable("organizations")
        .onDelete("CASCADE");
      table.boolean("reporting_enabled").notNullable().defaultTo(false);
      table.boolean("branding_enabled").notNullable().defaultTo(false);
      table.boolean("domain_enabled").notNullable().defaultTo(false);
      table.boolean("whatsapp_enabled").notNullable().defaultTo(false);
      table.boolean("payments_enabled").notNullable().defaultTo(false);
      table.boolean("disk_quotas_enabled").notNullable().defaultTo(false);
      table
        .timestamp("created_at", { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      table
        .timestamp("updated_at", { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
    });
  }

  await knex.raw(`
    INSERT INTO org_features (
      organization_id,
      reporting_enabled,
      branding_enabled,
      domain_enabled,
      whatsapp_enabled,
      payments_enabled,
      disk_quotas_enabled
    )
    SELECT
      id,
      false,
      false,
      false,
      false,
      false,
      false
    FROM organizations
    ON CONFLICT (organization_id) DO NOTHING
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("org_features");
}
