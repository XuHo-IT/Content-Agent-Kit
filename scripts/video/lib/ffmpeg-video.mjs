// ffmpeg-video.mjs — fit each clip to its narration, concatenate, mux audio.
// Ported from AI-auto-generate-video/src/render/video-tools.ts (MIT — see NOTICE.md).
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { run } from "./proc.mjs";
import { getDurationSec } from "./ffmpeg-audio.mjs";
import { escapeSubtitlePath } from "./captions.mjs";

/** Uniform encode flags so every fitted clip can be concatenated by stream copy. */
const ENCODE = (fps) => [
  "-an",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "18",
  "-pix_fmt", "yuv420p",
  "-r", String(fps),
];

/**
 * Re-encode `inPath` to exactly `targetSec` seconds of video.
 *
 * Every vendored template is authored at a fixed 5s (`data-duration="5"`), but a
 * scene's narration is whatever the TTS produced. Longer target → freeze the last
 * frame (`tpad=stop_mode=clone`) so the poster holds while narration continues;
 * shorter → trim.
 */
export async function fitClipToDuration(inPath, targetSec, outPath, fps = 30, log = null) {
  const inDur = await getDurationSec(inPath);
  const target = Math.max(0.1, targetSec);
  const args = ["-y", "-i", inPath];
  if (target > inDur + 0.02) {
    const ext = target - inDur;
    // Freezing is now the fallback, not the norm — render.mjs asks the composition to run the
    // scene's real length. When this branch still fires, the frame stands still for `ext`
    // seconds and NOTHING else reports it: ffprobe sees a valid clip of the right duration.
    // Silence here is what let every episode ship with several motionless seconds per scene.
    if (ext > 0.5) {
      (log ?? ((m) => console.warn(`[video] ! ${m}`)))(
        `${inPath.split(/[\\/]/).pop()}: composition is ${inDur.toFixed(1)}s but the scene needs ` +
          `${target.toFixed(1)}s — holding the last frame for ${ext.toFixed(1)}s`,
      );
    }
    args.push("-vf", `tpad=stop_mode=clone:stop_duration=${ext.toFixed(3)}`);
  }
  args.push("-t", target.toFixed(3), ...ENCODE(fps), outPath);
  await run("ffmpeg", args);
}

/** Concatenate uniformly-encoded clips into one silent video (stream copy). */
export async function concatVideos(clipPaths, outPath) {
  if (clipPaths.length === 0) throw new Error("concatVideos: empty clipPaths");
  const tmp = await mkdtemp(join(tmpdir(), "cak-vconcat-"));
  try {
    const listFile = join(tmp, "list.txt");
    // Absolute paths: the concat demuxer resolves `file '...'` relative to the
    // LIST FILE's directory (the temp dir), not the process cwd.
    const body = clipPaths
      .map((p) => `file '${resolve(p).replace(/'/g, "'\\''")}'`)
      .join("\n");
    await writeFile(listFile, body, "utf8");
    await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath]);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

/**
 * Scene transitions, mapped onto ffmpeg's own `xfade` filter.
 *
 * Nothing here is hand-written: ffmpeg ships every one of them. The map exists so
 * `script.json` can say "swipe" rather than "wipeleft" — a name an author picks
 * without first reading ffmpeg's filter documentation.
 */
export const TRANSITIONS = {
  none: null,
  fade: "fade",
  swipe: "wipeleft",
  slide: "slideup",
  iris: "circleopen",
  pixelize: "pixelize",
  // Punch into the next scene. For the beat where something is FOUND — a radar lock, a map
  // arriving on its target — where a fade says "and then" but the picture should say "there".
  // Note what it is not: xfade acts on the JOIN, so this pushes the incoming scene toward the
  // viewer. It is not a camera move on the outgoing one, and the pipeline has no concept of
  // an effect a scene leaves on.
  zoom: "zoomin",
};

/** Under the 0.3s of inter-scene silence the audio already leaves for it. */
export const DEFAULT_TRANSITION_SEC = 0.25;

/**
 * Work out padded clip durations and xfade offsets for a transition chain.
 *
 * The trap: `xfade` OVERLAPS its two inputs, so a naive chain of n clips comes out
 * `sum(T)` shorter than the sum of its parts — while the narration, built
 * separately from the voice durations, does not shrink with it. Every line after
 * the first scene would land progressively early.
 *
 * The fix is arithmetic, not fudge: pad each clip by exactly the transition that
 * follows it, then let the overlap eat that padding back.
 *
 *     sum(padded) - sum(T) === sum(base)
 *
 * so the finished video is the length it was with hard cuts, and every word still
 * starts on the frame it used to.
 *
 * @param {number[]} base  each scene's visual duration, as if there were no transitions
 * @param {number[]} secs  transition AFTER each clip; length n-1; 0 means a hard cut
 * @returns {{padded: number[], offsets: (number|null)[], totalSec: number}}
 */
