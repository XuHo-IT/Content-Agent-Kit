#!/usr/bin/env node
// make-preview.mjs — a README-sized animated preview (WebP/GIF) and a web-sized copy of a video.
//
//   node scripts/video/make-preview.mjs <video.mp4> [--out preview.webp] [--mp4 small.mp4]
//          [--start 0] [--seconds 7] [--width 270] [--fps 12] [--mp4-width 540]
//   node scripts/video/make-preview.mjs <video.mp4> --highlights 6 [--clip 1.4] [--columns 3]
//   node scripts/video/make-preview.mjs a.mp4 b.mp4 c.mp4 --highlights 5 --out reel.webp
//
// GitHub plays no <video> inside a README, but it animates WebP and GIF images. So a sample
// ships as a short silent animation that links to the real MP4 (with sound).
//
// --highlights N: instead of the first seconds, N short windows spread over the WHOLE video,
// each the most animated moment of its stretch (scripts/video/lib/highlights.mjs), joined with
// a short cross-fade. A preview cut from 0–7 s shows the hook only; this shows the range.
// --columns K plays K highlight sequences side by side (one wide image); several input videos
// put one video per column — a showreel.
//
// WebP is the default: measured on a 7-second niche sample, animated WebP at 270 px / 12 fps
// was 0.41 MB; a GIF at a SMALLER 200 px / 8 fps was 1.30 MB, and 2.44 MB at 240 px. The
// templates' ambient motion changes every pixel every frame, which is the worst case for GIF.
// `--out x.gif` still writes a GIF (per-clip palette, sierra dithering) where WebP is refused.
//
// ENV: none. Needs ffmpeg (with libwebp — every common build has it).
import fs from "node:fs";
import { run } from "./lib/proc.mjs";
import { parseMotion, pickWindows, withDetail } from "./lib/highlights.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `make-preview.mjs — README animation + web-sized MP4 from a rendered video\n` +
      `  <video> [more…]    source video(s); several = one column each (needs --highlights)\n` +
      `  --out <file>       .webp (default <video dir>/preview.webp) or .gif\n` +
      `  --mp4 <file>       write a smaller MP4 copy too (omit to skip; single input only)\n` +
      `  --start <s>        where the preview starts (default 0)\n` +
      `  --seconds <s>      preview length (default 7)\n` +
      `  --highlights <n>   n most-animated windows spread over the whole video, instead of --start/--seconds\n` +
      `  --clip <s>         length of each highlight window (default 1.4)\n` +
      `  --fade <s>         cross-fade between highlight windows (default 0.2, 0 = hard cut)\n` +
      `  --columns <k>      play k highlight sequences side by side (one input split k ways)\n` +
      `  --width <px>       width of ONE column (default 270)\n` +
      `  --gap <px>         gap between columns (default 8)\n` +
      `  --bg <hex>         gap colour (default 0d1117, GitHub dark)\n` +
      `  --fps <n>          preview frame rate (default 12)\n` +
      `  --quality <0-100>  WebP quality (default 60)\n` +
      `  --mp4-width <px>   MP4 copy width (default 540)\n` +
      `  --dry-run          print the chosen windows, write nothing`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--out", "--mp4", "--start", "--seconds", "--width", "--fps", "--mp4-width",
  "--highlights", "--clip", "--fade", "--columns", "--gap", "--bg", "--quality"]);
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const inputs = argv.filter((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
for (const f of inputs) {
  if (!fs.existsSync(f)) {
    console.error(`[preview] ✗ not found: ${f}`);
    process.exit(1);
  }
}
if (!inputs.length) {
  console.error("[preview] ✗ no input video");
  process.exit(1);
}
const src = inputs[0];
const out = flag("--out", src.replace(/[^/\\]+$/, "preview.webp"));
const w = Number(flag("--width", "270"));
const fps = Number(flag("--fps", "12"));
const quality = flag("--quality", "60");
const nHi = Number(flag("--highlights", "0"));
const dry = argv.includes("--dry-run");
if (inputs.length > 1 && !nHi) {
  console.error("[preview] ✗ several inputs need --highlights (one column per video)");
  process.exit(1);
}

const isGif = /\.gif$/i.test(out);
const gifTail = `split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`;
const webpArgs = ["-c:v", "libwebp", "-lossless", "0", "-q:v", quality, "-compression_level", "6", "-loop", "0"];

async function probeDuration(f) {
  const s = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]);
  return Number(s.trim());
}

async function motion(f) {
  // ffmpeg writes `metadata=print` to the file given; "-" is stdout. Two passes: frame-to-frame
  // difference (motion) and edge density (detail — is there anything on screen?).
  const pass = (vf) => run("ffmpeg", ["-hide_banner", "-nostats", "-i", f, "-an", "-vf",
    `${vf},signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-`, "-f", "null", "-"]).then(parseMotion);
  const [mv, dt] = await Promise.all([
    pass("fps=8,scale=96:-2,format=gray,tblend=all_mode=difference"),
    pass("fps=8,scale=160:-2,format=gray,edgedetect=low=0.1:high=0.3"),
  ]);
  return withDetail(mv, dt);
}

