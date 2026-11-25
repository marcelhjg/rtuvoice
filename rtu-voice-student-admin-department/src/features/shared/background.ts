import "server-only";
import { after } from "next/server";

// Runs `task` after the response has been sent, so the person clicking a button
// doesn't wait on SMTP / lookups that only exist to send a notification.
// Errors are logged, never thrown (nobody is left to catch them).
//
// `after` is stable from Next 15.1. On an older Next, replace the body with:
//   try { await task(); } catch (e) { console.error(`[${label}] failed:`, e); }
// and make this function async: the actions then wait for the task again, like before.
export function runAfterResponse(task: () => Promise<void>, label = "background") {
  after(async () => {
    try {
      await task();
    } catch (e) {
      console.error(`[${label}] failed:`, e);
    }
  });
}