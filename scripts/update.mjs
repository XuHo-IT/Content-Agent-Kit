// update.mjs — edit an already-published item (title/content/image/etc.).
//   node scripts/update.mjs <fix.json>     // { "id", ...fields to change }  (array ok)
// ENV: SITE_URL, INGEST_API_TOKEN.  Routes through your update endpoint.
import fs from "node:fs";
import { requireEnv, siteUrl } from "./lib/env.mjs";
import { postJson, uploadImage } from "./lib/http.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `update.mjs — edit a published item\n` +
      `  node scripts/update.mjs <fix.json> [--path /api/ingest/update]\n` +
      `  fix.json: { "id":"...", ...changed fields }  (or an array of such)\n` +
      `env: SITE_URL, INGEST_API_TOKEN`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const file = argv.find((a) => a.endsWith(".json"));
if (!file) throw new Error("Pass a fix .json file.");

let items = JSON.parse(fs.readFileSync(file, "utf8"));
if (!Array.isArray(items)) items = [items];

const token = requireEnv("INGEST_API_TOKEN");
const path = flag("--path") || "/api/ingest/update";
let ok = 0;
for (const it of items) {
  if (!it.id) {
    console.error("[update] skip item without id");
    continue;
  }
  if (it.image && !/^https?:\/\//i.test(it.image)) it.image = await uploadImage(it.image);
  const r = await postJson(`${siteUrl()}${path}`, it, { token });
  if (r.ok) {
    ok++;
    console.log(`[update] ✓ ${it.id}`);
  } else {
    console.error(`[update] ✗ ${it.id} ${r.status}: ${r.text.slice(0, 200)}`);
  }
}
console.log(`[update] done — ${ok}/${items.length} updated`);
