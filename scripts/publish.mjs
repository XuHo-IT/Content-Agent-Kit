// publish.mjs — create a new content item via your ingest API.
//   node scripts/publish.mjs <payload.json> [--image local.png] [--path /api/ingest]
//   node scripts/publish.mjs --json '{"title":"...","content":["..."]}'
//
// ENV: SITE_URL, INGEST_API_TOKEN (+ image-host vars if --image is a local file).
// 201 = created (prints ID= line). 409 = duplicate → treated as already-done (exit 0).
import fs from "node:fs";
import { requireEnv, siteUrl } from "./lib/env.mjs";
import { postJson, uploadImage } from "./lib/http.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `publish.mjs — create an item via ingest API\n` +
      `  node scripts/publish.mjs <payload.json> [--image local.png] [--path /api/ingest]\n` +
      `  node scripts/publish.mjs --json '<inline json>'\n` +
      `env: SITE_URL, INGEST_API_TOKEN`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);

let payload;
const jsonInline = flag("--json");
if (jsonInline) payload = JSON.parse(jsonInline);
else {
  const file = argv.find((a) => a.endsWith(".json"));
  if (!file) throw new Error("Pass a payload .json file or --json '<inline>'.");
  payload = JSON.parse(fs.readFileSync(file, "utf8"));
}

const token = requireEnv("INGEST_API_TOKEN");
const base = siteUrl();
const path = flag("--path") || "/api/ingest";

const image = flag("--image");
if (image) {
  const url = await uploadImage(image);
  payload.image = url; // your API maps `image` → cover
  console.log(`[publish] uploaded image → ${url}`);
}

const { status, ok, json, text } = await postJson(`${base}${path}`, payload, { token });
if (status === 409) {
  console.log(`[publish] 409 duplicate — already on site, skipping (OK).`);
  process.exit(0);
}
if (!ok) {
  console.error(`[publish] ✗ ${status}: ${text.slice(0, 300)}`);
  process.exit(1);
}
const id = json?.id ?? json?.storyId ?? json?.data?.id;
if (id) console.log(`ID=${id}`);
console.log(`[publish] ✓ ${status} created${id ? ` (${id})` : ""}`);
