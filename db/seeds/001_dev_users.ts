import type { Knex } from "knex";
import bcrypt from "bcryptjs";

const users = [
  { email: "alice@nowhere.com", name: "Alice", password: "Password123!" },
  { email: "bob@nowhere.com", name: "Bob", password: "Password123!" },
  { email: "charlie@nowhere.com", name: "Charlie", password: "Password123!" },
  { email: "dave@nowhere.com", name: "Dave", password: "Password123!" },
  { email: "ella@nowhere.com", name: "Ella", password: "Password123!" },
  { email: "frankie@nowhere.com", name: "Frankie", password: "Password123!" }
];

const organizations = ["Summit Explorers", "Trailblazers Club", "Weekend Adventurers"];

export async function seed(knex: Knex): Promise<void> {
  await knex("user_meta_values").del();
  await knex("organization_meta_definitions").del();
  await knex("user_organization_memberships").del();
  await knex("users").del();
  await knex("organizations").del();

  const now = new Date().toISOString();

  const orgRows = organizations.map((name) => ({
    name,
    created_at: now,
    updated_at: now
  }));
  const [primaryOrg] = await knex("organizations").insert(orgRows, ["id", "name"]);

  const userRows = await Promise.all(
    users.map(async (user) => ({
      email: user.email,
      email_verified_at: now,
      first_name: user.name,
      last_name: null,
      phone: null,
      password_hash: await bcrypt.hash(user.password, 10),
      idp_provider: null,
      idp_subject: null,
      idp_profile: { name: user.name },
      created_at: now,
      updated_at: now
    }))
  );

  const insertedUsers = await knex("users").insert(userRows, ["id", "email"]);

  const orgByName = new Map((await knex("organizations").select("id", "name")).map((org) => [org.name, org.id]));
  const orgIds = organizations.map((name) => orgByName.get(name)).filter(Boolean) as string[];
  const [org1, org2, org3] = orgIds;
  if (!org1 || !org2 || !org3) {
    throw new Error("Seed requires three organizations");
  }

  const membershipRows = insertedUsers.flatMap((user) => {
    if (user.email === "alice@nowhere.com") {
      return [
        {
          user_id: user.id,
          organization_id: org1,
          role: "admin",
          role_id: 2,
          status: "active",
          created_at: now,
          updated_at: now
        },
        {
          user_id: user.id,
          organization_id: org2,
          role: "admin",
          role_id: 2,
          status: "active",
          created_at: now,
          updated_at: now
        }
      ];
    }
    if (user.email === "bob@nowhere.com") {
      return [
        {
          user_id: user.id,
          organization_id: org1,
          role: "organizer",
          role_id: 3,
          status: "active",
          created_at: now,
          updated_at: now
        }
      ];
    }
    if (user.email === "charlie@nowhere.com") {
      return [
        {
          user_id: user.id,
          organization_id: org2,
          role: "organizer",
          role_id: 3,
          status: "active",
          created_at: now,
          updated_at: now
        }
      ];
    }
    return [
      {
        user_id: user.id,
        organization_id: org1,
        role: "member",
        role_id: 4,
        status: "active",
        created_at: now,
        updated_at: now
      }
    ];
  });

  await knex("user_organization_memberships").insert(membershipRows);
}
