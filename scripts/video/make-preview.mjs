#!/usr/bin/env node
// make-preview.mjs — a README-sized animated preview (WebP/GIF) and a web-sized copy of a video.
//
//   node scripts/video/make-preview.mjs <video.mp4> [--out preview.webp] [--mp4 small.mp4]
//          [--start 0] [--seconds 7] [--width 270] [--fps 12] [--mp4-width 540]
//
// GitHub plays no <video> inside a README, but it animates WebP and GIF images. So a sample
// ships as a short silent animation that links to the real MP4 (with sound).
//
// WebP is the default: measured on a 7-second niche sample, animated WebP at 270 px / 12 fps
// was 0.41 MB; a GIF at a SMALLER 200 px / 8 fps was 1.30 MB, and 2.44 MB at 240 px. The
// templates' ambient motion changes every pixel every frame, which is the worst case for GIF.
// `--out x.gif` still writes a GIF (per-clip palette, sierra dithering) where WebP is refused.
//
// ENV: none. Needs ffmpeg (with libwebp — every common build has it).
import fs from "node:fs";
import { run } from "./lib/proc.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `make-preview.mjs — README animation + web-sized MP4 from a rendered video\n` +
      `  <video>            source video\n` +
      `  --out <file>       .webp (default <video dir>/preview.webp) or .gif\n` +
      `  --mp4 <file>       write a smaller MP4 copy too (omit to skip)\n` +
      `  --start <s>        where the preview starts (default 0)\n` +
      `  --seconds <s>      preview length (default 7)\n` +
      `  --width <px>       preview width (default 270)\n` +
      `  --fps <n>          preview frame rate (default 12)\n` +
      `  --mp4-width <px>   MP4 copy width (default 540)`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--out", "--mp4", "--start", "--seconds", "--width", "--fps", "--mp4-width"]);
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const src = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
if (!src || !fs.existsSync(src)) {
  console.error(`[preview] ✗ not found: ${src}`);
  process.exit(1);
}
const out = flag("--out", src.replace(/[^/\\]+$/, "preview.webp"));
const w = Number(flag("--width", "270"));
const fps = Number(flag("--fps", "12"));
const clip = ["-hide_banner", "-y", "-ss", flag("--start", "0"), "-t", flag("--seconds", "7"), "-i", src, "-an"];
if (/\.gif$/i.test(out)) {
  const filters =
    `fps=${fps},scale=${w}:-2:flags=lanczos,split[a][b];` +
    `[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`;
  await run("ffmpeg", [...clip, "-filter_complex", filters, "-loop", "0", out]);
} else {
  await run("ffmpeg", [...clip, "-vf", `fps=${fps},scale=${w}:-2:flags=lanczos`, "-c:v", "libwebp", "-lossless", "0",
    "-q:v", "60", "-compression_level", "6", "-loop", "0", out]);
}
console.log(`[preview] ✓ ${out}  (${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`);

const mp4 = flag("--mp4", null);
if (mp4) {
  // Writing over the source is allowed: encode to a temp file, then swap it in.
  const tmp = `${mp4}.tmp.mp4`;
  await run("ffmpeg", ["-hide_banner", "-y", "-i", src, "-vf", `scale=${Number(flag("--mp4-width", "540"))}:-2:flags=lanczos`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", tmp]);
  fs.renameSync(tmp, mp4);
  console.log(`[preview] ✓ ${mp4}  (${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB)`);
}
