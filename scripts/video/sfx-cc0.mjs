#!/usr/bin/env node
// sfx-cc0.mjs — fetch ghost-editor's CC0 sound pack into the kit's SFX library.
//
//   node scripts/video/sfx-cc0.mjs --list              # what it fetches, with sources
//   node scripts/video/sfx-cc0.mjs                     # fetch all → assets/sfx/<category>/cc0-<id>.mp3
//   node scripts/video/sfx-cc0.mjs --only paper-flip,deep-boom
//
// WHY THIS ONE IS SAFE TO USE COMMERCIALLY. Unlike sfx-download.mjs (myinstants.com — check
// their terms), every sound here is CC0 1.0 on Freesound, recorded or synthesised by its
// uploader (no rips of famous meme audio). kurbaitaev/ghost-editor (MIT) checked each page by
// hand on 2026-10-29 and ships the trimmed, peak-normalised WAVs in its repo; this script
// downloads those files from a PINNED commit, converts them to MP3 and files them under the
// categories lib/sfx.mjs picks from. Nothing is committed here — assets/sfx/ is gitignored.
//
// CC0 needs no credit, but provenance is still worth keeping: the script writes
// assets/sfx/CC0-SOURCES.md listing every file's Freesound page and uploader.
//
// The voice and comedy sounds ("oof", "huh?", air horn) go to a `meme` category that the
// automatic picker never reaches for (see lib/sfx.mjs) — a news video that says "thất bại"
// must not get an "oof". Ask for them by name: "sfx": { "name": "meme/cc0-oof-voice" }.
//
// ENV: VIDEO_SFX_DIR (optional, defaults to <kit>/assets/sfx). Needs ffmpeg.
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { run } from "./lib/proc.mjs";
import { sfxDir } from "./lib/paths.mjs";

const COMMIT = "ce172726c36293722b08eb57b5b307d4f06389e8";
const RAW = `https://raw.githubusercontent.com/kurbaitaev/ghost-editor/${COMMIT}/library/sfx`;

// id, kit category, freesound id, uploader, what it is
export const CC0_PACK = [
  ["paper-flip", "transition", 82379, "gynation", "a single paper flip — card and page changes"],
  ["paper-riffle", "transition", 136778, "davidbain", "a page turn — frame-story-page-turn, montages of prints"],
  ["whoosh-reverse", "transition", 446010, "SlavicMagic", "backwards whoosh that peaks on the cut"],
  ["cartoon-zip", "transition", 541507, "se2001", "mouth-made quick zip — fast exits"],
  ["whip-crack", "transition", 529925, "SciFiSounds", "whip crack — a hard, fast cut"],
  ["riser-short", "drumroll", 685256, "syntheffects", "noise riser into a reveal"],
  ["swell-short", "drumroll", 218354, "jordivburgel", "short movie swell, back-timed into a step card"],
  ["deep-boom", "reveal", 539968, "Za-Games", "deep boom under a claim or a reveal"],
  ["piano-sting", "reveal", 183500, "ecfike", "minor piano chord hit — mystery, the twist"],
  ["dark-sting", "cinematic", 578577, "nomiqbomi", "dark orchestral crescendo — frame-story-silent-film, the turn"],
  ["gong-hit", "success", 436486, "rabban625", "orchestral gong — a verdict, a stop"],
  ["tada", "success", 397355, "plasterbrain", "brass tada — done, win"],
  ["glitch-hit", "alert", 673773, "h0p1r4e7o", "digital glitch — an error on screen"],
  ["error-beep", "fail", 478191, "JonnyRuss01", "soft error beep — a myth, a wrong answer"],
  ["glass-break", "fail", 141563, "avrahamy", "a window breaking — something broke"],
  ["wood-plane", "emphasis", 847374, "DeqstersLab", "one hand-plane stroke — craft, workshop"],
  ["vinyl-scratch", "meme", 71853, "ludvique", "record scratch — wait, freeze frame"],
  ["metal-clang", "meme", 125404, "jasonLON", "baking pan clang — sudden, absurd"],
  ["violin-sad", "meme", 234311, "andyssoundbox", "Hearts and Flowers on violin — mock pity"],
  ["group-ooh", "meme", 870650, "CHallSmith", "a group's 'ooh' — a burn"],
  ["cricket-chirp", "meme", 822935, "_sinny_", "a cricket — awkward silence"],
  ["air-horn", "meme", 414208, "jacksonacademyashmore", "air horn — hype"],
  ["huh-voice", "meme", 150505, "davdud101", "voice: huh?"],
  ["wow-voice", "meme", 167355, "willy_ineedthatapp_com", "voice: wow"],
  ["bike-honk", "meme", 188039, "AntumDeluge", "bicycle horn — a bad joke"],
  ["oof-voice", "meme", 719053, "unfa", "an original 'oof'"],
  ["oh-no-voice", "meme", 801386, "Sadiquecat", "voice: oh no oh no"],
];

