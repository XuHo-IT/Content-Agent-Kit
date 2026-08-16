// topic-radar.mjs — "what is hot about <topic> today", ranked and de-repeated.
//   node scripts/research/topic-radar.mjs --topic "AI coding agents"
//   node scripts/research/topic-radar.mjs --topic "veo 3" --days 7 --top 5
//   node scripts/research/topic-radar.mjs --topic "…" --dry-run     # no state written
//
// Fetch (hot-sources) -> dedup -> score -> drop what earlier runs already used -> write
// brain/radar/<date>-<slug>.json and .md, and print RADAR=<path>.
//
// The seen-ledger is the point. Without it, asking the same topic two mornings running
// produces the same top story twice, and the second video is a repost with a new voice.
//
// ENV: RADAR_DIR, RADAR_DAYS, RADAR_TOP, RADAR_SOURCES, RADAR_HALFLIFE_DAYS,
//      GITHUB_TOKEN (optional), NEWS_RSS_LOCALE
import fs from "node:fs";
import path from "node:path";
import { SOURCE_IDS, searchAll } from "./lib/sources.mjs";
import { rank, dropSeen, seenKeys, slugify } from "./lib/rank.mjs";
import { readJson, writeJson } from "../lib/state.mjs";
import { optionalEnv } from "../lib/env.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `topic-radar.mjs — rank today's hottest items for a topic\n` +
      `  --topic "<text>"      what to research (required)\n` +
      `  --sources <a,b>       ${SOURCE_IDS.join(",")}   (default $RADAR_SOURCES or all)\n` +
      `  --days <n>            lookback window (default $RADAR_DAYS or 30)\n` +
      `  --top <n>             how many to keep (default $RADAR_TOP or 10)\n` +
      `  --half-life <n>       freshness half-life in days (default 3)\n` +
      `  --out-dir <path>      where to write (default $RADAR_DIR or brain/radar)\n` +
      `  --no-dedup            keep items earlier runs already used\n` +
      `  --dry-run             print the ranking, write nothing\n` +
      `  --json                machine-readable output\n` +
      `env: RADAR_DIR, RADAR_DAYS, RADAR_TOP, RADAR_SOURCES, RADAR_HALFLIFE_DAYS,\n` +
      `     GITHUB_TOKEN (optional), NEWS_RSS_LOCALE`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

/** The ledger lives beside the radar output so a project carries its own memory. */
function seenFile(outDir) {
  return path.join(path.dirname(outDir), "radar-seen.json");
}

function brief({ topic, days, top, status, dropped, items }) {
  const when = new Date().toISOString().slice(0, 10);
  const lines = [
    `# Radar — ${topic}`,
    ``,
    `${when} · last ${days} day(s) · top ${top}`,
    ``,
    `| # | score | age | sources | story |`,
    `| --- | --- | --- | --- | --- |`,
  ];
  items.forEach((it, i) => {
    const age = it.publishedAt
      ? `${Math.round((Date.now() - new Date(it.publishedAt).getTime()) / 86_400_000)}d`
      : "?";
    const title = it.title.replace(/\|/g, "\\|").slice(0, 90);
    lines.push(`| ${i + 1} | ${it.score} | ${age} | ${it.sources.join(", ")} | [${title}](${it.url}) |`);
  });

  lines.push(``, `## Sources`, ``);
  for (const [id, s] of Object.entries(status)) lines.push(`- \`${id}\` — ${s}`);
  if (dropped > 0) {
    lines.push(
      ``,
      `${dropped} item(s) were dropped as already used by an earlier run. Pass \`--no-dedup\` to see them.`,
    );
  }
  lines.push(
    ``,
    `## Next`,
    ``,
    `Read the primary source before writing anything — the announcement, paper or changelog,`,
    `not a blog summarising it. Then \`create-video\`, or \`daily-topic-video\` for the whole chain.`,
    ``,
  );
  return lines.join("\n");
}

try {
  const topic = flag("--topic");
  if (!topic) throw new Error(`Pass --topic "<what to research>".`);

  const sources = String(flag("--sources", optionalEnv("RADAR_SOURCES", SOURCE_IDS.join(","))))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const days = Number(flag("--days", optionalEnv("RADAR_DAYS", "30")));
  const top = Number(flag("--top", optionalEnv("RADAR_TOP", "10")));
  const halfLife = Number(flag("--half-life", optionalEnv("RADAR_HALFLIFE_DAYS", "3")));
  const outDir = path.resolve(flag("--out-dir", optionalEnv("RADAR_DIR", path.join("brain", "radar"))));
  const dryRun = argv.includes("--dry-run");
  const asJson = argv.includes("--json");

  const { items: raw, status } = await searchAll(topic, { sources, days, limit: 50 });
  if (raw.length === 0) {
    const why = Object.entries(status).map(([k, v]) => `${k}: ${v}`).join(" · ");
    throw new Error(`No items came back for "${topic}". ${why}`);
  }

  // rank() dedups internally — heat is a percentile within a source and has to be measured
  // before the merge, or a cross-source story is ranked against a group it never competed in.
  const ranked = rank(raw, { now: Date.now(), halfLifeDays: halfLife });
  const merged = ranked;

  const ledgerFile = seenFile(outDir);
  const ledger = readJson(ledgerFile, { keys: [] });
  const kept = argv.includes("--no-dedup") ? ranked : dropSeen(ranked, ledger.keys ?? []);
  const dropped = ranked.length - kept.length;
  const picked = kept.slice(0, top);

  if (picked.length === 0) {
    // Not an error, and not something to paper over by relaxing the filter: the honest
    // answer is that this topic produced nothing new since the last run.
    console.log(
      `[radar] "${topic}" — nothing new. ${ranked.length} item(s) found, all already used ` +
        `by an earlier run. Widen with --days, or pass --no-dedup to see them anyway.`,
    );
    console.log(`RADAR=`);
    process.exit(0);
  }

  const payload = {
    topic,
    generatedAt: new Date().toISOString(),
    days,
    halfLifeDays: halfLife,
    sources,
    status,
    found: raw.length,
    afterDedup: merged.length,
    droppedAsSeen: dropped,
    items: picked,
  };

  if (dryRun) {
    console.log(asJson ? JSON.stringify(payload, null, 2) : brief({ topic, days, top, status, dropped, items: picked }));
    console.log(`\n[radar] --dry-run: nothing written.`);
    process.exit(0);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const stem = `${new Date().toISOString().slice(0, 10)}-${slugify(topic)}`;
  const jsonPath = path.join(outDir, `${stem}.json`);
  const mdPath = path.join(outDir, `${stem}.md`);
  writeJson(jsonPath, payload);
  fs.writeFileSync(mdPath, brief({ topic, days, top, status, dropped, items: picked }), "utf8");

  // Record only what was HANDED OUT. Recording everything found would bury a story the
  // first run ranked 40th and never showed anyone.
  const keys = new Set(ledger.keys ?? []);
  for (const it of picked) for (const k of seenKeys(it)) keys.add(k);
  writeJson(ledgerFile, { keys: [...keys], updatedAt: new Date().toISOString() });

  if (asJson) {
    console.log(JSON.stringify({ ...payload, jsonPath, mdPath }, null, 2));
  } else {
    console.log(brief({ topic, days, top, status, dropped, items: picked }));
    console.log(`✓ ${jsonPath}`);
    console.log(`✓ ${mdPath}`);
  }
  console.log(`RADAR=${jsonPath}`);
} catch (e) {
  console.error(`[radar] ✗ ${e.message}`);
  process.exit(1);
}
