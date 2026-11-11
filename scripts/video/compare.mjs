#!/usr/bin/env node
// compare.mjs — a before/after video: the raw take and the edit, side by side, playing together.
//
//   node scripts/video/compare.mjs raw.mp4 short.mp4 --out so-sanh.mp4
//   node scripts/video/compare.mjs raw.mp4 short.mp4 --title "Agent tự cắt trong 3 phút" --audio raw
//
// What it is for: showing the edit — a post about how a video was made, a client asking what
// the money bought, a tutorial. Both play from 0 at once; the shorter one holds its last
// frame, so the viewer SEES how much was cut. Each pane carries its label and its real
// measured length ("BẢN GỐC 1:42" / "ĐÃ DỰNG 0:58"), and the gap is the headline.
//
// Idea from Hải Đăng's before-after-compare skill (no licence — idea only, written fresh).
// Sound: the edit's by default (two voices at once is noise); --audio raw for the raw one.
// ENV: none. Needs ffmpeg.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "./lib/proc.mjs";
import { escapeAss, escapeSubtitlePath, assColour } from "./lib/captions.mjs";

export const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** The headline: how much shorter, in words a viewer reads in one glance. */
export function savedLine(rawSec, editSec) {
  const cut = rawSec - editSec;
  if (cut <= 0.5) return "Cùng độ dài — chỉ dựng lại, không cắt";
  return `Bớt ${mmss(cut)} (${Math.round((cut / rawSec) * 100)}%)`;
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `compare.mjs — before/after: raw take and edit side by side (9:16)\n` +
        `  <raw> <edited>       two videos\n` +
        `  --title "<text>"     headline above the panes (default: how much was cut)\n` +
        `  --labels "A|B"       pane labels (default "BẢN GỐC|ĐÃ DỰNG")\n` +
        `  --audio edited|raw   whose sound plays (default edited)\n` +
        `  --accent <#hex>      label colour (default #ffcc00)\n` +
        `  --out <file>         default <edited>.compare.mp4`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const VALUE = new Set(["--title", "--labels", "--audio", "--accent", "--out"]);
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const files = argv.filter((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
  const die = (m) => { console.error(`[compare] ✗ ${m}`); process.exit(1); };
  if (files.length !== 2) die("give two videos: <raw> <edited>");
  for (const f of files) if (!fs.existsSync(f)) die(`not found: ${f}`);
  const [raw, edited] = files;
  const out = flag("--out", edited.replace(/\.[^.]+$/, "") + ".compare.mp4");
  const [la, lb] = String(flag("--labels", "BẢN GỐC|ĐÃ DỰNG")).split("|");
  const accent = flag("--accent", "#ffcc00");
  const useRawAudio = flag("--audio", "edited") === "raw";

  const dur = async (f) => Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])).trim());
  const dRaw = await dur(raw), dEd = await dur(edited);
  const total = Math.max(dRaw, dEd);
  const W = 1080, H = 1920, PW = 540, PH = 960, TOP = 420;
  const title = flag("--title", savedLine(dRaw, dEd));

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "cak-compare-"));
  try {
    const ink = assColour(accent);
    const ass = [
      "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`, "ScaledBorderAndShadow: yes", "",
      "[V4+ Styles]",
      "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
      `Style: Title,Arial,74,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,8,60,60,150,1`,
      `Style: Label,Arial,40,${ink},${ink},&H00000000,&HC0000000,-1,0,0,0,100,100,2,0,3,10,0,8,0,0,0,1`,
      `Style: Len,Arial,58,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1`,
      "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
      `Dialogue: 0,0:00:00.00,9:00:00.00,Title,,0,0,0,,${escapeAss(title)}`,
      `Dialogue: 0,0:00:00.00,9:00:00.00,Label,,0,0,0,,{\\pos(${PW / 2},${TOP + 24})}${escapeAss(la)}`,
      `Dialogue: 0,0:00:00.00,9:00:00.00,Label,,0,0,0,,{\\pos(${PW + PW / 2},${TOP + 24})}${escapeAss(lb)}`,
      `Dialogue: 0,0:00:00.00,9:00:00.00,Len,,0,0,0,,{\\pos(${PW / 2},${TOP + PH + 110})}${mmss(dRaw)}`,
      `Dialogue: 0,0:00:00.00,9:00:00.00,Len,,0,0,0,,{\\pos(${PW + PW / 2},${TOP + PH + 110})}${mmss(dEd)}`,
      "",
    ].join("\n");
    const assFile = path.join(work, "compare.ass");
    fs.writeFileSync(assFile, ass);
    const pane = (i, d) =>
      `[${i}:v]scale=${PW}:${PH}:force_original_aspect_ratio=decrease,pad=${PW}:${PH}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,` +
      // the shorter clip holds its last frame, dimmed, so the empty time is visible as such
      `tpad=stop_mode=clone:stop_duration=${(total - d + 0.1).toFixed(2)}[p${i}]`;
    const fc = [
      `color=c=0x111111:s=${W}x${H}:r=30:d=${total.toFixed(3)}[bg]`,
      pane(0, dRaw), pane(1, dEd),
      `[bg][p0]overlay=0:${TOP}[a]`, `[a][p1]overlay=${PW}:${TOP}[b]`,
      // a dark veil over a pane once its clip has ended
      `[b]drawbox=x=0:y=${TOP}:w=${PW}:h=${PH}:color=black@0.55:t=fill:enable='gt(t,${dRaw.toFixed(2)})',` +
        `drawbox=x=${PW}:y=${TOP}:w=${PW}:h=${PH}:color=black@0.55:t=fill:enable='gt(t,${dEd.toFixed(2)})',` +
        `drawbox=x=${PW - 2}:y=${TOP}:w=4:h=${PH}:color=white@0.9:t=fill,subtitles='${escapeSubtitlePath(assFile)}'[v]`,
      `[${useRawAudio ? 0 : 1}:a]apad=whole_dur=${total.toFixed(3)}[au]`,
    ];
    await run("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", raw, "-i", edited, "-filter_complex", fc.join(";"),
      "-map", "[v]", "-map", "[au]", "-t", total.toFixed(3), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], { trimErr: 1200 });
    console.log(`[compare] ✓ ${out} — ${mmss(dRaw)} → ${mmss(dEd)} · ${title}`);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
