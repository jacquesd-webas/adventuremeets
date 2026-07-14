import knex, { Knex } from "knex";

const STATUS = {
  Published: 2,
  Open: 3,
  Closed: 4,
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

async function findMeetIdsNeedingResponseReminders(db: Knex) {
  const latestReminderSubquery = db("notifications as n")
    .join("notification_types as nt", "nt.id", "n.notification_type_id")
    .where("nt.name", "organiser_reminder_responses_needed")
    .whereNotNull("n.meet_id")
    .groupBy("n.meet_id")
    .select("n.meet_id")
    .max("n.created_at as last_sent_at")
    .as("nr");

  return db("meets as m")
    .leftJoin(latestReminderSubquery, "nr.meet_id", "m.id")
    .whereIn("m.status_id", [STATUS.Published, STATUS.Open])
    .whereExists(function () {
      this.select(db.raw("1"))
        .from("meet_attendees as ma")
        .whereRaw("ma.meet_id = m.id")
        .where("ma.status", "pending")
        .whereNull("ma.responded_at");
    })
    .where(function () {
      this.whereNull("nr.last_sent_at").orWhereExists(function () {
        this.select(db.raw("1"))
          .from("meet_attendees as ma_new")
          .whereRaw("ma_new.meet_id = m.id")
          .where("ma_new.status", "pending")
          .whereNull("ma_new.responded_at")
          .whereRaw(
            "coalesce(ma_new.updated_at, ma_new.created_at) > nr.last_sent_at",
          );
      });
    })
    .pluck<string>("m.id");
}

async function findMeetIdsNeedingCheckinReminders(db: Knex) {
  const latestReminderSubquery = db("notifications as n")
    .join("notification_types as nt", "nt.id", "n.notification_type_id")
    .where("nt.name", "organizer_reminder_checkin_needed")
    .whereNotNull("n.meet_id")
    .groupBy("n.meet_id")
    .select("n.meet_id")
    .max("n.created_at as last_sent_at")
    .as("nr");

  return db("meets as m")
    .leftJoin(latestReminderSubquery, "nr.meet_id", "m.id")
    .whereIn("m.status_id", [STATUS.Open, STATUS.Closed])
    .whereNotNull("m.start_time")
    .whereNotNull("m.end_time")
    .where("m.start_time", "<=", db.fn.now())
    .where("m.end_time", ">=", db.fn.now())
    .whereNotExists(function () {
      this.select(db.raw("1"))
        .from("meet_attendees as ma")
        .whereRaw("ma.meet_id = m.id")
        .whereIn("ma.status", ["checked-in", "attended"]);
    })
    .whereExists(function () {
      this.select(db.raw("1"))
        .from("meet_attendees as ma_any")
        .whereRaw("ma_any.meet_id = m.id");
    })
    .where(function () {
      this.whereNull("nr.last_sent_at").orWhereExists(function () {
        this.select(db.raw("1"))
          .from("meet_attendees as ma_new")
          .whereRaw("ma_new.meet_id = m.id")
          .whereRaw(
            "coalesce(ma_new.updated_at, ma_new.created_at) > nr.last_sent_at",
          );
      });
    })
    .pluck<string>("m.id");
}

async function sendReminderViaApi(
  meetId: string,
  notificationType:
    | "organiser_reminder_responses_needed"
    | "organizer_reminder_checkin_needed",
) {
  if (!apiBase || !workerApiKey) {
    console.error(
      "API_BASE_URL or WORKER_API_KEY is not set; skipping reminders",
    );
    return false;
  }

  try {
    const res = await fetch(buildApiPath("/notifications"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": workerApiKey,
      },
      body: JSON.stringify({
        notificationType,
        meetId,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(
        `Failed to send ${notificationType} reminder for meet ${meetId}: ${res.status} ${text}`,
      );
      return false;
    }

    if (typeof res.json === "function") {
      const body = await res.json().catch(() => null);
      if (body?.status === "skipped") {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error(
      `Error sending ${notificationType} reminder for meet ${meetId}`,
      err,
    );
    return false;
  }
}

export async function runMeetReminderJob() {
  const db = createDb();
  try {
    const responseReminderMeetIds =
      await findMeetIdsNeedingResponseReminders(db);
    const checkinReminderMeetIds = await findMeetIdsNeedingCheckinReminders(db);
    let reminded = 0;

    for (const meetId of responseReminderMeetIds) {
      const sent = await sendReminderViaApi(
        meetId,
        "organiser_reminder_responses_needed",
      );
      if (sent) {
        reminded += 1;
      }
    }

    for (const meetId of checkinReminderMeetIds) {
      const sent = await sendReminderViaApi(
        meetId,
        "organizer_reminder_checkin_needed",
      );
      if (sent) {
        reminded += 1;
      }
    }

    if (reminded === 0) {
      console.info("Heartbeat: No meets needed reminders at this time.");
    } else {
      console.info(`Sent reminders for ${reminded} meet(s).`);
    }
    return reminded;
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  runMeetReminderJob()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