export function transitionPlan(base, secs) {
  const n = base.length;
  if (n === 0) throw new Error("transitionPlan: empty durations");
  if (secs.length !== n - 1) {
    throw new Error(`transitionPlan: expected ${n - 1} transitions for ${n} clips, got ${secs.length}`);
  }
  for (let i = 0; i < secs.length; i++) {
    if (!(secs[i] >= 0)) throw new Error(`transitionPlan: transition ${i} is not a duration: ${secs[i]}`);
    // An overlap longer than a neighbouring clip would swallow a whole scene.
    const room = Math.min(base[i], base[i + 1]);
    if (secs[i] >= room) {
      throw new Error(
        `transitionPlan: transition ${i} is ${secs[i]}s but the shorter neighbouring scene is only ${room}s`,
      );
    }
  }

  const padded = base.map((d, i) => (i < n - 1 ? d + secs[i] : d));
  const offsets = [];
  let acc = padded[0]; // length of everything joined so far
  for (let j = 0; j < n - 1; j++) {
    offsets.push(secs[j] > 0 ? acc - secs[j] : null); // null = hard cut, no offset
    acc = acc + padded[j + 1] - secs[j];
  }
  return { padded, offsets, totalSec: acc };
}

/**
 * Build the filtergraph that chains n clips with transitions between them.
 *
 * Split out from the ffmpeg call so the graph can be asserted without rendering
 * anything — the timebase rule below is invisible until it fails, and it fails
 * on exactly one configuration.
 */
export function transitionGraph({ n, offsets, kinds, secs, fps }) {
  if (n < 2) throw new Error("transitionGraph: needs at least 2 clips");
  const parts = [];

  // xfade refuses to run if its two inputs disagree on timebase, and `concat`
  // emits AVTB (1/1000000) while a decoded clip is 1/fps — so a graph mixing
  // them breaks at the first xfade AFTER a hard cut, and only there.
  //
  // ORDER MATTERS: `fps` resets the timebase to 1/fps, so `settb` has to come
  // after it. Written the other way round this passes every pure-crossfade case
  // and fails the moment one scene asks for "none".
  for (let i = 0; i < n; i++) parts.push(`[${i}:v]fps=${fps},settb=AVTB[c${i}]`);

  let cur = "c0";
  for (let j = 0; j < n - 1; j++) {
    const next = `vx${j}`;
    if (offsets[j] === null) {
      parts.push(`[${cur}][c${j + 1}]concat=n=2:v=1:a=0[${next}]`);
    } else {
      const kind = TRANSITIONS[kinds[j]];
      if (!kind) throw new Error(`transitionGraph: unknown transition "${kinds[j]}"`);
      parts.push(
        `[${cur}][c${j + 1}]xfade=transition=${kind}:duration=${secs[j].toFixed(3)}` +
          `:offset=${offsets[j].toFixed(3)}[${next}]`,
      );
    }
    cur = next;
  }
  parts.push(`[${cur}]format=yuv420p[v]`);
  return parts.join(";");
}

/**
 * Concatenate clips with transitions between them, in a single filtergraph.
 *
 * Costs more than `concatVideos`: xfade blends pixels, so this re-encodes where
 * the concat demuxer only copies streams. Slower, and one generation of
 * compression loss. `--no-transitions` exists for when that trade is wrong.
 *
 * Joints whose offset is `null` are hard cuts, done with the `concat` filter
 * rather than a one-frame xfade — so "none" means none.
 */
export async function concatWithTransitions(clipPaths, outPath, { offsets, kinds, secs, fps }) {
  const graph = transitionGraph({ n: clipPaths.length, offsets, kinds, secs, fps });
  const args = ["-y"];
  for (const p of clipPaths) args.push("-i", resolve(p));
  args.push("-filter_complex", graph, "-map", "[v]", ...ENCODE(fps), outPath);
  await run("ffmpeg", args);
}

/**
 * Mux the narration onto the silent video.
 * Deliberately NO `-shortest`: the video is longer than the audio (the outro
 * holds ~3s past the last word) and that silent tail must survive.
 */
export async function muxAudioOntoVideo(videoPath, audioPath, outPath, { burnSubs = null, fps = 30 } = {}) {
  const args = ["-y", "-i", videoPath, "-i", audioPath, "-map", "0:v:0", "-map", "1:a:0"];
  if (burnSubs) {
    // Burning draws onto the pixels, so the stream copy has to go. Said out loud in the
    // docs rather than discovered as a slow render.
    args.push("-vf", `subtitles=filename='${escapeSubtitlePath(burnSubs)}'`, ...ENCODE(fps).filter((a) => a !== "-an"));
  } else {
    args.push("-c:v", "copy");
  }
  args.push("-c:a", "aac", "-b:a", "192k", outPath);
  await run("ffmpeg", args);
}

/** Width×height of a video, for reporting / verification. */
export async function getVideoSize(path) {
  const raw = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "json",
    path,
  ]);
  const s = JSON.parse(raw)?.streams?.[0] ?? {};
  return { width: s.width ?? 0, height: s.height ?? 0 };
}
