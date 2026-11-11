#!/usr/bin/env node
// suggest-cards.mjs — draft the illustration cards for a talking-head take from what is said.
//
//   node scripts/video/suggest-cards.mjs take.transcript.json                    # table + draft
//   node scripts/video/suggest-cards.mjs take.transcript.json --from 58 --to 134 --out edl.json
//   node scripts/video/suggest-cards.mjs take.transcript.json --edl edl.json     # add cards to an EDL
//
// Prints one row per sentence: what it says, the top-3 templates that fit, the pick and why
// a sentence got none. Writes an EDL whose cards have `at` = the spoken trigger word (resolved
// by talking-head.mjs), `inputs: {}`, and two notes for whoever fills them:
//   _said — the sentence, the ONLY source of what goes on the card
//   _fill — what that template wants
// Fill the inputs (slots and limits: video-templates/CATALOG.md), delete the _notes, render.
// Rules and pacing: lib/card-suggest.mjs. ENV: none. No ffmpeg.
import fs from "node:fs";
import { wordsFromTranscript } from "./lib/captions.mjs";
import { suggestCards } from "./lib/card-suggest.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `suggest-cards.mjs — illustration cards from a transcript\n` +
      `  <transcript.json>     word-timed transcript\n` +
      `  --from <s> --to <s>   only this part (default: all) — becomes the EDL's one segment\n` +
      `  --edl <file>          start from this EDL (its segments/broll are kept; cards replaced)\n` +
      `  --per-min <n>         card budget per minute (default 6)\n` +
      `  --min-gap <s>         seconds between cards (default 4)\n` +
      `  --voice-only          the take is a voice recording: the cards ARE the picture — all full,\n` +
      `                        no hide-the-speaker ceiling, denser (12/min, 1.5 s apart by default)\n` +
      `  --out <file>          default <transcript>.cards.json`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--from", "--to", "--edl", "--per-min", "--min-gap", "--out"]);
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const file = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
if (!file || !fs.existsSync(file)) {
  console.error(`[suggest-cards] ✗ transcript not found: ${file}`);
  process.exit(1);
}
const all = wordsFromTranscript(JSON.parse(fs.readFileSync(file, "utf8")));
const base = flag("--edl") ? JSON.parse(fs.readFileSync(flag("--edl"), "utf8")) : null;
const from = Number(flag("--from", base?.segments?.[0]?.from ?? 0));
const to = Number(flag("--to", base?.segments?.at(-1)?.to ?? all.at(-1)?.end ?? 0));
// with an EDL, only words that are actually used — inside one of its segments
const inUse = (w) => (base ? base.segments.some((s) => w.start >= s.from && w.end <= s.to) : w.start >= from && w.end <= to);
const words = all.filter(inUse);
if (!words.length) {
  console.error(`[suggest-cards] ✗ no words in the chosen range`);
  process.exit(1);
}
const segs = base?.segments ?? [{ from, to }];
const voiceOnly = argv.includes("--voice-only");
const { cards, table } = suggestCards(words, {
  perMin: Number(flag("--per-min", voiceOnly ? "12" : "6")),
  minGap: Number(flag("--min-gap", voiceOnly ? "1.5" : "4")),
  ...(voiceOnly ? { maxHidden: 1, layouts: ["full"], hookSec: 0, fallback: true } : {}),
  // one cut-away at a time, and a card sits inside ONE segment (edl.mjs enforces both)
  avoid: (base?.broll ?? []).filter((b) => Number.isFinite(b.at)),
  fits: (at, dur) => segs.some((s) => at >= s.from && at + dur <= s.to + 0.05),
});

for (const r of table) {
  const mark = r.pick ? `→ ${r.pick}` : r.note ? `· ${r.note}` : "";
  console.log(`${String(r.at.toFixed(1)).padStart(7)}s  ${r.text.slice(0, 64).padEnd(64)}  ${r.options.join(", ") || "-"}  ${mark}`);
}
const edl = { ...(base ?? { segments: [{ from, to }], broll: [] }), cards };
const out = flag("--out", file.replace(/\.json$/, "") + ".cards.json");
fs.writeFileSync(out, JSON.stringify(edl, null, 2) + "\n");
console.log(`[suggest-cards] ✓ ${cards.length} card(s) drafted → ${out}`);
console.log(`[suggest-cards]   fill each card's "inputs" from its "_said" only, then delete the _said/_fill notes`);
