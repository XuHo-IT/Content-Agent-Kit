#!/usr/bin/env node
// transcript-diff.mjs — score a machine transcript against a checked one (WER + word timing).
//
//   node scripts/video/transcript-diff.mjs checked.json machine.json
//   node scripts/video/transcript-diff.mjs checked.json whisper.json phowhisper.json   # A/B two models
//
// Use it before switching speech models or settings: fix one transcript by hand (the
// reference), transcribe the same audio with each candidate, and compare. Lower WER is better;
// for captions the timing matters as much — "within 150 ms" is the share of words whose start
// lands close enough that the highlighted word looks in sync. Method: lib/transcript-eval.mjs.
// ENV: none. No ffmpeg.
import fs from "node:fs";
import path from "node:path";
import { wordsFromTranscript } from "./lib/captions.mjs";
import { compareTranscripts } from "./lib/transcript-eval.mjs";

const argv = process.argv.slice(2);
if (argv.length < 2 || argv.includes("--help")) {
  console.log(
    `transcript-diff.mjs — WER + timing of machine transcripts vs a checked one\n` +
      `  <reference.json> <candidate.json> [<candidate2.json> …]\n` +
      `  --from <s> --to <s>   only this part of the reference\n` +
      `  --json                machine-readable`,
  );
  process.exit(argv.includes("--help") ? 0 : 1);
}
const VALUE = new Set(["--from", "--to"]);
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const files = argv.filter((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
for (const f of files) if (!fs.existsSync(f)) { console.error(`[tdiff] ✗ not found: ${f}`); process.exit(1); }
const load = (f) => wordsFromTranscript(JSON.parse(fs.readFileSync(f, "utf8")));
const ref = load(files[0]);
const opts = { from: Number(flag("--from", "-Infinity")), to: Number(flag("--to", "Infinity")) };
const rows = files.slice(1).map((f) => ({ file: path.basename(f), ...compareTranscripts(ref, load(f), opts) }));
if (argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
else {
  for (const r of rows) {
    console.log(`[tdiff] ${r.file}: WER ${(r.wer * 100).toFixed(1)}% (no tone marks: ${(r.werFolded * 100).toFixed(1)}%) — ${r.subs} wrong, ${r.dels} missed, ${r.ins} extra of ${r.ref} words`);
    console.log(`        timing: ${r.timing.matched} matched words, mean ${r.timing.meanAbs}s off, 90% within ${r.timing.p90Abs}s, ${Math.round(r.timing.within150ms * 100)}% within 150 ms`);
    if (r.worst.length) console.log(`        heard wrong: ${r.worst.map((x) => `${x.at}s "${x.ref}"→"${x.hyp}"`).join(", ")}`);
  }
}
