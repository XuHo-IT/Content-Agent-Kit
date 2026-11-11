#!/usr/bin/env node
// talking-head.mjs — someone speaking on camera → a captioned 9:16 short, in one command.
//
//   node scripts/video/talking-head.mjs take.mp4 --transcript take.json --from 96 --to 128 \
//        --crop 405:600:438:0 --style pop --theme clinic-sage --hook "Đổi bằng lái không cần xếp hàng" \
//        --credit "Nguồn: Đài PTTH Thanh Hoá · CC BY 3.0" --out short.mp4
//
//   node scripts/video/talking-head.mjs report.mp4 --edl edl.json --transcript report.json --style cinematic
//
// The chain, all ffmpeg + the kit's own libraries (docs/26-auto-edit.md):
//   1. assemble — one --from/--to/--crop range, or several from an edit decision list (--edl),
//      each with its own 9:16 crop; B-roll cut-aways laid OVER the speaker while the voice runs on
//   2. autocut — pauses out, 12 ms fades, alternating punch-ins, -16 LUFS
//   3. active-word captions from the transcript's REAL word timings, remapped across every cut
//   4. a named edit style (--style, lib/edit-styles.mjs): caption look, grade, punch rhythm, hook card
//   5. optional hook title, credit line for licensed footage, progress bar
//
// EDL (--edl edl.json) — all times are in the SOURCE video's seconds:
//   { "segments": [ { "from": 58.6, "to": 73.0, "crop": "315:560:600:0" }, … ],
//     "broll":    [ { "at": 66.8, "src": 40.0, "dur": 2.6, "crop": "315:560:482:0" }, … ],
//     "cards":    [ { "at": 78.0, "dur": 4, "templateId": "frame-trend-stat-odometer",
//                     "inputs": { "value": "30–50", … }, "layout": "full" | "pip" }, … ] }
// A B-roll's `at` must fall inside a segment; its picture comes from `src`, the audio stays the
// segment's own. Keep B-roll under ~25% of a talking-head runtime — the face is the content.
//
// CARDS are the illustrations: any kit template, rendered with your `inputs` (and --theme) and
// laid over the speaker while their voice runs on — a number when they say a number, a checklist
// when they list. `pip` keeps the speaker in a corner box, for when the face matters (someone
// telling their own story); `full` is for voice-over. Each card is a hyperframes render (~1 min).
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
import { resolveStyle, hookStyle, STYLE_IDS, EDIT_STYLES } from "./lib/edit-styles.mjs";
import { sourceToJoined, validateEdl, cardsOnCut } from "./lib/edl.mjs";
import { composeTemplate } from "./lib/compose.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `talking-head.mjs — on-camera speech → captioned 9:16 short\n` +
      `  <input>                video with speech\n` +
      `  --transcript <json>    word-timestamped transcript (faster-whisper / whisperX / whisper.cpp)\n` +
      `  --from <s> --to <s>    the part of the take to use (default: all)\n` +
      `  --crop <w:h:x:y>       source region to keep before the 9:16 reframe (drop TV bars/logos)\n` +
      `  --edl <json>           several ranges + B-roll + template cards, instead of --from/--to/--crop\n` +
      `  --style <id>           ${STYLE_IDS.join(" | ")} (default clean)\n` +
      Object.entries(EDIT_STYLES).map(([k, s]) => `                           ${k.padEnd(12)} ${s.label}\n`).join("") +
      `  --punch <0..0.3>       alternate punch-in per cut (default: the style's)\n` +
      `  --theme <preset>       caption accent from an industry palette (docs/25)\n` +
      `  --hook "<text>"        big title for the first 2.6 s\n` +
      `  --credit "<text>"      small permanent credit line — REQUIRED for CC BY footage\n` +
      `  --progress / --no-progress   thin progress bar (default: the style's)\n` +
      `  --font <name>          caption font override\n` +
      `  --out <file>           default <input>.short.mp4`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--transcript", "--from", "--to", "--crop", "--edl", "--style", "--punch", "--theme", "--hook", "--credit", "--font", "--out"]);
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const input = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
const die = (m) => {
  console.error(`[talking-head] ✗ ${m}`);
  process.exit(1);
};
if (!input || !fs.existsSync(input)) die(`input not found: ${input}`);

let style;
try {
  style = resolveStyle(flag("--style", "clean"));
} catch (e) {
  die(e.message);
}
const out = flag("--out", input.replace(/\.[^.]+$/, "") + ".short.mp4");
const punch = Math.max(0, Math.min(0.3, Number(flag("--punch", String(style.punch)))));
const progress = argv.includes("--progress") ? true : argv.includes("--no-progress") ? false : style.progress;
const W = 1080, H = 1920;
// The speaker's corner box on a `pip` card: top-right, clear of the caption band at the bottom.
const PIP = { w: 252, h: 448, border: 7, margin: 32, top: 56 };

const probeDur = async (f) =>
  Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])).trim());

