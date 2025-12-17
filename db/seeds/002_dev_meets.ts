import type { Knex } from "knex";

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addHours(base: Date, hours: number) {
  const d = new Date(base);
  d.setHours(d.getHours() + hours);
  return d;
}

export async function seed(knex: Knex): Promise<void> {
  // Clear dependent tables first
  await knex("meet_meta_values").del();
  await knex("meet_meta_definitions").del();
  await knex("meet_attendees").del();
  await knex("meets").del();

  const organizer = await knex("users").first("id");
  if (!organizer?.id) {
    throw new Error("Seed requires at least one user (run user seeds first)");
  }

  const usd = await knex("currencies").where({ code: "USD" }).first("id");
  const currencyId = usd?.id || null;
  const now = new Date();

  const meets = [
    {
      name: "Day Hike Meet",
      description: "Scenic day hike along Skyline Ridge with picnic lunch.",
      location: "Skyline Ridge Trailhead",
      startOffsetDays: 7,
      durationHours: 6,
      capacity: 20,
      waitlist_size: 5,
      cost_cents: 0,
      deposit_cents: 0,
      status_id: 2, // Published
      is_virtual: false
    },
    {
      name: "Caving Meet",
      description: "Intro to caving with experienced guides. Headlamps required.",
      location: "Crystal Caverns",
      startOffsetDays: 14,
      durationHours: 5,
      capacity: 12,
      waitlist_size: 4,
      cost_cents: 4500,
      deposit_cents: 1500,
      status_id: 2,
      is_virtual: false
    },
    {
      name: "Scrambling Meet",
      description: "Class 3 scrambling on exposed ridgelines. Helmets required.",
      location: "Eagle Crest",
      startOffsetDays: 21,
      durationHours: 8,
      capacity: 10,
      waitlist_size: 3,
      cost_cents: 0,
      deposit_cents: 0,
      status_id: 2,
      is_virtual: false
    },
    {
      name: "Camping Meet",
      description: "Weekend basecamp with campfire and stargazing.",
      location: "Pine Grove Campground",
      startOffsetDays: 3,
      durationHours: 24,
      capacity: 25,
      waitlist_size: 6,
      cost_cents: 2000,
      deposit_cents: 1000,
      status_id: 2,
      is_virtual: false
    },
    {
      name: "Work Meet",
      description: "Sprint planning and roadmap alignment (virtual).",
      location: "Online",
      startOffsetDays: -2,
      durationHours: 2,
      capacity: 30,
      waitlist_size: 0,
      cost_cents: 0,
      deposit_cents: 0,
      status_id: 3, // Closed
      is_virtual: true,
      access_link: "https://meetplanner.example.com/standup"
    },
    {
      name: "Overnight Hike Meet",
      description: "Two-day backpacking loop with alpine lake camp.",
      location: "Highline Loop",
      startOffsetDays: -10,
      durationHours: 36,
      capacity: 16,
      waitlist_size: 4,
      cost_cents: 0,
      deposit_cents: 0,
      status_id: 3,
      is_virtual: false
    }
  ];

  const records = meets.map((meet) => {
    const start = addDays(now, meet.startOffsetDays);
    const end = addHours(start, meet.durationHours);
    const opening = addDays(start, -14);
    const closing = addDays(start, -1);
    const confirm = meet.startOffsetDays >= 0 ? addDays(start, -2) : addDays(start, -1);

    return {
      organizer_id: organizer.id,
      name: meet.name,
      description: meet.description,
      location: meet.location,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      opening_date: opening.toISOString(),
      closing_date: closing.toISOString(),
      scheduled_date: start.toISOString(),
      confirm_date: confirm.toISOString(),
      capacity: meet.capacity,
      waitlist_size: meet.waitlist_size,
      status_id: meet.status_id,
      auto_placement: true,
      auto_promote_waitlist: true,
      is_virtual: meet.is_virtual,
      access_link: meet.access_link || null,
      confirm_message: "You're in! See you there.",
      reject_message: "Sorry, this meet is full.",
      meta_definition: {},
      currency_id: currencyId,
      cost_cents: meet.cost_cents,
      deposit_cents: meet.deposit_cents,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  });

  await knex("meets").insert(records);
}
