// sfx-download.mjs — fetch a raw sound-effect library from myinstants.com.
//   node scripts/video/sfx-download.mjs [--target DIR] [--max N] [--config cfg.json]
// Then prune it to short stingers:  node scripts/video/sfx-filter.mjs
//
// SFX are OPTIONAL — with no assets/sfx/ the render pipeline just skips them.
// Ported from AI-auto-generate-video/scripts/download-sfx.ts (MIT — see NOTICE.md).
// Sound files come from myinstants.com; check their terms before commercial use.
//
// ENV: none.
import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { KIT_ROOT } from "./lib/paths.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(
    `sfx-download.mjs — download a raw SFX library (optional)\n` +
      `  --target DIR    where to write (default <kit>/assets/sfx-raw)\n` +
      `  --max N         max files per search term (default 5)\n` +
      `  --config FILE   JSON { category: [search terms] } overriding the defaults\n` +
      `env: none`,
  );
  process.exit(0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

// Categories the SFX selector understands. Edit here or pass --config.
const DEFAULT_CONFIG = {
  transition: ["whoosh", "swoosh", "swish", "pop", "click", "page-flip", "slide"],
  emphasis: ["ding", "tick", "chime", "bell", "pop", "ping"],
  alert: ["notification", "alert", "warning", "alarm"],
  success: ["tada", "win", "achievement", "level-up", "success", "victory"],
  fail: ["wrong", "buzzer", "error", "wrong-answer", "fail"],
  drumroll: ["drumroll", "drum-roll", "snare", "boom"],
  applause: ["applause", "clap", "cheering"],
  laugh: ["laugh", "haha"],
  countdown: ["countdown", "beep", "timer"],
  cinematic: ["cinematic", "epic", "rise", "impact"],
  reveal: ["reveal", "bling", "magic", "sparkle"],
  outro: ["tada", "outro", "ending", "finale"],
};

const target = path.resolve(flag("--target", path.join(KIT_ROOT, "assets", "sfx-raw")));
const max = parseInt(flag("--max", "5"), 10);
const configPath = flag("--config");
const config = configPath ? JSON.parse(fs.readFileSync(configPath, "utf8")) : DEFAULT_CONFIG;

const UA = "Mozilla/5.0 (content-agent-kit SFX downloader)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query) {
  const url = `https://www.myinstants.com/en/search/?name=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    console.warn(`[sfx] ! search "${query}" returned ${res.status}`);
    return [];
  }
  const html = await res.text();
  const matches = html.match(/media\/sounds\/[A-Za-z0-9_\-.]+\.mp3/g) ?? [];
  return [...new Set(matches)].slice(0, max);
}

async function downloadOne(relUrl, outPath) {
  if (fs.existsSync(outPath)) return "skipped";
  const res = await fetch(`https://www.myinstants.com/${relUrl}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) return "failed";
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(await res.arrayBuffer()));
  return "downloaded";
}

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const [category, terms] of Object.entries(config)) {
  console.log(`[sfx] ${category}`);
  for (const term of terms) {
    let urls = [];
    try {
      urls = await search(term);
    } catch (e) {
      console.warn(`[sfx] ! search "${term}" failed: ${e.message}`);
      continue;
    }
    for (const rel of urls) {
      const name = rel.split("/").pop();
      const outPath = path.join(target, category, name);
      try {
        const r = await downloadOne(rel, outPath);
        if (r === "downloaded") downloaded++;
        else if (r === "skipped") skipped++;
        else failed++;
      } catch {
        failed++;
      }
      await sleep(100); // be polite to the host
    }
  }
}

console.log(`[sfx] ✓ ${downloaded} downloaded, ${skipped} already present, ${failed} failed → ${target}`);
console.log(`[sfx]   next: node scripts/video/sfx-filter.mjs --source ${target}`);
