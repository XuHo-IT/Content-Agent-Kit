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
//                     "inputs": { "value": "30–50", … }, "layout": "full" | "pip" | "split" }, … ],
//     "behind":   [ { "at": "gấp", "dur": 2.5, "text": "GẤP 3" } ],   ← big text BEHIND the speaker
//     "fix":      [ ["Cờ lốt", "Claude"] ] }    ← caption corrections, regex per word
// A card's (or B-roll's) `at` may be a SPOKEN WORD instead of seconds — "at": "tăng", with
// "near": 70 when the word is said more than once — resolved against --transcript.
// A card may carry "sfx": "transition/cc0-whoosh-reverse" (under assets/sfx/, see sfx-cc0.mjs).
// A card that names none gets a soft automatic one (lib/edl.mjs#autoCardSfx) unless the last
// sound was < 3 s ago; "sfx": false on a card, or --no-card-sfx, turns that off.
// A B-roll's `at` must fall inside a segment; its picture comes from `src`, the audio stays the
// segment's own. Keep B-roll under ~25% of a talking-head runtime — the face is the content.
//
// CARDS are the illustrations: any kit template, rendered with your `inputs` (and --theme) and
// laid over the speaker while their voice runs on — a number when they say a number, a checklist
// when they list. `pip` keeps the speaker in a corner box, for when the face matters (someone
// telling their own story); `split` puts the card on the top half and the speaker on the bottom
// half ("speakerY" picks which 960 px of them; --faces picks it for you); `full` is for
// voice-over. Each card is a hyperframes render (~1 min); a `split` card renders at 16:9.
//
// VOICE ONLY: give an audio file (.wav/.mp3/.m4a, or a video with no picture) and every
// segment is a flat --theme background; the cards are the picture. B-roll, pip/split and
// "behind" are refused (nothing to show), and the hide-the-speaker ceiling is lifted.
// Draft cards for it with: suggest-cards.mjs --voice-only.
//
// --faces (Python + mediapipe, see lib/vision.mjs): finds the head in each segment and moves
// captions and the --hook off it; frames every `split` card's speaker half around it.
// "behind" text needs the same setup: the person is masked out (person-matte.mjs) and laid
// back over the text, so the words sit between the speaker and the wall.
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
import { fileURLToPath } from "node:url";
import { run } from "./lib/proc.mjs";
import { parseSilences, keepSegments, summary, buildFilter, remapTime } from "./lib/autocut.mjs";
import { wordsFromTranscript, toAssActiveWords, escapeSubtitlePath, escapeAss, assTime, assColour } from "./lib/captions.mjs";
import { resolveTheme, hslToRgb } from "./lib/theme.mjs";
import { resolveStyle, hookStyle, STYLE_IDS, EDIT_STYLES } from "./lib/edit-styles.mjs";
import { sourceToJoined, validateEdl, cardsOnCut } from "./lib/edl.mjs";
import { composeTemplate } from "./lib/compose.mjs";
import { findSpeechCuts, dropSpans, subtractSpans, resolveAnchors, sfxDensity, applyWordFixes } from "./lib/speech-edit.mjs";
import { withAutoSfx, splitCardFit, cardSlotProblems } from "./lib/edl.mjs";
import { declaredSlots, nearestSlot } from "./lib/slots.mjs";
import { listTemplateIds } from "./lib/paths.mjs";
import { headBox, textSlot, splitSpeakerY, moveAssEvents } from "./lib/faces.mjs";
import { detectFaces, sampleTimes } from "./face-boxes.mjs";
import { personMatte } from "./person-matte.mjs";
import { makeCover, pickCoverTime, titleProblems } from "./cover.mjs";
import { postDraft } from "./lib/post-draft.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `talking-head.mjs — on-camera speech → captioned 9:16 short\n` +
      `  <input>                video with speech\n` +
      `  --transcript <json>    word-timestamped transcript (faster-whisper / whisperX / whisper.cpp)\n` +
      `  --from <s> --to <s>    the part of the take to use (default: all)\n` +
      `  --crop <w:h:x:y>       source region to keep before the 9:16 reframe (drop TV bars/logos)\n` +
      `  --edl <json>           several ranges + B-roll + template cards, instead of --from/--to/--crop\n` +
      `  --cut-words            also cut fillers, repeats and retakes found in --transcript (review first: speech-cuts.mjs)\n` +
      `  --remove-words <a-b>   with --cut-words: also cut these word indices (from the speech-cuts review)\n` +
      `  --keep-words <a-b>     with --cut-words: never cut these\n` +
      `  --music <file>         background bed, ducked under the voice (licence: cc0/pdm/by — credit a BY track)\n` +
      `  --music-lufs <n>       bed loudness before ducking (default -26)\n` +
      `  --sfx-volume <0..1>    default level for a card's "sfx" (default 0.5)\n` +
      `  --style <id>           ${STYLE_IDS.join(" | ")} (default clean)\n` +
      Object.entries(EDIT_STYLES).map(([k, s]) => `                           ${k.padEnd(12)} ${s.label}\n`).join("") +
      `  --punch <0..0.3>       alternate punch-in per cut (default: the style's)\n` +
      `  --theme <preset>       caption accent from an industry palette (docs/25)\n` +
      `  --hook "<text>"        big title for the first 2.6 s\n` +
      `  --credit "<text>"      small permanent credit line — REQUIRED for CC BY footage\n` +
      `  --faces                keep captions/hook off the speaker's head (Python + mediapipe)\n` +
      `  --no-card-sfx          no automatic sound when a card appears\n` +
      `  --cover                also write <out>.cover.jpg (a clear face + the --hook, no captions) and,\n` +
      `                         with --transcript, <out>.post.md — the spoken text + limits to write captions from\n` +
      `  --cover-title "<t>"    cover title when it should differ from --hook (≤ 60 chars)\n` +
      `  --progress / --no-progress   thin progress bar (default: the style's)\n` +
      `  --font <name>          caption font override\n` +
      `  --out <file>           default <input>.short.mp4`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--transcript", "--from", "--to", "--crop", "--edl", "--style", "--punch", "--theme", "--hook", "--credit", "--font", "--out",
  "--remove-words", "--keep-words", "--music", "--music-lufs", "--sfx-volume", "--cover-title"]);
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
let punch = Math.max(0, Math.min(0.3, Number(flag("--punch", String(style.punch)))));
const progress = argv.includes("--progress") ? true : argv.includes("--no-progress") ? false : style.progress;
const W = 1080, H = 1920;
// The speaker's corner box on a `pip` card: top-right, clear of the caption band at the bottom.
const PIP = { w: 252, h: 448, border: 7, margin: 32, top: 56 };

