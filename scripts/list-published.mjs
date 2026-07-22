// list-published.mjs — dump recent published items for the AUDIT agent to grade.
//   node scripts/list-published.mjs [--limit 40] [--out audit_input.json]
// Two backends (auto): a read API on your site, OR direct Supabase REST.
// ENV: SITE_URL + INGEST_API_TOKEN  (for a site read endpoint at LIST_PATH),
//   OR SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (direct REST).
import fs from "node:fs";
import { optionalEnv, siteUrl } from "./lib/env.mjs";
import { getJson } from "./lib/http.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `list-published.mjs — dump published items for audit\n` +
      `  node scripts/list-published.mjs [--limit 40] [--out audit_input.json]\n` +
      `env: SITE_URL+INGEST_API_TOKEN+LIST_PATH  OR  SUPABASE_URL+SUPABASE_SERVICE_ROLE_KEY`,
  );
  process.exit(0);
}
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const limit = flag("--limit", "40");
const out = flag("--out", "audit_input.json");

let rows = [];
const sbUrl = optionalEnv("SUPABASE_URL");
const sbKey = optionalEnv("SUPABASE_SERVICE_ROLE_KEY");
const listPath = optionalEnv("LIST_PATH");

if (listPath) {
  const r = await getJson(`${siteUrl()}${listPath}?limit=${limit}`, {
    token: optionalEnv("INGEST_API_TOKEN"),
  });
  if (!r.ok) throw new Error(`list ${r.status}: ${r.text.slice(0, 200)}`);
  rows = r.json?.items ?? r.json ?? [];
} else if (sbUrl && sbKey) {
  const table = optionalEnv("PUBLISH_TABLE", "stories");
  const cols = optionalEnv("PUBLISH_COLS", "id,title,subtitle,cover_url,created_at");
  const url = `${sbUrl.replace(/\/+$/, "")}/rest/v1/${table}?status=eq.published&select=${cols}&order=created_at.desc&limit=${limit}`;
  const res = await fetch(url, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  rows = await res.json();
} else {
  throw new Error("Set LIST_PATH (site API) or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.");
}

fs.writeFileSync(out, JSON.stringify(rows, null, 2), "utf8");
console.log(`[list] ${rows.length} published item(s) → ${out}`);
