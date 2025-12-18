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

  const shareCodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const generateShareCode = (length = 12) =>
    Array.from({ length }, () => shareCodeChars[Math.floor(Math.random() * shareCodeChars.length)]).join("");

  const primaryOrg = await knex("organizations").orderBy("created_at", "asc").first("id");
  if (!primaryOrg?.id) {
    throw new Error("Seed requires at least one organization (run user seeds first)");
  }

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
      status_id: 4, // Closed
      allow_guests: true,
      max_guests: 2,
      is_virtual: false,
      has_indemnity: true,
      indemnity:
        "I acknowledge the inherent risks of hiking and accept responsibility for my safety and belongings. I agree to follow the organizer's instructions and release the organizers from liability."
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
      allow_guests: true,
      max_guests: 1,
      is_virtual: false,
      has_indemnity: true,
      indemnity:
        "Caving can be hazardous. I understand the risks and agree to follow guide instructions and safety protocols."
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
      status_id: 3, // Open
      is_virtual: false
    },
    {
      name: "Camping Meet",
      description:
        "Settle into a relaxed weekend basecamp with a crackling campfire, shared meals, and plenty of time to wander the pines. We will arrive Friday afternoon, set up tents, and take a gentle walk to orient ourselves before sunset. Bring a headlamp, a warm layer for the evening, and your favorite campfire snack to share.\n\nOn Saturday we will explore a longer loop at an easy pace, with breaks for coffee, photos, and a lakeside lunch. This is a social hike rather than a speed mission, so expect a steady but comfortable tempo and lots of conversation along the way. If you have a camera or binoculars, bring them along for birding and stargazing after dinner.\n\nSunday morning is unhurried and flexible: optional sunrise walk, lazy brunch, and a slow pack-up. We will do a final sweep of the site to leave no trace before heading home. If you are new to camping, let us know and we will help you plan gear and food; experienced campers are welcome to share tips and tricks."
      ,
      location: "Pine Grove Campground",
      startOffsetDays: 3,
      durationHours: 24,
      capacity: 25,
      waitlist_size: 6,
      cost_cents: 2000,
      deposit_cents: 1000,
      status_id: 3, // Open
      allow_guests: true,
      max_guests: 2,
      is_virtual: false,
      has_indemnity: true,
      indemnity:
        "Outdoor camping has inherent risks. I accept responsibility for my safety and agree to respect camp safety rules."
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
      status_id: 7, // Completed
      is_virtual: true
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
      status_id: 3, // Open
      is_virtual: false,
      has_indemnity: true,
      indemnity:
        "Backpacking is physically demanding and includes risks. I agree to take responsibility for my actions and well-being."
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
      organization_id: primaryOrg.id,
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
      allow_guests: meet.allow_guests ?? false,
      max_guests: meet.max_guests ?? null,
      is_virtual: meet.is_virtual,
      has_indemnity: meet.has_indemnity ?? false,
      indemnity: meet.indemnity ?? null,
      confirm_message: "You're in! See you there.",
      reject_message: "Sorry, this meet is full.",
      currency_id: currencyId,
      cost_cents: meet.cost_cents,
      deposit_cents: meet.deposit_cents,
      share_code: generateShareCode(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  });

  const insertedMeets = await knex("meets").insert(records, ["id", "name"]);

  const meetByName = new Map(insertedMeets.map((meet) => [meet.name, meet.id]));
  const targetMeetNames = ["Day Hike Meet", "Caving Meet"];
  const attendeeRows: any[] = [];
  const nowIso = now.toISOString();

  targetMeetNames.forEach((name, idx) => {
    const meetId = meetByName.get(name);
    if (!meetId) return;
    const selectedUsers = [
      { name: "Sam Trail", email: "sam.trail@example.com", phone: "+1-555-0101" },
      { name: "Riley Peaks", email: "riley.peaks@example.com", phone: "+1-555-0102" },
      { name: "Jordan Pines", email: "jordan.pines@example.com", phone: "+1-555-0103" },
      { name: "Avery Summit", email: "avery.summit@example.com", phone: "+1-555-0104" },
      { name: "Taylor Ridge", email: "taylor.ridge@example.com", phone: "+1-555-0105" }
    ];
    selectedUsers.forEach((user, sequence) => {
      attendeeRows.push({
        meet_id: meetId,
        user_id: null,
        name: user.name,
        email: user.email,
        phone: user.phone,
        guests: sequence % 2,
        indemnity_accepted: sequence < 4,
        indemnity_minors: sequence % 2 === 0 ? "No minors" : "One minor under supervision",
        status: sequence < 4 ? "confirmed" : "waitlisted",
        sequence,
        responded_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso
      });
    });
  });

  if (attendeeRows.length) {
    await knex("meet_attendees").insert(attendeeRows);
  }
}