const argv = process.argv.slice(2);
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

function help() {
  console.log(
    `sfx-cc0.mjs — fetch the CC0 sound pack (ghost-editor, Freesound CC0 1.0) into assets/sfx/\n` +
      `  --list            print the pack and its sources, fetch nothing\n` +
      `  --only a,b        fetch only these ids\n` +
      `  --force           re-fetch files that already exist\n` +
      `categories: ${[...new Set(CC0_PACK.map((p) => p[1]))].join(" ")} ('meme' is never auto-picked)\n` +
      `env: VIDEO_SFX_DIR (optional). Needs ffmpeg.`,
  );
}

export function sourcesMarkdown(pack = CC0_PACK) {
  return (
    `# CC0 sound pack — sources\n\n` +
    `Written by scripts/video/sfx-cc0.mjs. Every file is CC0 1.0 (public domain) on Freesound —\n` +
    `no credit required; kept for provenance. Trimmed and peak-normalised by kurbaitaev/ghost-editor\n` +
    `(MIT) at commit ${COMMIT}.\n\n` +
    `| file | what | Freesound page | uploader |\n| --- | --- | --- | --- |\n` +
    pack.map(([id, cat, fid, user, what]) => `| \`${cat}/cc0-${id}.mp3\` | ${what} | https://freesound.org/s/${fid}/ | ${user} |`).join("\n") +
    "\n"
  );
}

async function main() {
  if (argv.includes("--help") || argv.includes("-h")) return help();
  if (argv.includes("--list")) {
    for (const [id, cat, fid, user, what] of CC0_PACK) console.log(`${id.padEnd(15)} ${cat.padEnd(11)} freesound.org/s/${fid}  ${user} — ${what}`);
    return;
  }
  const only = new Set(String(flag("--only", "")).split(",").filter(Boolean));
  const dir = sfxDir();
  const tmp = fs.mkdtempSync(path.join(tmpdir(), "sfx-cc0-"));
  let ok = 0, skipped = 0, failed = 0;
  try {
    for (const [id, cat] of CC0_PACK) {
      if (only.size && !only.has(id)) continue;
      const out = path.join(dir, cat, `cc0-${id}.mp3`);
      if (fs.existsSync(out) && !argv.includes("--force")) { skipped++; continue; }
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const res = await fetch(`${RAW}/cc0-${id}.wav`);
      if (!res.ok) { console.error(`[sfx-cc0] ✗ ${id}: HTTP ${res.status}`); failed++; continue; }
      const wav = path.join(tmp, `${id}.wav`);
      fs.writeFileSync(wav, Buffer.from(await res.arrayBuffer()));
      await run("ffmpeg", ["-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-q:a", "3", out]);
      console.log(`[sfx-cc0] ✓ ${cat}/cc0-${id}.mp3`);
      ok++;
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "CC0-SOURCES.md"), sourcesMarkdown(), "utf8");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`[sfx-cc0] ${ok} fetched, ${skipped} already there, ${failed} failed → ${dir}`);
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
