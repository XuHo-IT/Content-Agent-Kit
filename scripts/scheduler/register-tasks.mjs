// register-tasks.mjs — register OS scheduler jobs, one per queued item.
// Windows: creates `schtasks` one-shot tasks. Unix: prints the `at`/cron lines to add.
// (For production, prefer GitHub Actions cron — see docs/06-scheduling.md + templates/workflows/.)
//   node scripts/scheduler/register-tasks.mjs [--queue queue.json] [--prefix Agent] [--unregister]
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson } from "../lib/state.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `register-tasks.mjs — register one OS task per queued item\n` +
      `  [--queue queue.json] [--prefix Agent] [--unregister]\n` +
      `  Windows → schtasks; other OS → prints suggested cron/at lines.`,
  );
  process.exit(0);
}
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const queueFile = flag("--queue", "queue.json");
const prefix = flag("--prefix", "Agent");
const unregister = argv.includes("--unregister");
const here = path.dirname(fileURLToPath(import.meta.url));
const runItem = path.join(here, "run-item.mjs");
const items = readJson(queueFile, []);
const isWin = process.platform === "win32";

for (const it of items) {
  const taskName = `${prefix}_${it.id}`;
  if (isWin) {
    spawnSync("schtasks", ["/delete", "/tn", taskName, "/f"], { stdio: "ignore" });
    if (unregister) continue;
    const when = new Date(it.scheduledTime);
    const hhmm = `${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`;
    const cmd = `"${process.execPath}" "${runItem}" ${it.id} --queue "${path.resolve(queueFile)}"`;
    const r = spawnSync("schtasks", [
      "/create", "/tn", taskName, "/sc", "once", "/st", hhmm, "/f", "/tr", cmd,
    ], { stdio: "inherit" });
    console.log(`[sched] ${taskName} @ ${hhmm} ${r.status === 0 ? "✓" : "✗"}`);
  } else {
    if (unregister) continue;
    const when = new Date(it.scheduledTime);
    console.log(
      `# ${taskName}: add to cron/at →\n` +
        `${when.getMinutes()} ${when.getHours()} * * *  ${process.execPath} ${runItem} ${it.id} --queue ${path.resolve(queueFile)}`,
    );
  }
}
if (!isWin) console.log("\n(Non-Windows: paste the lines above into `crontab -e`, or use GitHub Actions cron.)");
