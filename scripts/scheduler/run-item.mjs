// run-item.mjs — execute ONE queued item by id (the scheduler target).
//   node scripts/scheduler/run-item.mjs <id> [--queue queue.json]
// Dispatches by item.type: social → make-post; publish → publish; append → append.
// Updates queue status posted|failed. Safe to call from cron / schtasks / Task Scheduler.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, queueSetStatus } from "../lib/state.mjs";

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
let cmd;
if (item.type === "social") {
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
// make-post already sets its own status; set here for publish/append.
if (item.type !== "social") {
  queueSetStatus(queueFile, item.id, ok ? "posted" : "failed",
    ok ? { postedAt: new Date().toISOString() } : { error: `exit ${r.status}` });
}
process.exit(ok ? 0 : 1);
