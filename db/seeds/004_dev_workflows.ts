import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("organization_workflows").del();

  const primaryOrg = await knex("organizations").orderBy("created_at", "asc").first("id");
  if (!primaryOrg?.id) {
    throw new Error("Seed requires at least one organization (run user seeds first)");
  }

  const now = new Date().toISOString();

  await knex("organization_workflows").insert({
    organization_id: primaryOrg.id,
    name: "Post-meet expense submission",
    trigger: "meet.report_generated",
    action_type: "expense_submission",
    config: {},
    enabled: true,
    created_at: now,
    updated_at: now,
  });
}
