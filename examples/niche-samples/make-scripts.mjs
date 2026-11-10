#!/usr/bin/env node
// make-scripts.mjs — writes the sixteen niche sample scripts (examples/niche-samples/<niche>/script.json).
//
//   node examples/niche-samples/make-scripts.mjs [<niche> …]     # all, or only the ones named
//   node scripts/video/render.mjs examples/niche-samples/<niche>/script.json --captions off
//
// One video per vertical (16), each on its industry palette (templates/INDUSTRIES.template.json),
// 8–10 scenes and ≥270 words so it passes validate-script --strict (≈90 s). No template repeats
// inside a video. Content is evergreen advice, not news; numbers are either arithmetic shown with
// its assumptions and labelled illustrative, or settled facts.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { NICHES_1 } from "./niches-1.mjs";
import { NICHES_2 } from "./niches-2.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// One video per vertical in templates/INDUSTRIES.template.json — 16 in all.
export const NICHES = { ...NICHES_1, ...NICHES_2 };

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  const only = process.argv.slice(2);
  for (const [id, n] of Object.entries(NICHES)) {
    if (only.length && !only.includes(id)) continue;
    const { label, ...script } = n;
    const dir = path.join(HERE, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "script.json"), JSON.stringify({ _niche: label, ...script }, null, 2) + "\n");
    console.log(`✓ ${id}/script.json  (${script.scenes.length} scenes, theme ${script.theme})`);
  }
}
