#!/usr/bin/env node
// speech-cuts.mjs — read a take's transcript, show what an editor would cut BY EAR.
//
//   node scripts/video/speech-cuts.mjs take.transcript.json                 # → take.transcript.cuts.txt
//   node scripts/video/speech-cuts.mjs take.transcript.json --from 58 --to 134
//   node scripts/video/speech-cuts.mjs take.transcript.json --remove-words 40-46 --keep-words 12
//
// Fillers ("ờ", "ừm"), words said twice, and sentences started then said again. Nothing is cut
// here — this writes the review. When it reads right, pass the SAME flags to talking-head.mjs
// with --cut-words and the cut happens there, together with the pause cut:
//
//   node scripts/video/talking-head.mjs take.mp4 --transcript take.transcript.json --cut-words --keep-words 12
//
// Method: lib/speech-edit.mjs, docs/26-auto-edit.md §2c. ENV: none. No ffmpeg.
import fs from "node:fs";
import { wordsFromTranscript } from "./lib/captions.mjs";
import { findSpeechCuts, dropSpans, reviewText } from "./lib/speech-edit.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `speech-cuts.mjs — fillers, repeats and retakes in a word-timed transcript\n` +
      `  <transcript.json>       from transcribe.mjs (or faster-whisper / whisperX / whisper.cpp)\n` +
      `  --from <s> --to <s>     only this part of the take\n` +
      `  --remove-words <a-b,…>  also cut these word indices\n` +
      `  --keep-words <a-b,…>    never cut these\n` +
      `  --json                  print the decisions as JSON instead of the review\n` +
      `  --out <file>            default <transcript>.cuts.txt`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--from", "--to", "--remove-words", "--keep-words", "--out"]);
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const file = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
if (!file || !fs.existsSync(file)) {
  console.error(`[speech-cuts] ✗ transcript not found: ${file}`);
  process.exit(1);
}
const from = Number(flag("--from", "0")), to = Number(flag("--to", "Infinity"));
const words = wordsFromTranscript(JSON.parse(fs.readFileSync(file, "utf8"))).filter((w) => w.start >= from && w.end <= to);
if (!words.length) {
  console.error(`[speech-cuts] ✗ no words in ${from}–${to}s`);
  process.exit(1);
}
let drop;
try {
  drop = findSpeechCuts(words, { removeWords: flag("--remove-words", ""), keepWords: flag("--keep-words", "") });
} catch (e) {
  console.error(`[speech-cuts] ✗ ${e.message}`);
  process.exit(1);
}
const spans = dropSpans(words, drop);
if (argv.includes("--json")) {
  console.log(JSON.stringify({ dropped: [...drop].map(([i, why]) => ({ i, w: words[i].w, start: words[i].start, why })), spans }, null, 2));
} else {
  const text = reviewText(words, drop);
  const out = flag("--out", file.replace(/\.json$/, "") + ".cuts.txt");
  fs.writeFileSync(out, text + "\n");
  console.log(text.split("\n").slice(-2).join("\n"));
  console.log(`[speech-cuts] ✓ review → ${out}  (${spans.length} cut(s), ${spans.reduce((a, s) => a + s.end - s.start, 0).toFixed(1)}s)`);
}