const probeDur = async (f) =>
  Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])).trim());

// A voice recording, or a video file with no picture: the cards become the picture.
const audioOnly = /\.(wav|mp3|m4a|aac|flac|ogg|opus)$/i.test(input) ||
  !(await run("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=codec_type", "-of", "csv=p=0", input])).trim();

// ── the edit decision list ───────────────────────────────────────────────────
let edl;
if (flag("--edl")) {
  edl = JSON.parse(fs.readFileSync(flag("--edl"), "utf8"));
} else {
  const from = Number(flag("--from", "0"));
  const to = flag("--to") === null ? await probeDur(input) : Number(flag("--to"));
  edl = { segments: [{ from, to, crop: flag("--crop") }], broll: [] };
}
// the transcript, read once: anchors, word cuts and captions all come from it
const srcWords = flag("--transcript") ? wordsFromTranscript(JSON.parse(fs.readFileSync(flag("--transcript"), "utf8"))) : null;
const hasWordAnchor = [...(edl.cards ?? []), ...(edl.broll ?? []), ...(edl.behind ?? [])].some((c) => typeof c.at === "string");
if (hasWordAnchor) {
  if (!srcWords) die("the EDL anchors cards to spoken words — pass --transcript");
  const r = resolveAnchors(edl, srcWords);
  if (r.problems.length) die(r.problems.join("\n  "));
  edl = r.edl;
}
if (argv.includes("--cut-words") && !srcWords) die("--cut-words reads the words from --transcript");
if (flag("--music") && !fs.existsSync(flag("--music"))) die(`music not found: ${flag("--music")}`);
const coverTitle = flag("--cover-title", flag("--hook"));
if (argv.includes("--cover")) {
  const tp = titleProblems(coverTitle);
  if (tp.length) die(`--cover: ${tp.join("; ")} (it uses --cover-title, else --hook)`);
}
const templateIds = new Set(listTemplateIds());
const problems = [...validateEdl(edl, { audioOnly }),
  ...cardSlotProblems(edl.cards, (id) => (templateIds.has(id) ? declaredSlots(id, "9:16") : null), nearestSlot)];
