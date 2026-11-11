#!/usr/bin/env node
// freshness.mjs — which facts this kit relies on have gone stale, and what to search to renew them.
//
//   node scripts/maintenance/freshness.mjs                 # table: fresh / stale, age, what to do
//   node scripts/maintenance/freshness.mjs --json          # for the agent (skills/freshness-check)
//   node scripts/maintenance/freshness.mjs --mark platform-policy-news --note "no change for VN"
//
// Run at the start of a session that will publish, advertise or render for a client — the
// freshness-check skill does it for you. It reads each fact's date from the file that holds it
// (a CHECKED constant) or from state/freshness.json (this project's own record, gitignored),
// and lists the searches that renew it. It never edits a rule itself: the agent researches,
// cites, and then edits — or records "checked, unchanged" with --mark.
// Items and their max ages: scripts/maintenance/lib/freshness.mjs. ENV: none. No network.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ITEMS, freshness, markChecked } from "./lib/freshness.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STATE = path.join(KIT, "state", "freshness.json");

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `freshness.mjs — stale facts (platform specs, ads law, policy news, licences) and how to renew them\n` +
      `  (no args)              print the table\n` +
      `  --json                 machine-readable, for the freshness-check skill\n` +
      `  --stale                only the stale ones\n` +
      `  --mark <id> [--note "<what you found>"]   record that <id> was checked today\n` +
      `  --today <YYYY-MM-DD>   pretend it is another day (testing)\n` +
      `items: ${ITEMS.map((i) => i.id).join(", ")}`,
  );
  process.exit(0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const today = flag("--today", new Date().toISOString().slice(0, 10));
const readState = () => {
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return {}; }
};

if (flag("--mark")) {
  try {
    const next = markChecked(readState(), flag("--mark"), today, flag("--note", ""));
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify(next, null, 2) + "\n");
    console.log(`[freshness] ✓ ${flag("--mark")} checked ${today}${flag("--note") ? ` — ${flag("--note")}` : ""}`);
  } catch (e) {
    console.error(`[freshness] ✗ ${e.message}`);
    process.exitCode = 1;
  }
} else {
  const rows = freshness({
    today,
    state: readState(),
    readFile: (p) => { try { return fs.readFileSync(path.join(KIT, p), "utf8"); } catch { return null; } },
  }).filter((r) => !argv.includes("--stale") || r.stale);
  if (argv.includes("--json")) console.log(JSON.stringify({ today, items: rows }, null, 2));
  else {
    const stale = rows.filter((r) => r.stale);
    console.log(`[freshness] ${today} — ${stale.length} of ${rows.length} item(s) need checking`);
    for (const r of rows) {
      const when = r.checkedAt ? `${r.checkedAt} (${r.age} d, max ${r.maxAgeDays})` : `never checked (max ${r.maxAgeDays} d)`;
      console.log(`  ${r.stale ? "✗" : "✓"} ${r.id.padEnd(22)} ${r.kind.padEnd(8)} ${when}`);
      if (!r.stale) continue;
      console.log(`      ${r.what}`);
      if (r.command) console.log(`      run: ${r.command}`);
      for (const q of r.queries) console.log(`      search: ${q}`);
      if (r.official?.length) console.log(`      trust: ${r.official.join(", ")}`);
      console.log(`      then: ${r.update}`);
    }
    if (stale.length) console.log(`[freshness] after checking one: node scripts/maintenance/freshness.mjs --mark <id> --note "<finding>"`);
  }
}
