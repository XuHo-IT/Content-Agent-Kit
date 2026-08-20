// normalize.mjs — bring any downloaded clip into the render frame.
//
// Stock clips arrive at whatever size and length the contributor uploaded. Pexels can
// give portrait sources; Pixabay's video API is landscape-only, so its clips ALWAYS need
// cropping. And a 5s clip in a 9s scene would freeze on its last frame, so short clips
// are looped rather than held.
import { writeFile, copyFile } from "node:fs/promises";
import { existsSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { run } from "../../video/lib/proc.mjs";
import { getDurationSec } from "../../video/lib/ffmpeg-audio.mjs";

/**
 * Fetch to disk. Kept here so every source shares one timeout/error shape.
 *
 * A source may hand back a LOCAL PATH instead of a URL — `manual` has documented that
 * since it was written ("paste its direct URL (or a local path) here") and `geo` builds
 * its clip on disk before returning it. Node's fetch refuses both `file://` and bare
 * paths, so those were failing with "Failed to parse URL", which reads like a broken
 * entry rather than an unimplemented case. Copy them instead.
 */
export async function download(url, outPath) {
  const local = /^file:\/\//i.test(url)
    ? fileURLToPath(url)
    : /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
      ? null
      : url;

  if (local !== null) {
    if (!existsSync(local)) throw new Error(`Local media not found: ${local}`);
    const bytes = statSync(local).size;
    if (bytes === 0) throw new Error(`Local media is empty: ${local}`);
    await copyFile(local, outPath);
    return bytes;
  }

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
  // `-frames:v 1 -update 1`: the input is not always a single-frame file. A stock "image"
  // can arrive as a clip (Pexels' catalogue is video), and an animated meme is a GIF — both
  // make the image2 muxer refuse with "Cannot write more than one file with the same name",
  // which reads as a broken path rather than "you handed me a movie". Taking the first frame
  // is what an image output means anyway; the kit's own catalogue still is exactly that.
  await run("ffmpeg", ["-y", "-i", inPath, "-vf", vf, "-frames:v", "1", "-update", "1", outPath]);
  if (/\.png$/i.test(outPath)) stripPngColourChunks(outPath);
}

/**
 * Delete the colour-space chunks ffmpeg copies from the source clip into a PNG still.
 *
 * `cICP` declares coding-independent code points — the chunk that says "these pixels are
 * HDR". ffmpeg writes it whenever the source video carried colour tags, which most stock
 * footage does. The pixels it writes are still ordinary 8-bit sRGB.
 *
 * hyperframes believes the chunk. It switches to its layered-HDR capture path and then dies
 * decoding the file it was just handed:
 *
 *     decodePngToRgb48le: unsupported bit depth 8 (expected 16)
 *     Aborting render to avoid shipping missing HDR image layers
 *
 * The render fails after the narration has already been synthesised and paid for, and which
 * stills trip it looks random — it comes down to which chunks ffmpeg happened to emit for
 * that particular clip. Two images from the same search, one renders and one kills the run.
 *
 * Stripping the chunks here rather than passing ffmpeg colour flags: the flags differ by
 * version and would have to be right on every path that ever writes a still, whereas a PNG
 * is a chunk list and removing three entries from it is exact.
 */
function stripPngColourChunks(file) {
  const DROP = new Set(["cICP", "iCCP", "cHRM", "gAMA", "sRGB", "mDCv", "cLLi"]);
  const buf = readFileSync(file);
  const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.subarray(0, 8).equals(SIG)) return; // not a PNG after all — leave it alone
  const keep = [buf.subarray(0, 8)];
  let off = 8;
  let dropped = 0;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    const end = off + 12 + len;
    if (end > buf.length) break; // truncated: keep what we have rather than corrupt it
    if (DROP.has(type)) dropped++;
    else keep.push(buf.subarray(off, end));
    off = end;
    if (type === "IEND") break;
  }
  if (dropped) writeFileSync(file, Buffer.concat(keep));
}
