// build-queue.mjs — turn a list of ready items into a scheduled dispatch queue.
// Spreads posts across N windows in the day at RANDOM times (>= minGap apart).
//   node scripts/scheduler/build-queue.mjs items.json [--out queue.json] [--windows 4] [--gap 90]
// items.json: [ { "type":"social|publish|append", "post":"...", "comment":"...", "image":"...", "payload":"file.json" } ]
import fs from "node:fs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `build-queue.mjs — schedule items at random times across the day\n` +
      `  node scripts/scheduler/build-queue.mjs items.json [--out queue.json] [--windows 4] [--gap 90]\n` +
      `  --windows N  split the active day (09:00–21:00) into N slots\n` +
      `  --gap M      minimum minutes between posts`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const file = argv.find((a) => a.endsWith(".json") && a !== flag("--out"));
const items = JSON.parse(fs.readFileSync(file, "utf8"));
const out = flag("--out", "queue.json");
const windows = Number(flag("--windows", "4"));
const gapMin = Number(flag("--gap", "90"));

// Active window 09:00–21:00 local, split into `windows` slots; 1 random time per slot.
const DAY_START = 9 * 60;
const DAY_END = 21 * 60;
const slot = Math.floor((DAY_END - DAY_START) / Math.max(windows, 1));
const now = new Date();
let lastMin = -Infinity;
const times = [];
for (let i = 0; i < items.length; i++) {
  const winBase = DAY_START + (i % windows) * slot + Math.floor((i / windows)) * 5;
  // deterministic-ish jitter without Math.random (kept reproducible across resume):
  const jitter = ((i * 37 + 13) % Math.max(slot - gapMin, 1));
  let minute = Math.max(winBase + jitter, lastMin + gapMin);
  lastMin = minute;
  const d = new Date(now);
  d.setHours(0, minute, 0, 0);
  times.push(d.toISOString());
}

const queue = items.map((it, i) => ({
  id: i + 1,
  type: it.type || "social",
  scheduledTime: times[i],
  status: "queued",
  ...it,
}));
fs.writeFileSync(out, JSON.stringify(queue, null, 2) + "\n", "utf8");
console.log(`[queue] built ${queue.length} scheduled item(s) → ${out}`);
for (const q of queue) console.log(`  #${q.id} ${q.type} @ ${q.scheduledTime}`);
