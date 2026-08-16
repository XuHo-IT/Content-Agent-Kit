// music-search.mjs — find a background bed you may actually publish, and listen to it first.
//   node scripts/video/music-search.mjs --query "dark ambient drone"
//   node scripts/video/music-search.mjs --query "horror ambience" --get 1 --out bed.mp3
//   node scripts/video/music-search.mjs --query "…" --license by --json
//
// Openverse, no key. Every request is filtered to `commercial,modification` — the licences
// that let you put a track in a monetised video and cut it to length. CC0 is the default
// because it asks nothing of you; CC-BY is allowed and then the attribution is printed and
// must appear where you publish.
//
// ⚠️ CC0 means NOT COPYRIGHT-ENCUMBERED. It does NOT mean "will not be Content-ID claimed":
// widely-used CC0 audio gets registered by distributors who have no right to it. The claim
// is disputable — the licence and source are recorded — but it can still happen.
//
// ENV: MUSIC_API_BASE (default https://api.openverse.org), RESEARCH_USER_AGENT
import fs from "node:fs";
import path from "node:path";
import { search, credit, ALLOWED_LICENCES } from "./lib/music.mjs";
import { download } from "../media/lib/normalize.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `music-search.mjs — find a publishable music bed (Openverse, no key)\n` +
      `  --query "<text>"    what it should sound like (required)\n` +
      `  --license <id>      ${ALLOWED_LICENCES.join(" | ")} | any   (default cc0)\n` +
      `  --min-sec <n>       skip anything shorter (default 15 — a short loop is audible)\n` +
      `  --limit <n>         how many to show (default 10)\n` +
      `  --get <n>           download result n (1-based)\n` +
      `  --out <file.mp3>    where --get writes (default ./music.mp3)\n` +
      `  --json              machine-readable output\n` +
      `env: MUSIC_API_BASE, RESEARCH_USER_AGENT`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

try {
  const query = flag("--query");
  if (!query) throw new Error(`Pass --query "<what it should sound like>".`);

  const results = await search(query, {
    licence: flag("--license", "cc0"),
    minSec: Number(flag("--min-sec", "15")),
    perPage: 30,
  });

  if (results.length === 0) {
    console.log(
      `[music] nothing publishable for "${query}".\n` +
        `  Every search is filtered to commercial + modification, so a plain-language mood\n` +
        `  ("dark ambient drone", "slow tension") finds more than a genre name.`,
    );
    process.exit(0);
  }

  const limit = Number(flag("--limit", "10"));

  if (argv.includes("--json")) {
    console.log(JSON.stringify(results.slice(0, limit).map(credit), null, 2));
    process.exit(0);
  }

  const pick = flag("--get");
  if (pick) {
    const i = Number(pick) - 1;
    const track = results[i];
    if (!track) throw new Error(`--get ${pick} is out of range (${results.length} result(s)).`);
    const c = credit(track);
    const out = path.resolve(flag("--out", "music.mp3"));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const bytes = await download(track.url, out);

    console.log(`[music] ${c.title}`);
    console.log(`[music]   by       ${c.creator || "(not credited)"}`);
    console.log(`[music]   licence  ${c.license}   ${c.licenseUrl}`);
    console.log(`[music]   source   ${c.source}`);
    console.log(`[music]   ✓ ${out}  (${(bytes / 1024 / 1024).toFixed(2)}MB)`);
    if (c.creditRequired) {
      console.log(
        `\n  ⚠ THIS LICENCE REQUIRES CREDIT. Put this line wherever you publish:\n` +
          `    ${c.attribution}`,
      );
    } else {
      console.log(`\n  No attribution required — but it is recorded in media-lock.json anyway.`);
    }
    console.log(`\n  In script.json:  "music": { "file": "${path.basename(out)}", "gainDb": -20 }`);
    console.log(`MUSIC=${out}`);
    process.exit(0);
  }

  console.log(`[music] ${results.length} publishable track(s) for "${query}":\n`);
  results.slice(0, limit).forEach((t, i) => {
    const c = credit(t);
    console.log(
      `  ${String(i + 1).padStart(2)}. ${String(Math.round((t.duration ?? 0) / 1000) + "s").padStart(5)}  ` +
        `${c.license.padEnd(9)} ${c.creditRequired ? "credit!" : "       "}  ${c.title.slice(0, 44)}`,
    );
  });
  console.log(
    `\n  Longest first, CC0 preferred — a longer bed means fewer audible loop seams.\n` +
      `  Listen before you commit:  --get <n> --out /tmp/bed.mp3\n` +
      `  Or let the render pick:    "music": { "query": "${query}", "gainDb": -20 }`,
  );
} catch (e) {
  console.error(`[music] ✗ ${e.message}`);
  process.exit(1);
}