if (!nHi) {
  const clip = ["-hide_banner", "-y", "-ss", flag("--start", "0"), "-t", flag("--seconds", "7"), "-i", src, "-an"];
  if (!dry) {
    if (isGif) await run("ffmpeg", [...clip, "-filter_complex", `fps=${fps},scale=${w}:-2:flags=lanczos,${gifTail}`, "-loop", "0", out]);
    else await run("ffmpeg", [...clip, "-vf", `fps=${fps},scale=${w}:-2:flags=lanczos`, ...webpArgs, out]);
    console.log(`[preview] ✓ ${out}  (${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`);
  }
} else {
  const len = Number(flag("--clip", "1.4"));
  const fade = Math.max(0, Math.min(Number(flag("--fade", "0.2")), len / 3));
  const cols = inputs.length > 1 ? inputs.length : Math.max(1, Number(flag("--columns", "1")));
  const gap = Number(flag("--gap", "8"));
  const bg = flag("--bg", "0d1117");

  // Windows per column. One input split k ways: pick k×n windows over the whole video and deal
  // them out (see below). Several inputs: each column picks from its own video.
  const columns = [];
  if (inputs.length > 1) {
    for (const f of inputs) {
      const d = await probeDuration(f);
      columns.push({ file: f, wins: pickWindows(await motion(f), { duration: d, count: nHi, len }) });
    }
    const n = Math.min(...columns.map((c) => c.wins.length));
    for (const c of columns) c.wins = c.wins.slice(0, n);
  } else {
    const d = await probeDuration(src);
    const all = pickWindows(await motion(src), { duration: d, count: nHi * cols, len });
    // Dealt round-robin, not in blocks: blocks would play neighbouring moments side by side,
    // which in a talking-head edit means the same speaker three times at once.
    const per = Math.floor(all.length / cols);
    for (let k = 0; k < cols; k++) columns.push({ file: src, wins: all.filter((_, i) => i % cols === k).slice(0, per) });
  }
  for (const c of columns) {
    console.log(`[preview] ${c.file}: ${c.wins.map((x) => `${x.start.toFixed(1)}s${x.clean ? "" : "*"}`).join("  ")}`);
  }
  if (!dry) {
    const ins = [];
    const fc = [];
    const fileIdx = new Map();
    for (const c of columns) if (!fileIdx.has(c.file)) { fileIdx.set(c.file, ins.length / 2); ins.push("-i", c.file); }
    columns.forEach((c, k) => {
      const i = fileIdx.get(c.file);
      const labels = c.wins.map((win, j) => {
        const l = `c${k}w${j}`;
        fc.push(`[${i}:v]trim=start=${win.start}:duration=${len},setpts=PTS-STARTPTS,fps=${fps},scale=${w}:-2:flags=lanczos,setsar=1,format=yuv420p[${l}]`);
        return l;
      });
      let cur = labels[0];
      for (let j = 1; j < labels.length; j++) {
        const nx = `c${k}x${j}`;
        if (fade > 0) fc.push(`[${cur}][${labels[j]}]xfade=transition=fade:duration=${fade}:offset=${(j * (len - fade)).toFixed(3)}[${nx}]`);
        else fc.push(`[${cur}][${labels[j]}]concat=n=2:v=1:a=0[${nx}]`);
        cur = nx;
      }
      fc.push(`[${cur}]null[col${k}]`);
    });
    let last = "col0";
    if (cols > 1) {
      // A gap between columns: pad every column but the last on its right, then stack.
      const padded = columns.map((_, k) => {
        if (k === cols - 1 || gap <= 0) return `col${k}`;
        fc.push(`[col${k}]pad=iw+${gap}:ih:0:0:color=0x${bg}[pc${k}]`);
        return `pc${k}`;
      });
      fc.push(`${padded.map((p) => `[${p}]`).join("")}hstack=inputs=${cols}[stack]`);
      last = "stack";
    }
    if (isGif) fc.push(`[${last}]${gifTail}[final]`);
    else fc.push(`[${last}]null[final]`);
    await run("ffmpeg", ["-hide_banner", "-y", ...ins, "-filter_complex", fc.join(";"), "-map", "[final]", "-an",
      ...(isGif ? ["-loop", "0"] : webpArgs), out]);
    console.log(`[preview] ✓ ${out}  (${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`);
  }
}

const mp4 = flag("--mp4", null);
if (mp4 && !dry) {
  if (inputs.length > 1) {
    console.error("[preview] --mp4 takes one input; skipped");
    process.exit(0);
  }
  // Writing over the source is allowed: encode to a temp file, then swap it in.
  const tmp = `${mp4}.tmp.mp4`;
  await run("ffmpeg", ["-hide_banner", "-y", "-i", src, "-vf", `scale=${Number(flag("--mp4-width", "540"))}:-2:flags=lanczos`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", tmp]);
  fs.renameSync(tmp, mp4);
  console.log(`[preview] ✓ ${mp4}  (${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB)`);
}