// ── the edit decision list ───────────────────────────────────────────────────
let edl;
if (flag("--edl")) {
  edl = JSON.parse(fs.readFileSync(flag("--edl"), "utf8"));
} else {
  const from = Number(flag("--from", "0"));
  const to = flag("--to") === null ? await probeDur(input) : Number(flag("--to"));
  edl = { segments: [{ from, to, crop: flag("--crop") }], broll: [] };
}
const problems = validateEdl(edl);
if (problems.length) die(problems.join("\n  "));

const stderrOf = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args);
    let e = "";
    p.stderr.on("data", (d) => (e += d));
    p.on("close", (c) => (c === 0 ? resolve(e) : reject(new Error(e.slice(-600)))));
    p.on("error", reject);
  });

const cover = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1`;
const theme = flag("--theme") ? resolveTheme(flag("--theme")) : null;
const toHex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
const accent = theme ? toHex(hslToRgb(theme.hue, 0.9, 0.58)) : style.accent;

const work = fs.mkdtempSync(path.join(path.dirname(path.resolve(out)), ".th-"));
try {
  // 1. assemble — each segment framed to 9:16 on its own crop, B-roll overlaid on top.
  //    Re-encoded so cut points are frame-exact, not keyframe-snapped.
  // 0. cards — each template rendered once, at its card's length, through the same theme
  const cardFiles = [];
  for (const [i, c] of (edl.cards ?? []).entries()) {
    const f = path.join(work, `card${i}.mp4`);
    console.log(`[talking-head] card ${i + 1}/${edl.cards.length}: ${c.templateId} (${c.dur}s, ${c.layout ?? "full"})`);
    await composeTemplate({ templateId: c.templateId, inputs: c.inputs ?? {}, aspect: "9:16", theme: theme ?? undefined,
      durationSec: c.dur + 0.4, outputPath: f, log: (m) => console.log(`[talking-head]   ${m}`) });
    cardFiles.push({ ...c, file: f });
  }

  const segFiles = [];
  for (const [i, seg] of edl.segments.entries()) {
    const f = path.join(work, `seg${i}.mp4`);
    const args = ["-hide_banner", "-y", "-ss", String(seg.from), "-t", String(seg.to - seg.from), "-i", input];
    const rolls = (edl.broll ?? []).filter((b) => b.at >= seg.from && b.at < seg.to);
    for (const b of rolls) args.push("-ss", String(b.src), "-t", String(b.dur), "-i", input);
    const chain = [`[0:v]${seg.crop ? `crop=${seg.crop},` : ""}${cover}[b0]`];
    rolls.forEach((b, j) => {
      const at = (b.at - seg.from).toFixed(3);
      const end = Math.min(seg.to - seg.from, b.at - seg.from + b.dur).toFixed(3);
      chain.push(
        `[${j + 1}:v]${b.crop ? `crop=${b.crop},` : ""}${cover}${style.broll ? "," + style.broll : ""},` +
          `format=yuva420p,fade=t=in:st=0:d=0.12:alpha=1,setpts=PTS-STARTPTS+${at}/TB[r${j}]`,
        `[b${j}][r${j}]overlay=enable='between(t,${at},${end})':eof_action=pass[b${j + 1}]`,
      );
    });
    chain.push(`[b${rolls.length}]null[v]`);
    args.push("-filter_complex", chain.join(";"), "-map", "[v]", "-map", "0:a",
      "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "256k", f);
    await run("ffmpeg", args, { trimErr: 1200 });
    segFiles.push({ ...seg, file: f, dur: await probeDur(f) });
  }
  const joined = path.join(work, "joined.mp4");
  if (segFiles.length === 1) fs.copyFileSync(segFiles[0].file, joined);
  else {
    const list = path.join(work, "list.txt");
    fs.writeFileSync(list, segFiles.map((s) => `file '${s.file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n") + "\n");
    await run("ffmpeg", ["-hide_banner", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined]);
  }
  const dur = await probeDur(joined);

  // 2. autocut on the assembled timeline (already 9:16 — no re-crop)
  const log = await stderrOf(["-hide_banner", "-nostats", "-i", joined, "-af", "silencedetect=noise=-35dB:d=0.28", "-vn", "-f", "null", "-"]);
  const keep = keepSegments(parseSilences(log), dur, { pad: 0.1, minKeep: 0.2 });
  const sum = summary(keep, dur);
  console.log(`[talking-head] ${edl.segments.length} segment(s), ${(edl.broll ?? []).length} B-roll, ${(edl.cards ?? []).length} card(s) · ${sum.duration}s → ${sum.kept}s (${sum.cuts} cuts) · style ${flag("--style", "clean")}`);
  const cut = path.join(work, "cut.mp4");
  const filterFile = path.join(work, "filter.txt");
  fs.writeFileSync(filterFile, buildFilter(keep, { hasVideo: true, punch, vertical: false, loudnorm: true, width: W, height: H }));
  await run("ffmpeg", ["-hide_banner", "-y", "-i", joined, "-filter_complex_script", filterFile, "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", cut], { trimErr: 1200 });
  const cutDur = await probeDur(cut);
  const placed = cardsOnCut(cardFiles, segFiles, (t) => remapTime(t, keep), cutDur);
  // A full-frame card already says in big type what the voice is saying: captions there would
  // sit on top of the card's own text. They stay on `pip` cards, or on any card with captions:true.
  const quiet = placed.filter((c) => (c.layout ?? "full") === "full" && c.captions !== true);

  // 3. captions from real timings: source time → assembled time → cut time
  const cap = { ...style.caption, ...(flag("--font") ? { font: flag("--font") } : {}) };
  if (cap.boxColour === "accent") cap.boxColour = accent;
  let ass;
  if (flag("--transcript")) {
    const words = sourceToJoined(wordsFromTranscript(JSON.parse(fs.readFileSync(flag("--transcript"), "utf8"))), segFiles)
      // a word whose midpoint fell inside a removed pause was not spoken in the kept audio
      .filter((w) => keep.some((k) => (w.start + w.end) / 2 >= k.start && (w.start + w.end) / 2 <= k.end))
      .map((w) => ({ ...w, start: remapTime(w.start, keep), end: remapTime(w.end, keep) }))
      .filter((w) => !quiet.some((c) => (w.start + w.end) / 2 >= c.start && (w.start + w.end) / 2 < c.end));
    ass = toAssActiveWords(words, { width: W, height: H, accent, ...cap });
    console.log(`[talking-head] captions: ${words.length} words`);
  } else {
    ass = toAssActiveWords([], { width: W, height: H, accent, ...cap });
    console.log(`[talking-head] no --transcript — cut and framed, uncaptioned`);
  }

  // 4–5. hook + credit as extra ASS events (one libass pass burns everything)
  const hook = hookStyle(style, { width: W, height: H, accent });
  const creditStyle = `Style: Credit,Arial,${Math.round(H * 0.016)},&H33FFFFFF,&H33FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,3,6,0,1,40,40,${progress ? 52 : 40},1`;
  const extra = [];
  if (flag("--hook")) extra.push(`Dialogue: 2,0:00:00.00,0:00:02.60,Hook,,0,0,0,,${hook.tag}${escapeAss(hook.text(flag("--hook")))}`);
  if (flag("--credit")) extra.push(`Dialogue: 1,0:00:00.00,9:59:59.00,Credit,,0,0,0,,${escapeAss(flag("--credit"))}`);
  ass = ass.replace("\n\n[Events]", `\n${hook.style}\n${creditStyle}\n\n[Events]`) + extra.join("\n") + (extra.length ? "\n" : "");
  const assFile = path.join(work, "captions.ass");
  fs.writeFileSync(assFile, ass);

  // grade BEFORE captions so the text is not graded/grained; progress bar last, on top
  // cards go over the GRADED picture but are not graded themselves (a film grain on a chart is
  // noise); a `pip` card re-shows the speaker from the same graded frame in a framed corner box.
  const pips = placed.filter((c) => c.layout === "pip").length;
  const fc = [`[0:v]${style.grade ? style.grade + "," : "null,"}split=${pips + 1}[g0]${Array.from({ length: pips }, (_, k) => `[spk${k}]`).join("")}`];
  let last = 0, pipK = 0;
  placed.forEach((c, j) => {
    const a = c.start.toFixed(3), e = c.end.toFixed(3);
    fc.push(
      `[${j + 1}:v]${cover},format=yuva420p,fade=t=in:st=0:d=0.15:alpha=1,setpts=PTS-STARTPTS+${a}/TB[c${j}]`,
      `[g${last}][c${j}]overlay=enable='between(t,${a},${e})':eof_action=pass[g${last + 1}]`,
    );
    last++;
    if (c.layout === "pip") {
      const k = pipK++;
      fc.push(
        `[spk${k}]scale=${PIP.w}:${PIP.h},pad=${PIP.w + 2 * PIP.border}:${PIP.h + 2 * PIP.border}:${PIP.border}:${PIP.border}:white[p${k}]`,
        `[g${last}][p${k}]overlay=x=${W - PIP.w - 2 * PIP.border - PIP.margin}:y=${PIP.top}:enable='between(t,${a},${e})'[g${last + 1}]`,
      );
      last++;
    }
  });
  fc.push(`[g${last}]subtitles='${escapeSubtitlePath(assFile)}'[sub]`);
  if (progress) {
    fc.push(`color=c=${accent.replace("#", "0x")}:s=${W}x10:r=30:d=${cutDur.toFixed(2)}[bar]`);
    fc.push(`[sub][bar]overlay=x='-w+w*t/${cutDur.toFixed(3)}':y=${H - 10}:shortest=1[v]`);
  } else fc.push(`[sub]null[v]`);
  await run("ffmpeg", ["-hide_banner", "-y", "-i", cut, ...placed.flatMap((c) => ["-i", c.file]), "-filter_complex", fc.join(";"), "-map", "[v]", "-map", "0:a",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", out], { trimErr: 1200 });

  fs.writeFileSync(
    out.replace(/\.mp4$/, "") + ".cuts.json",
    JSON.stringify({ input: path.basename(input), style: flag("--style", "clean"), punch, progress, edl, summary: sum, keep }, null, 2) + "\n",
  );
  console.log(`[talking-head] ✓ ${out}  (${cutDur.toFixed(1)}s)`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
