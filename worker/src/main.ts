import * as dotenv from "dotenv";
dotenv.config();

import { runMeetScheduler } from "./tasks/meetScheduler";
import { runMeetReminderJob } from "./tasks/meetReminder";

const SCHEDULER_INTERVAL_SECONDS =
  Number(process.env.SCHEDULER_INTERVAL_SECONDS) * 1000 || 10000;
const RESPONSE_REMINDER_INTERVAL_MS =
  (Number(process.env.RESPONSE_REMINDER_INTERVAL_SECONDS) || 6 * 60 * 60) *
  1000;
const MAX_CONSECUTIVE_SKIPS = 3;
let isRunning = false;
let consecutiveSkips = 0;
let lastResponseReminderRunAt = 0;

async function tick() {
  if (isRunning) {
    consecutiveSkips += 1;
    console.warn(
      `Scheduler already running; skipping tick ${consecutiveSkips}/${MAX_CONSECUTIVE_SKIPS}`,
    );
    if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS) {
      throw new Error(
        `Scheduler skipped ${consecutiveSkips} consecutive times; exiting`,
      );
    }
    return;
  }
  isRunning = true;
  try {
    consecutiveSkips = 0;
    await runMeetScheduler();
    if (
      Date.now() - lastResponseReminderRunAt >=
      RESPONSE_REMINDER_INTERVAL_MS
    ) {
      await runMeetReminderJob();
      lastResponseReminderRunAt = Date.now();
    }
  } catch (err) {
    console.error("Meet scheduler error:", err);
    throw err;
  }
  isRunning = false;
}

setInterval(() => {
  tick();
}, SCHEDULER_INTERVAL_SECONDS);

// kick off immediately
tick();
