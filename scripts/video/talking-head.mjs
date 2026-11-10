#!/usr/bin/env node
// talking-head.mjs — someone speaking on camera → a captioned 9:16 short, in one command.
//
//   node scripts/video/talking-head.mjs take.mp4 --transcript take.json --from 96 --to 128 \
//        --crop 405:600:438:0 --punch 0.1 --theme clinic-sage --hook "Đổi bằng lái không cần xếp hàng" \
//        --credit "Nguồn: Đài PTTH Thanh Hoá · CC BY 3.0" --out short.mp4
//
// The chain, all ffmpeg + the kit's own libraries (docs/26-auto-edit.md):
//   1. trim to --from/--to (a talking-head clip is usually one answer out of a longer take)
//   2. autocut — pauses out, 12 ms fades, alternating punch-ins, -16 LUFS
//   3. crop (--crop w:h:x:y in source pixels — keep burned-in TV bars and logos out) → 9:16
//   4. active-word captions from the transcript's REAL word timings, remapped across the cuts
//   5. optional hook title for the first seconds, and a credit line for licensed footage
//
// THE TRANSCRIPT is the one input this kit does not make: speech-to-text needs a model, and
// the kit has no dependencies. Any of these writes a JSON this reads (word timestamps on):
//   faster-whisper (MIT):  model.transcribe(..., word_timestamps=True) → {segments:[{words}]}
//   whisperX (BSD-2), whisper.cpp (MIT, `-ojf`) — see docs/26.
// Without --transcript the video is still cut and framed, just uncaptioned.
//
// ENV: none. Needs ffmpeg + ffprobe.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { run } from "./lib/proc.mjs";
import { parseSilences, keepSegments, summary, buildFilter, remapTime } from "./lib/autocut.mjs";
import { wordsFromTranscript, toAssActiveWords, escapeSubtitlePath, escapeAss } from "./lib/captions.mjs";
import { resolveTheme, hslToRgb } from "./lib/theme.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `talking-head.mjs — on-camera speech → captioned 9:16 short\n` +
      `  <input>                video with speech\n` +
      `  --transcript <json>    word-timestamped transcript (faster-whisper / whisperX / whisper.cpp)\n` +
      `  --from <s> --to <s>    the part of the take to use (default: all)\n` +
      `  --crop <w:h:x:y>       source region to keep before the 9:16 reframe (drop TV bars/logos)\n` +
      `  --punch <0..0.3>       alternate punch-in per cut (default 0.08)\n` +
      `  --theme <preset>       caption accent from an industry palette (docs/25)\n` +
      `  --hook "<text>"        big title for the first 2.5 s\n` +
      `  --credit "<text>"      small permanent credit line — REQUIRED for CC BY footage\n` +
      `  --font <name>          caption font (default Be Vietnam Pro, falls back to Arial)\n` +
      `  --out <file>           default <input>.short.mp4`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--transcript", "--from", "--to", "--crop", "--punch", "--theme", "--hook", "--credit", "--font", "--out"]);
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const input = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
if (!input || !fs.existsSync(input)) {
  console.error(`[talking-head] ✗ input not found: ${input}`);
  process.exit(1);
}
const out = flag("--out", input.replace(/\.[^.]+$/, "") + ".short.mp4");
const work = fs.mkdtempSync(path.join(path.dirname(path.resolve(out)), ".th-"));
const from = Number(flag("--from", "0"));
const to = flag("--to") === null ? null : Number(flag("--to"));
const punch = Math.max(0, Math.min(0.3, Number(flag("--punch", "0.08"))));
const crop = flag("--crop");
if (crop && !/^\d+:\d+:\d+:\d+$/.test(crop)) {
  console.error(`[talking-head] ✗ --crop must be w:h:x:y in source pixels, got "${crop}"`);
  process.exit(1);
}
const W = 1080, H = 1920;

const stderrOf = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args);
    let e = "";
    p.stderr.on("data", (d) => (e += d));
    p.on("close", (c) => (c === 0 ? resolve(e) : reject(new Error(e.slice(-600)))));
    p.on("error", reject);
  });

