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

const item = readJson(queueFile, []).find((x) => String(x.id) === String(id));
if (!item) {
  console.error(`[run] item id=${id} not found in ${queueFile}`);
  process.exit(1);
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

const r = spawnSync(node, cmd, { stdio: "inherit" });
const ok = r.status === 0;
// make-post already sets its own status (social + video); set here for publish/append.
if (item.type !== "social" && item.type !== "video") {
  queueSetStatus(queueFile, item.id, ok ? "posted" : "failed",
    ok ? { postedAt: new Date().toISOString() } : { error: `exit ${r.status}` });
}
process.exit(ok ? 0 : 1);
