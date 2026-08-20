// run-item.mjs — execute ONE queued item by id (the scheduler target).
//   node scripts/scheduler/run-item.mjs <id> [--queue queue.json]
// Dispatches by item.type: social → make-post; video → render (if needed) + make-post;
//                          publish → publish; append → append.
// Updates queue status posted|failed. Safe to call from cron / schtasks / Task Scheduler.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, queueSetStatus } from "../lib/state.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(`run-item.mjs <id> [--queue queue.json] — run one queued item`);
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const id = argv[0];
const queueFile = flag("--queue", "queue.json");
const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Every child runs FROM the queue's own directory.
 *
 * This is the scheduler entry point, so it is the one place that knows where the operation
 * lives: `--queue` points at it. The secrets belong to that repo — `.env` sits beside the
 * queue, not beside this file — and `lib/env.mjs` finds a `.env` by walking up from the
 * working directory.
 *
 * Windows Task Scheduler starts a task in C:\Windows\System32 unless a "Start in" is set, and
 * `schtasks /create` has no flag for it. From there the walk up reaches C:\ and stops, so
 * every var came back missing and each scheduled post died with exit 1 — while the very same
 * command, run by hand from the project folder, published fine. That gap is what made this
 * look like the scheduler "not firing" when it was firing exactly on time and failing.
 */
const opDir = path.dirname(path.resolve(queueFile));
const childOpts = { cwd: opDir };

const item = readJson(queueFile, []).find((x) => String(x.id) === String(id));
if (!item) {
  console.error(`[run] item id=${id} not found in ${queueFile}`);
  process.exit(1);
}

/**
 * An item that already published does not publish again.
 *
 * Retries are normal here — a slot fails, someone fixes the cause and re-sends by hand — and
 * the scheduled task for that slot is still armed and knows nothing about it. Without this
 * check the fix and the timer both fire and the page gets the same post twice, which is worse
 * than the original failure because it is visible to readers.
 *
 * Exit 0, not 1: nothing went wrong. A non-zero exit here would show up in Task Scheduler as
 * a failed run and send whoever reads that log hunting for a problem that does not exist.
 */
if (item.status === "posted" && !argv.includes("--force")) {
  console.log(
    `[run] item ${id} already posted at ${item.postedAt || "an earlier run"} — skipping. ` +
      `Use --force to publish it again.`,
  );
  process.exit(0);
}

const node = process.execPath;

// Video items are rendered AHEAD of their slot by the daily run, so the scheduled
// moment is just an upload + webhook call (seconds, not the 3–5 minutes a render
// takes). If the render never happened, do it now rather than skipping the post —
// rendering is idempotent per scene, so a retry resumes instead of starting over.
if (item.type === "video" && !item.videoPath && item.scriptPath) {
  console.log(`[run] item ${id}: no videoPath yet — rendering ${item.scriptPath} first`);
  const r = spawnSync(node, [path.join(here, "..", "video", "render.mjs"), item.scriptPath], {
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
    ...childOpts,
  });
  process.stdout.write(r.stdout ?? "");
  const rendered = (r.stdout ?? "").match(/^VIDEO=(.+)$/m)?.[1]?.trim();
  if (r.status !== 0 || !rendered || !fs.existsSync(rendered)) {
    queueSetStatus(queueFile, item.id, "failed", { error: `render failed (exit ${r.status})` });
    console.error(`[run] ✗ item ${id}: render failed`);
    process.exit(1);
  }
  // Persist it so a later retry posts straight away instead of re-rendering.
  item.videoPath = rendered;
  const arr = readJson(queueFile, []);
  const row = arr.find((x) => String(x.id) === String(id));
  if (row) {
    row.videoPath = rendered;
    row.renderedAt = new Date().toISOString();
    writeJson(queueFile, arr);
  }
}

/**
 * Say how old the file being published is, before publishing it.
 *
 * A queue entry names a PATH, and nothing guarantees the file at that path is the render you
 * think it is. This went out live: the queue pointed at `brain/<slug>/video.mp4`, a copy taken
 * at 09:17; the episode was re-rendered at 11:24 into the render directory; the 12:00 slot
 * published the 09:17 copy. Both files existed, both were valid MP4s, and the log said
 * "posted video" either way.
 *
 * One line of age is enough to catch it — a file older than the working session is a file
 * nobody meant to publish.
 */
for (const key of ["videoPath", "image", "thumbnail"]) {
  const p = item[key];
  if (!p || typeof p !== "string" || /^https?:\/\//i.test(p)) continue;
  const abs = path.isAbsolute(p) ? p : path.join(opDir, p);
  if (!fs.existsSync(abs)) continue;
  const st = fs.statSync(abs);
  const ageH = (Date.now() - st.mtimeMs) / 3.6e6;
  const line = `${key}=${p} · ${(st.size / 1048576).toFixed(1)} MB · dựng cách đây ${ageH < 1 ? `${Math.round(ageH * 60)} phút` : `${ageH.toFixed(1)} giờ`}`;
  if (ageH > 6) console.warn(`[run] ! ${line} — CŨ. Đã dựng lại mà quên chép sang đây?`);
  else console.log(`[run] ${line}`);
}

let cmd;
if (item.type === "social" || item.type === "video") {
  cmd = [path.join(here, "..", "social", "make-post.mjs"), "--queue", queueFile, "--id", String(id)];
} else if (item.type === "publish") {
  cmd = [path.join(here, "..", "publish.mjs"), item.payload];
} else if (item.type === "append") {
  cmd = [path.join(here, "..", "append.mjs"), item.payload];
} else {
  console.error(`[run] unknown type: ${item.type}`);
  process.exit(1);
}

const r = spawnSync(node, cmd, { stdio: "inherit", ...childOpts });
const ok = r.status === 0;
// make-post already sets its own status (social + video); set here for publish/append.
if (item.type !== "social" && item.type !== "video") {
  queueSetStatus(queueFile, item.id, ok ? "posted" : "failed",
    ok ? { postedAt: new Date().toISOString() } : { error: `exit ${r.status}` });
}
process.exit(ok ? 0 : 1);
