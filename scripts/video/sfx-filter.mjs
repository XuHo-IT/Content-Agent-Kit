// sfx-filter.mjs — keep only SHORT stingers from a raw SFX download.
//   node scripts/video/sfx-filter.mjs [--source DIR] [--target DIR] [--min-sec 0.1] [--max-sec 3.0] [--overwrite]
//
// The raw library is noisy (meme clips, long tracks). Scene SFX must be brief or
// they fight the narration. Reads <source>/<category>/*.mp3 and copies the ones
// inside the duration window to <target>/<category>/.
//
// Ported from AI-auto-generate-video/scripts/filter-sfx.ts (MIT — see NOTICE.md).
// ENV: none. Needs ffprobe on PATH.
import fs from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { run } from "./lib/proc.mjs";
import { KIT_ROOT } from "./lib/paths.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(
    `sfx-filter.mjs — prune a raw SFX library down to short stingers\n` +
      `  --source DIR    raw library (default <kit>/assets/sfx-raw)\n` +
      `  --target DIR    filtered output (default <kit>/assets/sfx)\n` +
      `  --min-sec N     shortest to keep (default 0.1)\n` +
      `  --max-sec N     longest to keep (default 3.0)\n` +
      `  --overwrite     replace files already in the target\n` +
      `env: none (needs ffprobe on PATH)`,
  );
  process.exit(0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

const source = path.resolve(flag("--source", path.join(KIT_ROOT, "assets", "sfx-raw")));
const target = path.resolve(flag("--target", path.join(KIT_ROOT, "assets", "sfx")));
const minSec = parseFloat(flag("--min-sec", "0.1"));
const maxSec = parseFloat(flag("--max-sec", "3.0"));
const overwrite = argv.includes("--overwrite");

if (!fs.existsSync(source)) {
  console.error(`[sfx] ✗ source not found: ${source} — run sfx-download.mjs first.`);
  process.exit(1);
}

async function durationSec(file) {
  const out = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  const d = parseFloat(out.trim());
  return Number.isNaN(d) ? null : d;
}

let kept = 0;
let tooLong = 0;
let tooShort = 0;
let unreadable = 0;
const rejects = [];

for (const category of fs.readdirSync(source)) {
  const catDir = path.join(source, category);
  if (!fs.statSync(catDir).isDirectory()) continue;

  for (const file of fs.readdirSync(catDir)) {
    if (!file.toLowerCase().endsWith(".mp3")) continue;
    const full = path.join(catDir, file);

    let d;
    try {
      d = await durationSec(full);
    } catch {
      unreadable++;
      continue;
    }
    if (d === null) {
      unreadable++;
      continue;
    }
    if (d < minSec) {
      tooShort++;
      continue;
    }
    if (d > maxSec) {
      tooLong++;
      rejects.push({ file: `${category}/${file}`, d });
      continue;
    }

    const outPath = path.join(target, category, file);
    if (fs.existsSync(outPath) && !overwrite) continue;
    await mkdir(path.dirname(outPath), { recursive: true });
    await copyFile(full, outPath);
    kept++;
  }
}

console.log(
  `[sfx] ✓ kept ${kept} (${minSec}–${maxSec}s) → ${target}\n` +
    `[sfx]   rejected: ${tooLong} too long, ${tooShort} too short, ${unreadable} unreadable`,
);
if (rejects.length) {
  console.log(`[sfx]   longest rejects:`);
  rejects.sort((a, b) => b.d - a.d).slice(0, 10)
    .forEach((r) => console.log(`[sfx]     ${r.d.toFixed(1)}s  ${r.file}`));
}
