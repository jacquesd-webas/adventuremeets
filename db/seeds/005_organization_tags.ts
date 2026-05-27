import type { Knex } from "knex";

const defaultTags = [
  { name: "climbing", color: "#D97706" },
  { name: "camping", color: "#2E7D32" },
  { name: "hiking", color: "#6D4C41" },
  { name: "social", color: "#1976D2" },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("meet_tags").del();
  await knex("organization_tags").del();

  const organizations = await knex("organizations").select("id");
  if (!organizations.length) {
    return;
  }

  await knex("organization_tags").insert(
    organizations.flatMap((organization) =>
      defaultTags.map((tag) => ({
        id: knex.raw("gen_random_uuid()"),
        organization_id: organization.id,
        name: tag.name,
        color: tag.color,
      })),
    ),
  );
}
