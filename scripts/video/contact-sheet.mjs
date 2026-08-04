// contact-sheet.mjs — one frame per scene, in a labelled grid, so a video can be reviewed
// by looking at it instead of scrubbing it.
//
//   node scripts/video/contact-sheet.mjs brain/<slug>/video.mp4
//   node scripts/video/contact-sheet.mjs <video.mp4> --per-row 5 --width 260 --out review.png
//
// WHY THIS EXISTS. Three real defects shipped into a finished video and none was caught by
// the validator, because none is expressible as a rule: B-roll showing a coffee cup under a
// line about an export ban; a headline rendered twice because `title`+`accent` concatenate;
// a comparison headline repeating both card labels. All three were obvious in one glance at
// the frames. This turns that glance into one command.
//
// Scene timings come from the `voice/scene-<id>.json` fingerprints the render already
// wrote — the same durations it used to cut the video, so the frames land where intended
// rather than at guessed offsets.
//
// ENV: none. Needs ffmpeg + ffprobe.
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
// The tiling, labelling and font detection live in lib/sheet.mjs so template-sheet.mjs
// uses the same code rather than a second copy of the same three ffmpeg traps.
import { findFont, labelledTile, grid } from "./lib/sheet.mjs";

const SCENE_GAP_SEC = 0.3; // must match render.mjs

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `contact-sheet.mjs — one frame per scene in a labelled grid\n` +
      `  <video.mp4>      the rendered video (script.json must sit beside it)\n` +
      `  --script <file>  override the script path\n` +
      `  --per-row <n>    columns (default 5)\n` +
      `  --width <n>      thumbnail width in px (default 240)\n` +
      `  --out <file>     output png (default <video-dir>/contact-sheet.png)\n` +
      `env: none (needs ffmpeg + ffprobe)`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

try {
  const video = path.resolve(argv.find((a) => /\.(mp4|mov|webm|mkv)$/i.test(a) && !a.startsWith("--")) ?? "");
  if (!video || !fs.existsSync(video)) throw new Error("Pass the path to a rendered video.mp4");
  const dir = path.dirname(video);

  const scriptPath = path.resolve(flag("--script") ?? path.join(dir, "script.json"));
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`No script.json beside the video (looked at ${scriptPath}). Pass --script.`);
  }
  const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
  const scenes = script.scenes ?? [];
  if (scenes.length === 0) throw new Error("script.json has no scenes");

  const perRow = Number(flag("--per-row", "5"));
  const thumbW = Number(flag("--width", "240"));
  const out = path.resolve(flag("--out") ?? path.join(dir, "contact-sheet.png"));

  // Rebuild the timeline exactly the way render.mjs laid it out.
  const marks = [];
  let cursor = 0;
  for (const scene of scenes) {
    const side = path.join(dir, "voice", `scene-${scene.id}.json`);
    if (!fs.existsSync(side)) {
      throw new Error(
        `Missing ${path.relative(dir, side)} — the fingerprints the render writes are how ` +
          `scene timings are known. Re-render, or pass --script for a different output dir.`,
      );
    }
    const dur = JSON.parse(fs.readFileSync(side, "utf8")).durationSec;
    if (typeof dur !== "number") throw new Error(`No durationSec in ${side}`);
    // Sample mid-scene: the start is mid-animation, the end may already be a held frame.
    marks.push({ id: scene.id, template: scene.templateId, at: cursor + dur / 2, media: !!scene.media });
    cursor += dur + SCENE_GAP_SEC;
  }

  const tmp = await mkdtemp(path.join(tmpdir(), "cak-sheet-"));
  try {
    // A label under each thumbnail is what makes the sheet actionable — without it you can
    // see something is wrong but not which scene to fix. drawtext errors outright when it
    // has no font, so fall back to unlabelled tiles rather than failing the whole run.
    const font = findFont();
    let labels = !!font;
    const tiles = [];
    for (const [i, m] of marks.entries()) {
      const tile = path.join(tmp, `t${String(i).padStart(2, "0")}.png`);
      const drawn = await labelledTile({
        input: video,
        atSec: m.at,
        out: tile,
        width: thumbW,
        label: `${i + 1}. ${m.id}${m.media ? " *" : ""}`,
        font,
      });
      if (!drawn) labels = false;
      tiles.push(tile);
    }

    await grid(tiles, { perRow, out, tmpDir: tmp });

    console.log(`[video] ✓ contact sheet — ${marks.length} scenes, ${perRow} per row`);
    console.log(`[video]   ${out}`);
    if (!labels) {
      console.log(`[video] ! no usable font for labels — scenes in order:`);
      console.log(`[video]   ${marks.map((m, i) => `${i + 1}.${m.id}`).join("  ")}`);
    }
    const withMedia = marks.filter((m) => m.media);
    if (withMedia.length) {
      console.log(`[video]   * = has media: ${withMedia.map((m) => m.id).join(", ")}`);
      console.log(`[video]   Look at those first — off-topic B-roll is the defect no rule can catch.`);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
} catch (e) {
  console.error(`[video] ✗ ${e.message}`);
  process.exit(1);
}
