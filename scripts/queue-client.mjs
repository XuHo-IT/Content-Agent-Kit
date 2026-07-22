// queue-client.mjs — talk to the idea/dedup queue API.
//   node scripts/queue-client.mjs pull [--status new] [--limit 20] [--out queue_raw.json]
//   node scripts/queue-client.mjs posted <source_url>
//   node scripts/queue-client.mjs known [--out known.json]
// ENV: SITE_URL, INGEST_API_TOKEN, (optional) QUEUE_PATH (default /api/queue).
import fs from "node:fs";
import { requireEnv, siteUrl, optionalEnv } from "./lib/env.mjs";
import { getJson, patchJson } from "./lib/http.mjs";

const argv = process.argv.slice(2);
const cmd = argv[0];
if (!cmd || argv.includes("--help")) {
  console.log(
    `queue-client.mjs — idea/dedup queue\n` +
      `  pull [--status new] [--limit 20] [--out file.json]   pull work items\n` +
      `  posted <source_url>                                   mark an item posted (idempotent)\n` +
      `  known [--out file.json]                               list ALL known source_urls (dedup)\n` +
      `env: SITE_URL, INGEST_API_TOKEN, QUEUE_PATH(=/api/queue)`,
  );
  process.exit(cmd ? 0 : 1);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const token = requireEnv("INGEST_API_TOKEN");
const base = siteUrl();
const qpath = optionalEnv("QUEUE_PATH", "/api/queue");

if (cmd === "pull") {
  const status = flag("--status", "new");
  const limit = flag("--limit", "20");
  const r = await getJson(`${base}${qpath}?status=${status}&limit=${limit}`, { token });
  if (!r.ok) throw new Error(`pull ${r.status}: ${r.text.slice(0, 200)}`);
  const items = r.json?.items ?? [];
  const out = flag("--out", "queue_raw.json");
  fs.writeFileSync(out, JSON.stringify(items, null, 2), "utf8");
  console.log(`[queue] pulled ${items.length} item(s) → ${out}`);
} else if (cmd === "posted") {
  const url = argv[1];
  if (!url || url.startsWith("--")) throw new Error("Usage: posted <source_url>");
  const r = await patchJson(`${base}${qpath}`, { source_url: url, status: "posted" }, { token });
  if (!r.ok) throw new Error(`posted ${r.status}: ${r.text.slice(0, 200)}`);
  console.log(`[queue] ✓ marked posted: ${url}`);
} else if (cmd === "known") {
  const r = await getJson(`${base}${qpath}?known=1`, { token });
  if (!r.ok) throw new Error(`known ${r.status}: ${r.text.slice(0, 200)}`);
  const urls = r.json?.urls ?? [];
  const out = flag("--out");
  if (out) fs.writeFileSync(out, JSON.stringify(urls, null, 2), "utf8");
  console.log(`[queue] ${urls.length} known url(s)${out ? ` → ${out}` : ""}`);
} else {
  throw new Error(`Unknown command: ${cmd}`);
}
