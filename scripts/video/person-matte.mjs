#!/usr/bin/env node
// person-matte.mjs — a grey mask of the person in a video (white = person), frame by frame.
//
//   node scripts/video/person-matte.mjs short.mp4 --out short.mask.mp4
//   node scripts/video/person-matte.mjs short.mp4 --from 4 --to 9 --preview check.mp4   # person over green
//
// What it is for: text BEHIND the speaker. talking-head.mjs reads an EDL "behind" list
// ([{ "at": "gấp", "dur": 2.5, "text": "GẤP 3" }]), draws that text on the graded frame, and lays
// the person back over it through this mask — person and background keep the same grade, and
// no alpha video is ever written (a WebM with alpha is the step that breaks across players).
//
// Model: MediaPipe selfie segmenter (Apache-2.0, model included), run in Python — one-time
// setup in lib/vision.mjs. NOT RobustVideoMatting: it is GPL-3.0. Edges are soft, not hair-
// accurate; that is fine for big text behind a head and not fine for a green-screen replacement.
// ENV: VISION_PYTHON (optional). Needs ffmpeg + Python with mediapipe.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "./lib/proc.mjs";
import { ensureModel, runPython } from "./lib/vision.mjs";

const PY = `
import json, sys, cv2, numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
model, src, dst, width = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO,
    output_confidence_masks=True, output_category_mask=False))
writer, n, cover = None, 0, 0.0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    h, w = frame.shape[:2]
    nh = int(round(h * width / w / 2) * 2)
    rgb = cv2.cvtColor(cv2.resize(frame, (width, nh), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    r = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)), int(n * 1000 / fps))
    m = (np.clip(r.confidence_masks[0].numpy_view().reshape(nh, width), 0, 1) * 255).astype(np.uint8)
    if writer is None:
        writer = cv2.VideoWriter(dst, cv2.VideoWriter_fourcc(*"MJPG"), fps, (width, nh), isColor=False)
    writer.write(m)
    cover += float((m > 127).mean())
    n += 1
if writer is not None:
    writer.release()
print(json.dumps({"frames": n, "fps": fps, "cover": round(cover / max(n, 1), 3)}))
`;

/**
 * Mask `video` (optionally only [from, to]) → `out`, a grey H.264 the video's own size and
 * length. `width` is the analysis width; the mask is scaled back up and softened.
 * → { frames, fps, cover } — cover = average share of the frame that is person.
 */
export async function personMatte(video, out, { from = null, to = null, width = 360 } = {}) {
  const model = await ensureModel("selfie");
  const [W, H] = (await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video]))
    .trim().split(",").map(Number);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "cak-matte-"));
  try {
    let src = video;
    if (from !== null || to !== null) {
      src = path.join(work, "part.mp4");
      await run("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...(from !== null ? ["-ss", String(from)] : []), "-i", video,
        ...(to !== null ? ["-t", String(to - (from ?? 0))] : []), "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", src]);
    }
    const raw = path.join(work, "mask.avi");
    const info = runPython(PY, [model, src, raw, width], { what: "person matte" });
    if (!info.frames) throw new Error("no frames decoded — is this a video file?");
    // back to full size; a light blur turns the model's stair-stepped edge into a soft one
    await run("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", raw,
      "-vf", `scale=${W}:${H}:flags=bicubic,gblur=sigma=2.5,format=gray`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", out]);
    return info;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `person-matte.mjs — grey person mask of a video (white = person)\n` +
        `  <video>              any video with a person in it\n` +
        `  --from <s> --to <s>  only this part\n` +
        `  --out <file>         default <video>.mask.mp4\n` +
        `  --preview <file>     also write the person over flat green, to check the edge\n` +
        `Needs Python + mediapipe — setup in scripts/video/lib/vision.mjs.`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const VALUE = new Set(["--from", "--to", "--out", "--preview"]);
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const input = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
  if (!input || !fs.existsSync(input)) {
    console.error(`[person-matte] ✗ input not found: ${input}`);
    process.exit(1);
  }
  const from = flag("--from") !== null ? Number(flag("--from")) : null;
  const to = flag("--to") !== null ? Number(flag("--to")) : null;
  const out = flag("--out", input.replace(/\.[^.]+$/, "") + ".mask.mp4");
  try {
    const info = await personMatte(input, out, { from, to });
    console.log(`[person-matte] ✓ ${info.frames} frames, person ≈ ${Math.round(info.cover * 100)}% of the frame → ${out}`);
    if (info.cover < 0.03) console.warn(`[person-matte] ⚠ almost no person found — text "behind" them would just sit on top`);
    if (flag("--preview")) {
      await run("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...(from !== null ? ["-ss", String(from)] : []), "-i", input,
        "-i", out, "-filter_complex",
        `[0:v]trim=duration=${(await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out])).trim()},setpts=PTS-STARTPTS[v];` +
          `[1:v]format=gray[m];[v][m]alphamerge[p];color=c=0x00b140:s=16x16[g0];[g0][p]scale2ref[g][p2];[g][p2]overlay=shortest=1[o]`,
        "-map", "[o]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", flag("--preview")]);
      console.log(`[person-matte]   preview → ${flag("--preview")}`);
    }
  } catch (e) {
    console.error(`[person-matte] ✗ ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
