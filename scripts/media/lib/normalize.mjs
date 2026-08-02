// normalize.mjs — bring any downloaded clip into the render frame.
//
// Stock clips arrive at whatever size and length the contributor uploaded. Pexels can
// give portrait sources; Pixabay's video API is landscape-only, so its clips ALWAYS need
// cropping. And a 5s clip in a 9s scene would freeze on its last frame, so short clips
// are looped rather than held.
import { writeFile } from "node:fs/promises";
import { run } from "../../video/lib/proc.mjs";
import { getDurationSec } from "../../video/lib/ffmpeg-audio.mjs";

/** Download to disk. Kept here so every source shares one timeout/error shape. */
export async function download(url, outPath) {
  const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`Download failed (status ${res.status}): ${url.slice(0, 100)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error(`Download returned 0 bytes: ${url.slice(0, 100)}`);
  await writeFile(outPath, buf);
  return buf.length;
}

/**
 * Scale + centre-crop to exactly width×height ("cover"), optionally loop/trim to
 * `durationSec`. Audio is dropped — the narration owns the soundtrack.
 *
 * `-stream_loop -1` must come BEFORE `-i` (it is an input option); the later `-t`
 * stops it, so a 4s clip fills a 9s scene by repeating instead of freezing.
 */
export async function normalizeVideo(inPath, outPath, {
  width = 1080,
  height = 1920,
  durationSec = null,
  fps = 30,
  fit = "cover",
} = {}) {
  const args = ["-y"];

  if (durationSec) {
    const have = await getDurationSec(inPath).catch(() => null);
    if (have && have < durationSec - 0.05) args.push("-stream_loop", "-1");
  }
  args.push("-i", inPath);

  const vf =
    fit === "contain"
      ? `scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
        `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`
      : `scale=${width}:${height}:force_original_aspect_ratio=increase,` +
        `crop=${width}:${height},setsar=1`;

  args.push("-vf", vf);
  if (durationSec) args.push("-t", durationSec.toFixed(3));
  args.push(
    "-an",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-r", String(fps),
    outPath,
  );

  await run("ffmpeg", args);
}

/** Same framing rules for a still image (screenshots, stock photos). */
export async function normalizeImage(inPath, outPath, { width = 1080, height = 1920, fit = "contain" } = {}) {
  const vf =
    fit === "cover"
      ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`
      : `scale=${width}:${height}:force_original_aspect_ratio=decrease`;
  await run("ffmpeg", ["-y", "-i", inPath, "-vf", vf, outPath]);
}
