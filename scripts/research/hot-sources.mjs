// hot-sources.mjs — raw fetch from the keyless research sources, no scoring.
//   node scripts/research/hot-sources.mjs --topic "AI coding agents"
//   node scripts/research/hot-sources.mjs --topic "veo 3" --sources reddit,hn --days 7 --json
//   node scripts/research/hot-sources.mjs --list           # which sources exist
//
// This is the layer that talks to the network and nothing else. Ranking, dedup and state
// live in topic-radar.mjs, which is what you normally run — this one exists so you can see
// what a source actually returned when a radar result looks wrong.
//
// Every source is keyless. A source that fails is reported, not fatal.
//
// ENV: GITHUB_TOKEN (optional, raises the rate limit), NEWS_RSS_LOCALE, RESEARCH_USER_AGENT
import { SOURCE_IDS, SOURCES, searchAll } from "./lib/sources.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `hot-sources.mjs — pull recent items about a topic from the keyless sources\n` +
      `  --topic "<text>"     what to research (required)\n` +
      `  --sources <a,b>      ${SOURCE_IDS.join(",")}   (default: all)\n` +
      `  --days <n>           lookback window (default 30)\n` +
      `  --limit <n>          max items per source (default 50)\n` +
      `  --json               machine-readable output\n` +
      `  --list               show the sources and exit\n` +
      `env: GITHUB_TOKEN (optional), NEWS_RSS_LOCALE (default vi|VN|VN:vi), RESEARCH_USER_AGENT`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

if (argv.includes("--list")) {
  console.log(`[research] sources:\n`);
  for (const id of SOURCE_IDS) {
    const s = SOURCES[id];
    console.log(`  ${id.padEnd(8)} ${s.label.padEnd(16)} ${s.keyEnv.length ? `${s.keyEnv[0]} (optional)` : "no key needed"}`);
  }
  process.exit(0);
}

try {
  const topic = flag("--topic");
  if (!topic) throw new Error(`Pass --topic "<what to research>".`);

  const sources = String(flag("--sources", SOURCE_IDS.join(","))).split(",").map((s) => s.trim()).filter(Boolean);
  const days = Number(flag("--days", "30"));
  const limit = Number(flag("--limit", "50"));

  const { items, status } = await searchAll(topic, { sources, days, limit });

  if (argv.includes("--json")) {
    console.log(JSON.stringify({ topic, days, status, items }, null, 2));
    console.error(`ITEMS=${items.length}`);
    process.exit(0);
  }

  console.log(`[research] "${topic}" — last ${days} day(s)\n`);
  for (const id of sources) console.log(`  ${id.padEnd(8)} ${status[id] ?? "not run"}`);
  console.log("");

  for (const it of items.slice(0, 40)) {
    const e = it.engagement ?? {};
    const age = it.publishedAt ? `${Math.round((Date.now() - new Date(it.publishedAt).getTime()) / 86_400_000)}d` : "?";
    console.log(
      `  ${it.source.padEnd(7)} ${age.padStart(4)}  ` +
        `${String(`${e.votes ?? 0}↑ ${e.comments ?? 0}💬`).padEnd(14)} ${it.title.slice(0, 76)}`,
    );
  }
  if (items.length > 40) console.log(`  … and ${items.length - 40} more (use --json for all)`);
  console.log(`\nITEMS=${items.length}`);
} catch (e) {
  console.error(`[research] ✗ ${e.message}`);
  process.exit(1);
}
