import knex, { Knex } from "knex";

const STATUS = {
  Draft: 1,
  Published: 2,
  Open: 3,
  Closed: 4,
  Cancelled: 5,
  Postponed: 6,
  Completed: 7,
};

function createDb(): Knex {
  return knex({
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "db",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "adventuremeets",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    },
    pool: { min: 1, max: 5 },
  });
}

async function openScheduledMeets(db: Knex) {
  const updated = await db("meets")
    .where({ status_id: STATUS.Published })
    .whereNotNull("opening_date")
    .where("opening_date", "<=", db.fn.now())
    .update({ status_id: STATUS.Open, updated_at: db.fn.now() }, ["id"]);
  return updated.length;
}

async function closeScheduledMeets(db: Knex) {
  const updated = await db("meets")
    .where({ status_id: STATUS.Open })
    .whereNotNull("closing_date")
    .where("closing_date", "<=", db.fn.now())
    .update({ status_id: STATUS.Closed, updated_at: db.fn.now() }, ["id"]);
  return updated.length;
}

async function closeWhenWaitlistFull(db: Knex) {
  const waitlistCounts = db("meet_attendees")
    .select("meet_id")
    .count<{ waitlisted: string }>("id as waitlisted")
    .where("status", "waitlisted")
    .groupBy("meet_id")
    .as("wl");

  const updated = await db("meets as m")
    .leftJoin(waitlistCounts, "m.id", "wl.meet_id")
    .where("m.status_id", STATUS.Open)
    .whereNotNull("m.waitlist_size")
    .whereRaw("coalesce(wl.waitlisted, 0) >= m.waitlist_size")
    .update({ status_id: STATUS.Closed, updated_at: db.fn.now() }, ["m.id"]);
  return updated.length;
}

async function archiveEndedMeets(db: Knex) {
  const updated = await db("meets")
    .whereNotNull("end_time")
    .where("end_time", "<=", db.fn.now())
    .whereIn("status_id", [STATUS.Open, STATUS.Closed, STATUS.Published])
    .update({ status_id: STATUS.Completed, updated_at: db.fn.now() }, ["id"]);
  return updated.length;
}

export async function runMeetScheduler() {
  const db = createDb();
  try {
    const opened = await openScheduledMeets(db);
    const closed = await closeScheduledMeets(db);
    const waitlistClosed = await closeWhenWaitlistFull(db);
    const archived = await archiveEndedMeets(db);

    console.log(
      JSON.stringify(
        {
          opened,
          closed,
          waitlistClosed,
          archived,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  runMeetScheduler()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
