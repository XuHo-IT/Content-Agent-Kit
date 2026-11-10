#!/usr/bin/env node
// competitor-scan.mjs — what are competitors publishing, what is breaking out, what have I missed.
//
//   node scripts/research/competitor-scan.mjs --channel @Fireship --channel @TheVerge
//   node scripts/research/competitor-scan.mjs --file brain/competitors.json --history brain/history.json
//   node scripts/research/competitor-scan.mjs --channel https://vnexpress.net --lang vi --dry-run
//
// Keyless: YouTube channels via their public Atom feed (15 newest uploads, with view + like
// counts), any blog/news site via its RSS/Atom feed. Writes brain/competitors/<date>.json and
// .md, prints REPORT=<path>. Method and caveats: docs/24-competitor-analysis.md.
//
// ENV: COMPETITORS_DIR, COMPETITOR_TZ (hours offset, default 7 = Vietnam), RESEARCH_USER_AGENT
import fs from "node:fs";
import path from "node:path";
import { fetchCompetitor, analyzeChannel, topicGaps, reportMd } from "./lib/competitors.mjs";
import { readJson, writeJson } from "../lib/state.mjs";
import { optionalEnv } from "../lib/env.mjs";

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes("--help")) {
  console.log(
    `competitor-scan.mjs — keyless competitor analysis (YouTube + any RSS site)\n` +
      `  --channel <x>       @handle | youtube URL | UC… id | site URL   (repeatable)\n` +
      `  --file <path>       JSON array of the same strings, or of {"target": "…"}\n` +
      `  --history <path>    your own history.json — enables the topic-gap table\n` +
      `  --breakout <x>      breakout threshold, × the channel's median views/day (default 2)\n` +
      `  --tz <hours>        timezone for the posting-schedule table (default $COMPETITOR_TZ or 7)\n` +
      `  --lang vi|en        report language (default vi)\n` +
      `  --out-dir <path>    default $COMPETITORS_DIR or brain/competitors\n` +
      `  --dry-run           print the report, write nothing\n` +
      `  --json              print the analysis as JSON`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const flags = (n) => argv.flatMap((a, i) => (a === n && argv[i + 1] ? [argv[i + 1]] : []));

const targets = [...flags("--channel")];
if (flag("--file")) {
  const list = readJson(flag("--file"), null);
  if (!Array.isArray(list)) {
    console.error(`[competitors] ✗ ${flag("--file")} is not a JSON array`);
    process.exit(1);
  }
  targets.push(...list.map((x) => (typeof x === "string" ? x : x.target ?? x.url)).filter(Boolean));
}
if (!targets.length) {
  console.error("[competitors] ✗ no targets — pass --channel or --file");
  process.exit(1);
}

const tz = Number(flag("--tz", optionalEnv("COMPETITOR_TZ", "7")));
const lang = flag("--lang", "vi") === "en" ? "en" : "vi";
const breakoutX = Number(flag("--breakout", "2"));
const now = Date.now();

const results = await Promise.allSettled(targets.map((t) => fetchCompetitor(t)));
const analyses = [];
const failures = [];
results.forEach((r, i) => {
  if (r.status === "fulfilled" && r.value.items.length) analyses.push(analyzeChannel(r.value, { now, tzOffset: tz, breakoutX }));
  else failures.push({ target: targets[i], error: r.status === "rejected" ? String(r.reason?.message ?? r.reason).slice(0, 120) : "no items" });
});
analyses._tz = tz;
for (const f of failures) console.error(`[competitors] ⚠ ${f.target}: ${f.error}`);
if (!analyses.length) {
  console.error("[competitors] ✗ no competitor could be fetched");
  process.exit(1);
}

const own = flag("--history") ? readJson(flag("--history"), []) : [];
const gaps = topicGaps(analyses, Array.isArray(own) ? own.map(String) : []);
const date = new Date(now).toISOString().slice(0, 10);
const md = reportMd({ analyses, gaps, failures, lang, date });

if (argv.includes("--json")) {
  console.log(JSON.stringify({ date, analyses, gaps, failures }, null, 2));
} else if (argv.includes("--dry-run")) {
  console.log(md);
}
if (!argv.includes("--dry-run")) {
  const dir = flag("--out-dir", optionalEnv("COMPETITORS_DIR", "brain/competitors"));
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, date);
  writeJson(`${base}.json`, { date, tz, analyses, gaps, failures });
  fs.writeFileSync(`${base}.md`, md, "utf8");
  console.log(`[competitors] ✓ ${analyses.length} competitor(s), ${analyses.reduce((a, x) => a + x.breakouts.length, 0)} breakout(s)`);
  console.log(`REPORT=${base}.md`);
}
