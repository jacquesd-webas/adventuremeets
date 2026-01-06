import { runMeetScheduler } from "./tasks/meetScheduler";

const SCHEDULER_INTERVAL_SECONDS = Number(process.env.SCHEDULER_INTERVAL_SECONDS || 10000);
const MAX_CONSECUTIVE_SKIPS = 3;
let isRunning = false;
let consecutiveSkips = 0;

async function tick() {
  if (isRunning) {
    consecutiveSkips += 1;
    console.warn(`Scheduler already running; skipping tick ${consecutiveSkips}/${MAX_CONSECUTIVE_SKIPS}`);
    if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS) {
      throw new Error(`Scheduler skipped ${consecutiveSkips} consecutive times; exiting`);
    }
    return;
  }
  isRunning = true;
  try {
    consecutiveSkips = 0;
    await runMeetScheduler();
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
