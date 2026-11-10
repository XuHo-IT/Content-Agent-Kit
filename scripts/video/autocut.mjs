#!/usr/bin/env node
// autocut.mjs — talking-head take → jump-cut reel. Silence removal, punch-ins, loudness.
//
//   node scripts/video/autocut.mjs take.mp4                        # → take.cut.mp4
//   node scripts/video/autocut.mjs take.mp4 --vertical --punch 0.12 # 9:16, zoom every other cut
//   node scripts/video/autocut.mjs take.mp4 --dry-run              # print the cut list only
//   node scripts/video/autocut.mjs voice.wav --out voice.tight.wav # audio-only works too
//
// The method (and its defaults) come from kurbaitaev/ghost-editor (MIT) — see
// scripts/video/lib/autocut.mjs for why each number is what it is. This is the ffmpeg-only
// part of that pipeline; captions over the result: render.mjs --captions, or the karaoke
// style in scripts/video/lib/captions.mjs.
//
// Writes <out>.cuts.json beside the output: the kept segments in source time, so a caption
// track or a b-roll plan made against the raw take can be remapped (remapTime) — and so a
// human can see exactly what was removed before trusting it.
//
// ENV: none. Needs ffmpeg + ffprobe on PATH.
import fs from "node:fs";
import path from "node:path";
import { run } from "./lib/proc.mjs";
import { parseSilences, keepSegments, summary, buildFilter } from "./lib/autocut.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `autocut.mjs — remove pauses from a talking-head take (ffmpeg only)\n` +
      `  <input>              video or audio file\n` +
      `  --out <file>         default <input>.cut.<ext>\n` +
      `  --noise <dB>         silence threshold (default -35)\n` +
      `  --min-silence <s>    shortest pause to cut (default 0.28)\n` +
      `  --pad <s>            pause kept on each side of a cut (default 0.10)\n` +
      `  --min-keep <s>       drop speech islands shorter than this (default 0.20)\n` +
      `  --punch <0..0.3>     zoom every other segment by this much (default 0 = off; 0.12 is typical)\n` +
      `  --vertical           crop/scale to 1080×1920 first\n` +
      `  --no-loudnorm        skip -16 LUFS levelling\n` +
      `  --dry-run            print the cut list, write nothing`,
  );
  process.exit(argv.length ? 0 : 1);
}
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const VALUE_FLAGS = new Set(["--out", "--noise", "--min-silence", "--pad", "--min-keep", "--punch"]);
const input = argv.find((a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(argv[i - 1]));
if (!input || !fs.existsSync(input)) {
  console.error(`[autocut] ✗ input not found: ${input}`);
  process.exit(1);
}

const noise = Number(flag("--noise", "-35"));
const minSilence = Number(flag("--min-silence", "0.28"));
const pad = Number(flag("--pad", "0.10"));
const minKeep = Number(flag("--min-keep", "0.20"));
const punch = Math.max(0, Math.min(0.3, Number(flag("--punch", "0"))));
const vertical = argv.includes("--vertical");
const loudnorm = !argv.includes("--no-loudnorm");

const probe = JSON.parse(
  await run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", input]),
);
const duration = Number(probe.format?.duration);
const hasVideo = (probe.streams ?? []).some((s) => s.codec_type === "video");
const vstream = (probe.streams ?? []).find((s) => s.codec_type === "video");
const hasAudio = (probe.streams ?? []).some((s) => s.codec_type === "audio");
if (!hasAudio) {
  console.error("[autocut] ✗ no audio stream — nothing to detect silence in");
  process.exit(1);
}

// silencedetect reports on stderr, and proc.run() only resolves stdout — spawn directly.
const { spawn } = await import("node:child_process");
const stderr = await new Promise((resolve, reject) => {
  const p = spawn("ffmpeg", ["-hide_banner", "-nostats", "-i", input, "-af", `silencedetect=noise=${noise}dB:d=${minSilence}`, "-vn", "-f", "null", "-"]);
  let err = "";
  p.stderr.on("data", (d) => (err += d));
  p.on("close", (c) => (c === 0 ? resolve(err) : reject(new Error(err.slice(-600)))));
  p.on("error", reject);
});

const silences = parseSilences(stderr);
const keep = keepSegments(silences, duration, { pad, minKeep, minSilence });
const sum = summary(keep, duration);
console.log(
  `[autocut] ${sum.duration}s → ${sum.kept}s  (−${sum.removed}s, ${sum.cuts} cut${sum.cuts === 1 ? "" : "s"}, ${Math.round(sum.ratio * 100)}% kept)`,
);
if (sum.ratio < 0.4) {
  console.warn(`[autocut] ⚠ more than 60% removed — the threshold may be too high for this room; try --noise -42`);
}

const ext = path.extname(input);
const out = flag("--out", input.slice(0, -ext.length) + ".cut" + ext);
if (argv.includes("--dry-run")) {
  console.log(JSON.stringify({ input, settings: { noise, minSilence, pad, minKeep, punch, vertical, loudnorm }, summary: sum, keep }, null, 2));
  process.exit(0);
}
if (!keep.length) {
  console.error("[autocut] ✗ everything was silence — check --noise");
  process.exit(1);
}

const frame = vertical ? { width: 1080, height: 1920 } : { width: vstream?.width ?? 1080, height: vstream?.height ?? 1920 };
const filter = buildFilter(keep, { hasVideo, punch, vertical, loudnorm, ...frame });
const filterFile = `${out}.filter.txt`;
fs.writeFileSync(filterFile, filter); // long graphs overflow the Windows command line
const args = ["-hide_banner", "-y", "-i", input, "-filter_complex_script", filterFile];
if (hasVideo) args.push("-map", "[vout]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p");
args.push("-map", "[aout]");
if (/\.(mp4|mov|m4a)$/i.test(out)) args.push("-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart");
args.push(out);
try {
  await run("ffmpeg", args, { trimErr: 1200 });
} finally {
  fs.rmSync(filterFile, { force: true });
}
fs.writeFileSync(`${out}.cuts.json`, JSON.stringify({ input, settings: { noise, minSilence, pad, minKeep, punch, vertical, loudnorm }, summary: sum, keep }, null, 2) + "\n");
console.log(`[autocut] ✓ ${out}`);
console.log(`[autocut]   cut list: ${out}.cuts.json`);
