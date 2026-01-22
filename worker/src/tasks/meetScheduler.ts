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
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    },
    pool: { min: 1, max: 5 },
  });
}

const apiBase = (
  process.env.API_BASE_URL ||
  process.env.API_BASEURL ||
  ""
).replace(/\/$/, "");
const workerApiKey = process.env.WORKER_API_KEY || "";

async function updateStatusViaApi(ids: string[], statusId: number) {
  if (!apiBase || !workerApiKey) {
    console.error(
      "API_BASE_URL or WORKER_API_KEY is not set; skipping status updates"
    );
    return 0;
  }
  let updated = 0;
  for (const id of ids) {
    try {
      const res = await fetch(`${apiBase}/api/v1/meets/${id}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-api-key": workerApiKey,
        },
        body: JSON.stringify({ statusId }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(
          `Failed to update meet ${id} status: ${res.status} ${text}`
        );
      } else {
        updated += 1;
      }
    } catch (err) {
      console.error(`Error updating meet ${id} status`, err);
    }
  }
  return updated;
}

async function openScheduledMeets(db: Knex) {
  const ids = await db("meets")
    .where({ status_id: STATUS.Published })
    .whereNotNull("opening_date")
    .where("opening_date", "<=", db.fn.now())
    .pluck<string>("id");
  return updateStatusViaApi(ids, STATUS.Open);
}

async function closeOpenMeets(db: Knex) {
  const ids = await db("meets")
    .where({ status_id: STATUS.Open })
    .whereNotNull("closing_date")
    .where("closing_date", "<=", db.fn.now())
    .pluck<string>("id");
  return updateStatusViaApi(ids, STATUS.Closed);
}

async function closeWhenWaitlistFull(db: Knex) {
  const waitlistSubquery = db("meet_attendees")
    .select("meet_id")
    .count<{ waitlisted: string }>("id as waitlisted")
    .where("status", "waitlisted")
    .groupBy("meet_id")
    .as("wl");

  const ids = await db("meets as m")
    .leftJoin(waitlistSubquery, "m.id", "wl.meet_id")
    .where("m.status_id", STATUS.Open)
    .where("m.waitlist_size", ">", 0)
    .whereRaw("coalesce(wl.waitlisted, 0) >= m.waitlist_size")
    .pluck<string>("m.id");
  return updateStatusViaApi(ids, STATUS.Closed);
}

async function archiveEndedMeets(db: Knex) {
  const ids = await db("meets")
    .whereNotNull("end_time")
    .where("end_time", "<=", db.fn.now())
    .whereIn("status_id", [STATUS.Open, STATUS.Closed, STATUS.Published])
    .pluck<string>("id");
  return updateStatusViaApi(ids, STATUS.Completed);
}

export async function runMeetScheduler() {
  const db = createDb();
  try {
    const opened = await openScheduledMeets(db);
    const closed = await closeOpenMeets(db);
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
        2
      )
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
