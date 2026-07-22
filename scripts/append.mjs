// append.mjs — append new parts/chapters to an existing serialized item.
//   node scripts/append.mjs <chapters.json>   // { "id", "parts":[{title,content[]}], "targetParts" }
//   node scripts/append.mjs --json '{"id":"...","parts":[...]}'
// ENV: SITE_URL, INGEST_API_TOKEN.  Updates ledger if a --ledger file is given.
import fs from "node:fs";
import { requireEnv, siteUrl } from "./lib/env.mjs";
import { postJson } from "./lib/http.mjs";
import { ledgerUpsert, ledgerRemove } from "./lib/state.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `append.mjs — append parts to a serialized item\n` +
      `  node scripts/append.mjs <chapters.json> [--path /api/ingest/append] [--ledger ledger.json]\n` +
      `env: SITE_URL, INGEST_API_TOKEN`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);

const inline = flag("--json");
const file = argv.find((a) => a.endsWith(".json") && a !== flag("--ledger"));
const payload = inline ? JSON.parse(inline) : JSON.parse(fs.readFileSync(file, "utf8"));
if (!payload.id || !Array.isArray(payload.parts)) throw new Error("Payload needs { id, parts:[...] }.");

const token = requireEnv("INGEST_API_TOKEN");
const path = flag("--path") || "/api/ingest/append";
const { status, ok, text } = await postJson(`${siteUrl()}${path}`, payload, { token });
if (!ok && status !== 409) {
  console.error(`[append] ✗ ${status}: ${text.slice(0, 300)}`);
  process.exit(1);
}
console.log(`[append] ✓ ${status} — +${payload.parts.length} part(s) to ${payload.id}`);

const ledger = flag("--ledger");
if (ledger) {
  const target = payload.targetParts;
  const written = payload.partsWritten; // caller may pass running total
  if (target && written != null && written >= target) {
    ledgerRemove(ledger, payload.id);
    console.log(`[append] ledger: ${payload.id} complete → removed`);
  } else if (written != null) {
    ledgerUpsert(ledger, { id: payload.id, partsWritten: written, targetParts: target });
  }
}
