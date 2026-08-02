// ffmpeg-video.mjs — fit each clip to its narration, concatenate, mux audio.
// Ported from AI-auto-generate-video/src/render/video-tools.ts (MIT — see NOTICE.md).
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { run } from "./proc.mjs";
import { getDurationSec } from "./ffmpeg-audio.mjs";

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
export async function fitClipToDuration(inPath, targetSec, outPath, fps = 30) {
  const inDur = await getDurationSec(inPath);
  const target = Math.max(0.1, targetSec);
  const args = ["-y", "-i", inPath];
  if (target > inDur + 0.02) {
    const ext = target - inDur;
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
 * Mux the narration onto the silent video.
 * Deliberately NO `-shortest`: the video is longer than the audio (the outro
 * holds ~3s past the last word) and that silent tail must survive.
 */
export async function muxAudioOntoVideo(videoPath, audioPath, outPath) {
  await run("ffmpeg", [
    "-y",
    "-i", videoPath,
    "-i", audioPath,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    outPath,
  ]);
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