const useFaces = argv.includes("--faces") && !audioOnly;
if (argv.includes("--faces") && audioOnly) console.warn("[talking-head] ⚠ --faces ignored: a voice-only input has no face");
if (audioOnly) console.log("[talking-head] voice-only input — the cards are the picture, on a flat --theme background");
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
// voice-only background: the theme's hue, very dark, so white captions and any card read on it
const voiceBg = theme ? toHex(hslToRgb(theme.hue, 0.35, 0.11)) : "#141414";
// punching in on a flat colour moves nothing but the captions' backdrop — off for voice-only
if (audioOnly) punch = 0;

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
    // a split card gets the top half (1080×960). Most portrait templates keep their content in
    // a band in the middle, so the band is found and cut out at full size; a 16:9 render
    // scaled to 1080 wide was tried first and its type was too small to read on a phone.
    cardFiles.push({ ...c, file: f, ...(c.layout === "split" ? { band: await contentBand(f, c.dur) } : {}) });
  }

  const segFiles = [];
  for (const [i, seg] of edl.segments.entries()) {
    const f = path.join(work, `seg${i}.mp4`);
    if (audioOnly) {
      // no picture: a flat background in the theme's own dark tone, the voice on top
      const len = String(seg.to - seg.from);
      await run("ffmpeg", ["-hide_banner", "-y", "-f", "lavfi", "-i", `color=c=${voiceBg.replace("#", "0x")}:s=${W}x${H}:r=30:d=${len}`,
        "-ss", String(seg.from), "-t", len, "-i", input, "-map", "0:v", "-map", "1:a", "-shortest",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "256k", f], { trimErr: 1200 });
      segFiles.push({ ...seg, file: f, dur: await probeDur(f) });
      continue;
    }
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

  // source second → assembled second (segments laid end to end)
  const segStart = segFiles.reduce((a, s, i) => [...a, i ? a[i - 1] + segFiles[i - 1].dur : 0], []);
  const joinedAt = (t) => { const i = edl.segments.findIndex((s) => t >= s.from && t < s.to); return i < 0 ? null : segStart[i] + (t - edl.segments[i].from); };

  // 1b. --faces: the head over time, on the assembled 1080×1920 timeline. Short windows (~2 s,
  //     never across a segment boundary): a take has shot changes and B-roll, and one union box
  //     over a whole segment grows to cover the frame. headBox refuses a window whose face was
  //     seen in < 1/3 of its frames — no box beats a wrong box.
  const faceWins = [];
  if (useFaces) {
    for (const [i, s] of segFiles.entries()) {
      const n = Math.max(1, Math.round(s.dur / 2));
      for (let k = 0; k < n; k++) faceWins.push({ from: segStart[i] + (s.dur * k) / n, to: segStart[i] + (s.dur * (k + 1)) / n });
    }
    const times = faceWins.flatMap((w) => sampleTimes(w.from, w.to, 4));
    const det = await detectFaces(joined, times);
    faceWins.forEach((w, k) => (w.head = headBox(det.frames.slice(k * 4, k * 4 + 4), { W, H })));
    console.log(`[talking-head] faces: head found in ${faceWins.filter((w) => w.head).length}/${faceWins.length} two-second windows`);
  }
  const headAt = (t) => (t === null ? null : faceWins.find((w) => t >= w.from && t < w.to)?.head ?? null);

  // 2. autocut on the assembled timeline (already 9:16 — no re-crop)
  const log = await stderrOf(["-hide_banner", "-nostats", "-i", joined, "-af", "silencedetect=noise=-35dB:d=0.28", "-vn", "-f", "null", "-"]);
  let keep = keepSegments(parseSilences(log), dur, { pad: 0.1, minKeep: 0.2 });
  // 2b. cut by what was SAID: fillers, repeats, retakes (source time → assembled time)
  if (argv.includes("--cut-words")) {
    const used = srcWords.filter((w) => edl.segments.some((s) => w.start >= s.from && w.end <= s.to));
    const drop = findSpeechCuts(used, { removeWords: flag("--remove-words", ""), keepWords: flag("--keep-words", "") });
    const spans = sourceToJoined(dropSpans(used, drop).map((s) => ({ w: "", ...s })), segFiles);
    keep = subtractSpans(keep, spans);
    console.log(`[talking-head] word cuts: ${drop.size} word(s) out (${[...new Set(drop.values())].join(", ") || "none"}) — review with speech-cuts.mjs`);
  }
  const sum = summary(keep, dur);
  console.log(`[talking-head] ${edl.segments.length} segment(s), ${(edl.broll ?? []).length} B-roll, ${(edl.cards ?? []).length} card(s) · ${sum.duration}s → ${sum.kept}s (${sum.cuts} cuts) · style ${flag("--style", "clean")}`);
  const cut = path.join(work, "cut.mp4");
  const filterFile = path.join(work, "filter.txt");
  fs.writeFileSync(filterFile, buildFilter(keep, { hasVideo: true, punch, vertical: false, loudnorm: true, width: W, height: H }));
  await run("ffmpeg", ["-hide_banner", "-y", "-i", joined, "-filter_complex_script", filterFile, "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", cut], { trimErr: 1200 });
  const cutDur = await probeDur(cut);
  // the head a split card's speaker half is framed on: where it is a second into the card
  const cardHead = (c) => headAt(joinedAt(Math.min(c.at + 1, c.at + c.dur / 2)));
  let placed = cardsOnCut(cardFiles, segFiles, (t) => remapTime(t, keep), cutDur).map((c) =>
    c.layout === "split" ? { ...c, fit: splitCardFit(c.band), speakerY: Number.isFinite(c.speakerY) ? c.speakerY : splitSpeakerY(cardHead(c)) } : c);
  if (!argv.includes("--no-card-sfx")) placed = withAutoSfx(placed);
  // the face windows on the cut timeline — where each head box applies after the silence cut
  const cutWindows = faceWins.map((w) => ({ start: remapTime(w.from, keep), end: remapTime(w.to, keep), head: w.head }));
  // A full-frame card already says in big type what the voice is saying: captions there would
  // sit on top of the card's own text. They stay on `pip` cards, or on any card with captions:true.
  const quiet = placed.filter((c) => (c.layout ?? "full") === "full" && c.captions !== true);

  // 3. captions from real timings: source time → assembled time → cut time
  const cap = { ...style.caption, ...(flag("--font") ? { font: flag("--font") } : {}) };
  if (cap.boxColour === "accent") cap.boxColour = accent;
  let ass, capWords = [];
  if (srcWords) {
    const words = sourceToJoined(applyWordFixes(srcWords, edl.fix ?? []), segFiles)
      // a word whose midpoint fell inside a removed pause was not spoken in the kept audio
      .filter((w) => keep.some((k) => (w.start + w.end) / 2 >= k.start && (w.start + w.end) / 2 <= k.end))
      .map((w) => ({ ...w, start: remapTime(w.start, keep), end: remapTime(w.end, keep) }))
      .filter((w) => !quiet.some((c) => (w.start + w.end) / 2 >= c.start && (w.start + w.end) / 2 < c.end));
    capWords = words;
    ass = toAssActiveWords(words, { width: W, height: H, accent, ...cap });
    console.log(`[talking-head] captions: ${words.length} words`);
  } else {
    ass = toAssActiveWords([], { width: W, height: H, accent, ...cap });
    console.log(`[talking-head] no --transcript — cut and framed, uncaptioned`);
  }

  // 3b. --faces: captions off the head. Windows are per segment; on a `split` card the speaker
  //     is shown shifted (their band moved to the bottom half), so the head moves with them.
  //     Card windows come first: the first window that holds an event decides.
  const styleOf = (name, text) => {
    const f = text.match(new RegExp(`^Style: ${name},([^\\n]*)$`, "m"))?.[1].split(",");
    return f ? { size: Number(f[1]), align: Number(f[17]), marginV: Number(f[20]) } : null;
  };
  const prefOf = (st, boxH) => (st.align === 8 ? { an: 8, marginV: st.marginV } : st.align === 5 ? { an: 8, marginV: Math.round((H - boxH) / 2) } : { an: 2, marginV: st.marginV });
  const facesUsed = { captionsMoved: 0, hookMoved: false };
  if (useFaces && srcWords) {
    const st = styleOf("Word", ass);
    const boxH = Math.round(st.size * 1.3);
    // on a split card the speaker's band is shown in the bottom half: shift the head with it,
    // and keep the captions in that half (safeTop) — never on the card above
    const windows = [
      ...placed.filter((c) => c.layout === "split").map((c) => {
        const h = cardHead(c);
        return { start: c.start, end: c.end, safeTop: 0.52, head: h ? { ...h, y: h.y - c.speakerY + H / 2 } : null };
      }),
      ...cutWindows,
    ];
    const slots = windows.map((w) => ({ ...w, slot: textSlot(w.head, { H, boxH, pref: prefOf(st, boxH), ...(w.safeTop ? { safeTop: w.safeTop } : {}) }) }));
    const r = moveAssEvents(ass, slots, { style: "Word" });
    ass = r.ass;
    facesUsed.captionsMoved = r.moved;
    console.log(`[talking-head] faces: ${r.moved} caption event(s) moved off the speaker's head`);
  }

  // 4–5. hook + credit as extra ASS events (one libass pass burns everything)
  const hook = hookStyle(style, { width: W, height: H, accent });
  const creditStyle = `Style: Credit,Arial,${Math.round(H * 0.016)},&H33FFFFFF,&H33FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,3,6,0,1,40,40,${progress ? 52 : 40},1`;
  const extra = [];
  if (flag("--hook")) {
    let tag = hook.tag, mv = 0;
    const head = cutWindows.find((w) => w.head && w.start < 2.6)?.head ?? null;
    if (useFaces && head) {
      const st = styleOf("Hook", hook.style);
      // a hook wraps: estimate its lines from the text width (≈ 0.55 em per character)
      const lines = Math.max(1, Math.ceil((flag("--hook").length * st.size * 0.55) / (W - 140)));
      const boxH = Math.round(lines * st.size * 1.2);
      const slot = textSlot(head, { H, boxH, pref: prefOf(st, boxH) });
      if (slot) { tag = `{\\an${slot.an}}${tag}`; mv = slot.marginV; facesUsed.hookMoved = true; console.log(`[talking-head] faces: hook moved off the speaker's head`); }
    }
    extra.push(`Dialogue: 2,0:00:00.00,0:00:02.60,Hook,,0,0,${mv},,${tag}${escapeAss(hook.text(flag("--hook")))}`);
  }
  if (flag("--credit")) extra.push(`Dialogue: 1,0:00:00.00,9:59:59.00,Credit,,0,0,0,,${escapeAss(flag("--credit"))}`);
  ass = ass.replace("\n\n[Events]", `\n${hook.style}\n${creditStyle}\n\n[Events]`) + extra.join("\n") + (extra.length ? "\n" : "");
  const assFile = path.join(work, "captions.ass");
  fs.writeFileSync(assFile, ass);

  // grade BEFORE captions so the text is not graded/grained; progress bar last, on top
  // cards go over the GRADED picture but are not graded themselves (a film grain on a chart is
  // noise); a `pip` card re-shows the speaker from the same graded frame in a framed corner box.
  // "behind": text between the speaker and the wall. Drawn on the graded frame, then the person
  // (same graded frame through a mask) laid back over it — one grade, no alpha video.
  const behind = cardsOnCut(edl.behind ?? [], segFiles, (t) => remapTime(t, keep), cutDur);
  let maskFile = null;
  if (behind.length && flag("--hook") && behind.some((b) => b.start < 2.6))
    console.warn(`[talking-head] ⚠ behind text starts under the --hook title (first 2.6 s) — the hook will cover it; anchor it later`);
  if (behind.length) {
    maskFile = path.join(work, "mask.mp4");
    console.log(`[talking-head] behind: masking the speaker for ${behind.length} text(s) …`);
    const info = await personMatte(cut, maskFile);
    if (info.cover < 0.03) console.warn(`[talking-head] ⚠ behind: almost no person found — the text will simply sit on top`);
    if (info.cover > 0.6) console.warn(`[talking-head] ⚠ behind: the speaker fills ${Math.round(info.cover * 100)}% of the frame (a close-up) — most of the text will be hidden; it works best on a medium shot`);
    const longest = Math.max(...behind.map((b) => [...String(b.text)].length));
    // as big as fits: ≈ 0.62 em per bold capital, 92% of the width
    const size = Math.round(Math.min(H * 0.15, (W * 0.92) / (longest * 0.62)));
    const bAss = [
      "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`, "ScaledBorderAndShadow: yes", "",
      "[V4+ Styles]",
      "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
      `Style: Behind,${cap.font ?? "Arial"},${size},${assColour(accent)},${assColour(accent)},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,5,20,20,0,1`,
      "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
      ...behind.map((b) => {
        const head = cutWindows.find((w) => b.start >= w.start && b.start < w.end)?.head;
        // centred on the upper head when we know where it is: the head then cuts into the word
        const y = head ? Math.round(head.y + head.h * 0.35) : Math.round(H * 0.32);
        const tag = `{\\pos(${W / 2},${y})\\fad(150,200)\\fscx82\\fscy82\\t(0,260,\\fscx100\\fscy100)}`;
        return `Dialogue: 0,${assTime(b.start)},${assTime(b.end)},Behind,,0,0,0,,${tag}${escapeAss(String(b.text).toLocaleUpperCase("vi"))}`;
      }),
    ].join("\n") + "\n";
    fs.writeFileSync(path.join(work, "behind.ass"), bAss);
  }

  const spk = placed.filter((c) => c.layout === "pip" || c.layout === "split").length;
  const outs = ["[g0src]", ...Array.from({ length: spk }, (_, k) => `[spk${k}]`), ...(behind.length ? ["[fgsrc]"] : [])];
  const fc = [`[0:v]${style.grade ? style.grade + "," : "null,"}split=${outs.length}${outs.join("")}`];
  const maskIn = placed.length + 1;
  if (behind.length) {
    const on = behind.map((b) => `between(t,${b.start.toFixed(3)},${b.end.toFixed(3)})`).join("+");
    fc.push(`[g0src]subtitles='${escapeSubtitlePath(path.join(work, "behind.ass"))}'[btxt]`,
      `[${maskIn}:v]format=gray,scale=${W}:${H}[mk]`, `[fgsrc][mk]alphamerge[fg]`,
      `[btxt][fg]overlay=enable='${on}'[g0]`);
  } else fc.push(`[g0src]null[g0]`);
  let last = 0, pipK = 0;
  placed.forEach((c, j) => {
    const a = c.start.toFixed(3), e = c.end.toFixed(3);
    if (c.layout === "split") {
      // top half: the card's content band — cut out at full size, or scaled to fit over a
      // blurred copy of the card when it is taller than the half (lib/edl.mjs#splitCardFit);
      // bottom half: the speaker's band (speakerY) with a thin accent rule on the seam
      const k = pipK++;
      const tail = `format=yuva420p,fade=t=in:st=0:d=0.15:alpha=1,setpts=PTS-STARTPTS+${a}/TB[c${j}]`;
      if (c.fit.mode === "crop") fc.push(`[${j + 1}:v]${cover},crop=${W}:${H / 2}:0:${c.fit.y},${tail}`);
      else fc.push(
        `[${j + 1}:v]${cover},split[cs${j}][cb${j}]`,
        `[cb${j}]crop=${W}:${H / 2}:0:${(H - H / 2) / 2},boxblur=28:2[cbg${j}]`,
        `[cs${j}]crop=${W}:${c.fit.h}:0:${c.fit.y},scale=-2:${H / 2}[cfg${j}]`,
        `[cbg${j}][cfg${j}]overlay=(W-w)/2:0,${tail}`,
      );
      fc.push(
        `[g${last}][c${j}]overlay=x=0:y=0:enable='between(t,${a},${e})':eof_action=pass[g${last + 1}]`,
        `[spk${k}]crop=${W}:${H / 2}:0:${c.speakerY},drawbox=x=0:y=0:w=iw:h=6:color=${accent.replace("#", "0x")}:t=fill[p${k}]`,
        `[g${last + 1}][p${k}]overlay=x=0:y=${H / 2}:enable='between(t,${a},${e})'[g${last + 2}]`,
      );
      last += 2;
      return;
    }
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
  // 6. sound: a music bed ducked under the voice, and one sound per card that asks for it
  const audioIn = [], afc = [], mixIn = ["[vo]"];
  let nextIn = placed.length + 1 + (maskFile ? 1 : 0);
  const music = flag("--music");
  if (music) {
    const m = nextIn++;
    audioIn.push("-stream_loop", "-1", "-i", music);
    const D = cutDur.toFixed(3), lufs = Number(flag("--music-lufs", "-26"));
    afc.push(`[0:a]asplit=2[vo][sc]`,
      `[${m}:a]atrim=0:${D},asetpts=PTS-STARTPTS,loudnorm=I=${lufs}:TP=-3:LRA=11,aresample=48000,aformat=channel_layouts=stereo,` +
        `afade=t=in:d=1,afade=t=out:st=${Math.max(0, cutDur - 2.5).toFixed(3)}:d=2.5[mus]`,
      // the voice squeezes the bed: ratio 6, quick attack, slow release so it does not pump
      `[mus][sc]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=450[bed]`);
    mixIn.push("[bed]");
  } else afc.push(`[0:a]anull[vo]`);
  const sfxEvents = [];
  const autoMissing = new Set();
  for (const c of placed.filter((c) => c.sfx)) {
    const f = resolveSfx(c.sfx);
    if (!f) {
      if (c.sfxAuto) autoMissing.add(c.sfx);
      else console.warn(`[talking-head] ⚠ card sfx "${c.sfx}" not found under assets/sfx/ — run sfx-cc0.mjs; skipped`);
      continue;
    }
    // a whoosh leads into the cut; anything else lands with the card
    const lead = c.sfxOffset ?? (/transition|whoosh|zip/.test(c.sfx) ? -0.08 : 0);
    const t = Math.max(0, c.start + lead), k = nextIn++;
    audioIn.push("-i", f);
    const ms = Math.round(t * 1000), vol = Number(c.sfxVolume ?? flag("--sfx-volume", "0.5"));
    afc.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${vol},adelay=${ms}|${ms}[fx${sfxEvents.length}]`);
    mixIn.push(`[fx${sfxEvents.length}]`);
    sfxEvents.push({ t: +t.toFixed(3), label: c.sfx });
  }
  if (autoMissing.size) console.log(`[talking-head] card sounds off: ${[...autoMissing].join(", ")} not under assets/sfx/ (fetch: node scripts/video/sfx-cc0.mjs)`);
  for (const w of sfxDensity(sfxEvents, { duration: cutDur })) console.warn(`[talking-head] ⚠ sfx ${w}`);
  const mixed = mixIn.length > 1;
  if (mixed) afc.push(`${mixIn.join("")}amix=inputs=${mixIn.length}:duration=first:normalize=0,alimiter=limit=0.94[a]`);
  await run("ffmpeg", ["-hide_banner", "-y", "-i", cut, ...placed.flatMap((c) => ["-i", c.file]), ...(maskFile ? ["-i", maskFile] : []), ...audioIn,
    "-filter_complex", [...fc, ...(mixed ? afc : [])].join(";"), "-map", "[v]", "-map", mixed ? "[a]" : "0:a",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", ...(mixed ? ["-c:a", "aac", "-b:a", "192k"] : ["-c:a", "copy"]),
    "-movflags", "+faststart", out], { trimErr: 1200 });
  if (music) console.log(`[talking-head] music bed: ${path.basename(music)} at ${flag("--music-lufs", "-26")} LUFS, ducked under the voice`);

  fs.writeFileSync(
    out.replace(/\.mp4$/, "") + ".cuts.json",
    JSON.stringify({ input: path.basename(input), style: flag("--style", "clean"), punch, progress, cutWords: argv.includes("--cut-words"),
      music: music ? path.basename(music) : null, sfx: sfxEvents, voiceOnly: audioOnly,
      faces: useFaces ? { windows: faceWins, ...facesUsed } : null,
      splitCards: placed.filter((c) => c.layout === "split").map((c) => ({ templateId: c.templateId, start: c.start, speakerY: c.speakerY, band: c.band, fit: c.fit })),
      behind: behind.map((b) => ({ text: b.text, start: b.start, end: b.end })), edl, summary: sum, keep }, null, 2) + "\n",
  );
  console.log(`[talking-head] ✓ ${out}  (${cutDur.toFixed(1)}s)`);

  // 7. --cover: the frame comes from BEFORE the captions (cut.mp4, through the same grade), so
  //    the cover is a clean face + the title. A voice-only short has no face: its first card is
  //    the cover (captions are already off on full cards). Plus the caption-writing brief.
  if (argv.includes("--cover")) {
    const coverFile = out.replace(/\.mp4$/, "") + ".cover.jpg";
    const busy = placed.map((c) => ({ start: c.start, end: c.end }));
    let r;
    if (audioOnly) {
      const c0 = placed[0];
      r = await makeCover({ video: c0 ? out : cut, at: c0 ? c0.start + Math.min(2, (c0.end - c0.start) * 0.6) : 1, title: coverTitle, style, accent, out: coverFile });
    } else {
      const wins = cutWindows.map((w) => ({ t: (w.start + w.end) / 2, head: w.head }));
      const free = (t) => !busy.some((b) => t >= b.start && t < b.end);
      const t = pickCoverTime(wins, { duration: cutDur, avoid: busy }) ?? [1, 2, 3, 4, 5].find(free) ?? 1;
      r = await makeCover({ video: cut, at: t, title: coverTitle, style, accent, vf: style.grade || null,
        head: cutWindows.find((w) => t >= w.start && t < w.end)?.head ?? null, out: coverFile });
    }
    console.log(`[talking-head] cover → ${coverFile} (frame ${r.at.toFixed(2)}s${r.moved ? ", title moved off the face" : ""})`);
    if (capWords.length) {
      const md = out.replace(/\.mp4$/, "") + ".post.md";
      fs.writeFileSync(md, postDraft({ title: coverTitle, words: capWords, duration: cutDur, credit: flag("--credit") }));
      console.log(`[talking-head] post brief → ${md} — write the captions from it; nothing in it is ready to post`);
    }
  }
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

/**
 * The rows of a rendered card that hold its content, once the card has animated in.
 * Detail map = the frame minus a heavy blur of itself: text and edges survive, the template's
 * background (dark, light, gradient, glow) cancels out — so this works for any theme. cropdetect
 * then reports the band's top and bottom (its x range is unreliable on this map; unused).
 * → { y1, y2 } in 1920-px rows, or null.
 */
async function contentBand(file, dur) {
  const log = await stderrOf(["-hide_banner", "-ss", String(Math.max(0, dur * 0.6)), "-i", file, "-t", "0.5", "-filter_complex",
    "[0:v]format=gray,split[a][b];[b]gblur=sigma=30[bb];[a][bb]blend=all_mode=difference,format=yuv420p,cropdetect=limit=30:round=2:reset=0", "-f", "null", "-"]);
  const m = [...log.matchAll(/y1:(\d+) y2:(\d+)/g)].at(-1);
  if (!m) return null;
  const y1 = Number(m[1]), y2 = Number(m[2]);
  return y2 > y1 ? { y1, y2 } : null;
}

/** "transition/cc0-whoosh-reverse" → assets/sfx/transition/cc0-whoosh-reverse.mp3 (or any path that exists). */
function resolveSfx(name) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/sfx");
  for (const p of [name, path.join(root, name), ...[".mp3", ".wav", ".ogg"].map((e) => path.join(root, name + e))])
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  return null;
}
