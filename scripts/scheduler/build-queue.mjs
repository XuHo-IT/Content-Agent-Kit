// build-queue.mjs — turn a list of ready items into a scheduled dispatch queue.
// Spreads posts across N windows in the day at RANDOM times (>= minGap apart), or at the
// exact clock times you name with --at.
//   node scripts/scheduler/build-queue.mjs items.json [--out queue.json] [--windows 4] [--gap 90]
//   node scripts/scheduler/build-queue.mjs items.json --at "09:00,11:00,12:00,15:00,18:30"
// items.json: [ { "type":"social|publish|append", "post":"...", "comment":"...", "image":"...", "payload":"file.json" } ]
import fs from "node:fs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `build-queue.mjs — schedule items across the day\n` +
      `  node scripts/scheduler/build-queue.mjs items.json [--out queue.json] [--windows 4] [--gap 90]\n` +
      `  --at "HH:MM,HH:MM"  exact slot times, one per item, in order (overrides --windows/--gap)\n` +
      `  --windows N         split the active day (09:00–21:00) into N slots\n` +
      `  --gap M             minimum minutes between posts`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const file = argv.find((a) => a.endsWith(".json") && a !== flag("--out"));
const items = JSON.parse(fs.readFileSync(file, "utf8"));
const out = flag("--out", "queue.json");
const windows = Number(flag("--windows", "4"));
const gapMin = Number(flag("--gap", "90"));
const at = flag("--at", "");

const now = new Date();
const atTime = (minutes) => {
  const d = new Date(now);
  d.setHours(0, minutes, 0, 0);
  return d.toISOString();
};

let times;
if (at) {
  // Named slots. A schedule built around an audience — lunch, the commute home — is a
  // decision somebody made, not something to jitter. Fewer times than items is an error, not
  // something to paper over by reusing a slot: two posts firing at one minute look like a bug
  // on the Page, and nobody would notice until after they were live.
  const parsed = String(at).split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) {
      console.error(`[queue] ✗ --at: "${s}" is not a HH:MM time`);
      process.exit(1);
    }
    return Number(m[1]) * 60 + Number(m[2]);
  });
  if (parsed.length < items.length) {
    console.error(
      `[queue] ✗ --at gives ${parsed.length} slot(s) for ${items.length} item(s).` +
        ` Name one time per item.`,
    );
    process.exit(1);
  }
  times = parsed.slice(0, items.length).map(atTime);
} else {
  // Active window 09:00–21:00 local, split into `windows` slots; 1 random time per slot.
  const DAY_START = 9 * 60;
  const DAY_END = 21 * 60;
  const slot = Math.floor((DAY_END - DAY_START) / Math.max(windows, 1));
  let lastMin = -Infinity;
  times = [];
  for (let i = 0; i < items.length; i++) {
    const winBase = DAY_START + (i % windows) * slot + Math.floor((i / windows)) * 5;
    // deterministic-ish jitter without Math.random (kept reproducible across resume):
    const jitter = ((i * 37 + 13) % Math.max(slot - gapMin, 1));
    let minute = Math.max(winBase + jitter, lastMin + gapMin);
    lastMin = minute;
    times.push(atTime(minute));
  }
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
