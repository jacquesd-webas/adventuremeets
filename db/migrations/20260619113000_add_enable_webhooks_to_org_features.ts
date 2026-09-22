import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasEnableWebhooks = await knex.schema.hasColumn(
    "org_features",
    "enable_webhooks",
  );

  if (!hasEnableWebhooks) {
    await knex.schema.alterTable("org_features", (table) => {
      table.boolean("enable_webhooks").notNullable().defaultTo(false);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasEnableWebhooks = await knex.schema.hasColumn(
    "org_features",
    "enable_webhooks",
  );

  if (hasEnableWebhooks) {
    await knex.schema.alterTable("org_features", (table) => {
      table.dropColumn("enable_webhooks");
    });
  }
}
