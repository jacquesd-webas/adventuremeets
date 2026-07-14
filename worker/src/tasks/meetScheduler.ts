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

function buildApiPath(path: string) {
  if (!apiBase) return path;
  const normalizedBase = apiBase.replace(/\/api\/v1$/i, "");
  return `${normalizedBase}/api/v1${path}`;
}

async function updateStatusViaApi(ids: string[], statusId: number) {
  if (!apiBase || !workerApiKey) {
    console.error(
      "API_BASE_URL or WORKER_API_KEY is not set; skipping status updates",
    );
    return 0;
  }
  let updated = 0;
  for (const id of ids) {
    try {
      const res = await fetch(buildApiPath(`/meets/${id}/status`), {
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
          `Failed to update meet ${id} status: ${res.status} ${text}`,
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
  const rows = await db("meets")
    .where({ status_id: STATUS.Published })
    .whereNotNull("opening_date")
    .where("opening_date", "<=", db.fn.now())
    .select("id", "name");

  for (const { id, name } of rows) {
    console.info(`Opening meet: ${id} (${name})`);
    updateStatusViaApi([id], STATUS.Open).catch((err) => {
      console.error(`Error opening meet ${id} (${name})`, err);
    });
  }
  return rows.length;
}

async function closeOpenMeets(db: Knex) {
  const rows = (await db("meets")
    .where({ status_id: STATUS.Open })
    .where((queryBuilder) => {
      queryBuilder
        .where("closing_date", "<=", db.fn.now())
        .orWhere("start_time", "<=", db.fn.now());
    })
    .select("id", "name")) as { id: string; name: string }[];

  rows.forEach(({ id, name }) => {
    console.info(`Closing meet: ${id} (${name})`);
    updateStatusViaApi([id], STATUS.Closed).catch((err) => {
      console.error(`Error closing meet ${id} (${name})`, err);
    });
  });
  return rows.length;
}

async function closeWhenWaitlistFull(db: Knex) {
  const attendeeCountsSubquery = db("meet_attendees")
    .select("meet_id")
    .select(
      db.raw(
        `sum(case when status in ('confirmed', 'checked-in', 'attended') then 1 + coalesce(guests, 0) else 0 end) as confirmed_count`,
      ),
    )
    .select(
      db.raw(
        `sum(case when status = 'waitlisted' then 1 + coalesce(guests, 0) else 0 end) as waitlist_count`,
      ),
    )
    .groupBy("meet_id")
    .as("ma");

  const rows = await db("meets as m")
    .leftJoin(attendeeCountsSubquery, "m.id", "ma.meet_id")
    .where("m.status_id", STATUS.Open)
    .where("m.capacity", ">", 0)
    .where("m.waitlist_size", ">", 0)
    .whereRaw(
      "coalesce(ma.confirmed_count, 0) + coalesce(ma.waitlist_count, 0) >= m.capacity + m.waitlist_size",
    )
    .select("m.id", "m.name");

  rows.forEach(({ id, name }) => {
    console.info(`Closing meet due to full waitlist: ${id} (${name})`);
    updateStatusViaApi([id], STATUS.Closed).catch((err) => {
      console.error(`Error closing meet ${id} (${name})`, err);
    });
  });

  return rows.length;
}

export async function runMeetScheduler() {
  const db = createDb();
  try {
    const opened = await openScheduledMeets(db);
    const closed = await closeOpenMeets(db);
    const waitlistClosed = await closeWhenWaitlistFull(db);

    if (opened === 0 && closed === 0 && waitlistClosed === 0) {
      console.info("Heartbeat: no meets opened or closed");
    } else {
      console.info(
        `Meets opened: ${opened}, closed: ${closed}, waitlist closed: ${waitlistClosed}`,
      );
    }
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
