import type { Knex } from "knex";
import bcrypt from "bcryptjs";

const users = [
  { email: "alice@nowhere.com", name: "Alice in Chains", password: "Password123!" },
  { email: "bob@nowhere.com", name: "Bob the Builder", password: "Password123!" },
  { email: "charlie@nowhere.com", name: "Charlie Cook", password: "Password123!" },
  { email: "dennis@nowhere.com", name: "Dennis the Menace", password: "Password123!" },
  { email: "eve@nowhere.com", name: "Eve Online", password: "Password123!" }
];

export async function seed(knex: Knex): Promise<void> {
  await knex("user_meta_values").del();
  await knex("organization_meta_definitions").del();
  await knex("user_organization_memberships").del();
  await knex("users").del();

  const now = new Date().toISOString();

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await knex("users").insert({
      email: user.email,
      email_verified: false,
      password_hash: passwordHash,
      idp_provider: null,
      idp_subject: null,
      idp_profile: { name: user.name },
      created_at: now,
      updated_at: now
    });
  }
}