try {
  // 1. trim — re-encode so the cut points are frame-exact, not keyframe-snapped
  const trimmed = path.join(work, "trim.mp4");
  const tArgs = ["-hide_banner", "-y", "-ss", String(from), "-i", input];
  if (to !== null) tArgs.push("-t", String(to - from));
  tArgs.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-c:a", "aac", "-b:a", "256k", trimmed);
  await run("ffmpeg", tArgs);
  const dur = Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", trimmed])).trim());

  // 2–3. autocut + crop + 9:16
  const log = await stderrOf(["-hide_banner", "-nostats", "-i", trimmed, "-af", "silencedetect=noise=-35dB:d=0.28", "-vn", "-f", "null", "-"]);
  const keep = keepSegments(parseSilences(log), dur, { pad: 0.1, minKeep: 0.2 });
  const sum = summary(keep, dur);
  console.log(`[talking-head] ${sum.duration}s → ${sum.kept}s (${sum.cuts} cuts)`);
  const cut = path.join(work, "cut.mp4");
  const filterFile = path.join(work, "filter.txt");
  fs.writeFileSync(filterFile, buildFilter(keep, { hasVideo: true, punch, vertical: true, loudnorm: true, width: W, height: H, crop }));
  await run("ffmpeg", ["-hide_banner", "-y", "-i", trimmed, "-filter_complex_script", filterFile, "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", cut], { trimErr: 1200 });

  // 4. captions from real timings, shifted by --from and remapped across the cuts
  const theme = flag("--theme") ? resolveTheme(flag("--theme")) : null;
  const toHex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
  const accent = theme ? toHex(hslToRgb(theme.hue, 0.9, 0.58)) : "#ffe14d";
  const font = flag("--font", "Be Vietnam Pro");
  let ass = null;
  if (flag("--transcript")) {
    const words = wordsFromTranscript(JSON.parse(fs.readFileSync(flag("--transcript"), "utf8")))
      .filter((w) => w.start >= from && (to === null || w.end <= to))
      .map((w) => ({ ...w, start: w.start - from, end: w.end - from }))
      // a word whose midpoint fell inside a removed pause was not spoken in the kept audio
      .filter((w) => keep.some((k) => (w.start + w.end) / 2 >= k.start && (w.start + w.end) / 2 <= k.end))
      .map((w) => ({ ...w, start: remapTime(w.start, keep), end: remapTime(w.end, keep) }));
    ass = toAssActiveWords(words, { width: W, height: H, accent, font, sizeRatio: 0.058 });
    console.log(`[talking-head] captions: ${words.length} words`);
  } else {
    ass = toAssActiveWords([], { width: W, height: H, accent, font });
    console.log(`[talking-head] no --transcript — cut and framed, uncaptioned`);
  }
  // 5. hook + credit as extra ASS events (one libass pass burns everything)
  const extra = [];
  const hookStyle = `Style: Hook,${font},${Math.round(H * 0.052)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H66000000,-1,0,0,0,100,100,0,0,3,${Math.round(H * 0.012)},0,8,70,70,${Math.round(H * 0.1)},1`;
  const creditStyle = `Style: Credit,Arial,${Math.round(H * 0.016)},&H33FFFFFF,&H33FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,3,6,0,1,40,40,40,1`;
  if (flag("--hook")) extra.push(`Dialogue: 2,0:00:00.00,0:00:02.60,Hook,,0,0,0,,{\\fad(120,200)\\c${"&H00" + accent.slice(5, 7) + accent.slice(3, 5) + accent.slice(1, 3) + "&"}}${escapeAss(flag("--hook"))}`);
  if (flag("--credit")) extra.push(`Dialogue: 1,0:00:00.00,9:59:59.00,Credit,,0,0,0,,${escapeAss(flag("--credit"))}`);
  ass = ass.replace("\n\n[Events]", `\n${hookStyle}\n${creditStyle}\n\n[Events]`) + extra.join("\n") + (extra.length ? "\n" : "");
  const assFile = path.join(work, "captions.ass");
  fs.writeFileSync(assFile, ass);
  await run("ffmpeg", ["-hide_banner", "-y", "-i", cut, "-vf", `subtitles='${escapeSubtitlePath(assFile)}'`, "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", out], { trimErr: 1200 });
  fs.writeFileSync(out.replace(/\.mp4$/, "") + ".cuts.json", JSON.stringify({ input: path.basename(input), from, to, crop, punch, summary: sum, keep }, null, 2) + "\n");
  console.log(`[talking-head] ✓ ${out}`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
