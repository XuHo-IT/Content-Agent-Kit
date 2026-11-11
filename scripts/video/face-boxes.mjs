#!/usr/bin/env node
// face-boxes.mjs — where the speaker's head is, so captions, hook titles and cards can avoid it.
//
//   node scripts/video/face-boxes.mjs short.mp4                    # 12 frames over the whole video
//   node scripts/video/face-boxes.mjs take.mp4 --from 58 --to 73 --frames 12 --out faces.json
//
// Prints the head box (face grown over hair and chin, unioned across the frames) in the
// video's own pixels. talking-head.mjs --faces runs the same detection per segment and moves
// captions and the --hook off the head; a `split` card frames the speaker's half around it.
//
// Detector: OpenCV YuNet (model MIT, code Apache-2.0), run in Python — see lib/vision.mjs for
// the one-time setup. The model (230 KB) is fetched on first use and checked by sha256.
// ENV: VISION_PYTHON (optional). Needs ffmpeg + Python with mediapipe (or opencv-python).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "./lib/proc.mjs";
import { ensureModel, runPython } from "./lib/vision.mjs";
import { headBox } from "./lib/faces.mjs";

const PY = `
import json, sys, cv2
model, paths = sys.argv[1], sys.argv[2:]
det = None
out = []
for p in paths:
    img = cv2.imread(p)
    if img is None:
        out.append({"faces": []}); continue
    h, w = img.shape[:2]
    if det is None:
        det = cv2.FaceDetectorYN.create(model, "", (w, h), 0.6, 0.3, 5000)
    det.setInputSize((w, h))
    _, faces = det.detect(img)
    out.append({"faces": [] if faces is None else
        [{"x": float(f[0]), "y": float(f[1]), "w": float(f[2]), "h": float(f[3]), "score": float(f[14])} for f in faces]})
sys.stdout.write(json.dumps(out))
`;

/** Evenly spaced sample times inside [from, to], away from the very edges (fades, cuts). */
export function sampleTimes(from, to, n = 12) {
  const span = Math.max(0, to - from);
  if (span <= 0) return [from];
  return Array.from({ length: n }, (_, i) => +(from + span * ((i + 0.5) / n)).toFixed(3));
}

/**
 * Detect faces at `times` (seconds) in `video`. Frames are analysed at `scale` of their size
 * (YuNet does not need 1080p) and the boxes are scaled back to full-frame pixels.
 * → { W, H, frames: [{ t, faces: [{x,y,w,h,score}] }] }
 */
export async function detectFaces(video, times, { scale = 0.5 } = {}) {
  const probe = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video]);
  const [W, H] = probe.trim().split(",").map(Number);
  const model = await ensureModel("yunet");
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "cak-faces-"));
  try {
    const files = [];
    for (const [i, t] of times.entries()) {
      const f = path.join(work, `f${i}.png`);
      await run("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-ss", String(t), "-i", video, "-frames:v", "1",
        "-vf", `scale=${Math.round(W * scale / 2) * 2}:-2`, f]);
      files.push(f);
    }
    const res = runPython(PY, [model, ...files], { what: "face detection" });
    const k = 1 / scale;
    return {
      W, H,
      frames: res.map((r, i) => ({
        t: times[i],
        faces: r.faces.map((b) => ({ x: Math.round(b.x * k), y: Math.round(b.y * k), w: Math.round(b.w * k), h: Math.round(b.h * k), score: +b.score.toFixed(3) })),
      })),
    };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `face-boxes.mjs — the speaker's head box, for keeping text off faces\n` +
        `  <video>              any video\n` +
        `  --from <s> --to <s>  only this part (default: all)\n` +
        `  --frames <n>         frames to sample (default 12)\n` +
        `  --out <file>         write the JSON here (default: print it)\n` +
        `Needs Python + mediapipe (or opencv-python) — setup in scripts/video/lib/vision.mjs.`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const VALUE = new Set(["--from", "--to", "--frames", "--out"]);
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const input = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
  if (!input || !fs.existsSync(input)) {
    console.error(`[face-boxes] ✗ input not found: ${input}`);
    process.exit(1);
  }
  try {
    const from = Number(flag("--from", "0"));
    const to = flag("--to") !== null ? Number(flag("--to"))
      : Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", input])).trim());
    const det = await detectFaces(input, sampleTimes(from, to, Number(flag("--frames", "12"))));
    const head = headBox(det.frames, { W: det.W, H: det.H });
    const result = { input: path.basename(input), width: det.W, height: det.H, head, frames: det.frames };
    if (flag("--out")) fs.writeFileSync(flag("--out"), JSON.stringify(result, null, 2) + "\n");
    else console.log(JSON.stringify(result, null, 2));
    console.error(head
      ? `[face-boxes] ✓ head ${head.w}×${head.h} at (${head.x}, ${head.y}) — found in ${head.hits}/${head.frames} frames`
      : `[face-boxes] no steady face (found in fewer than a third of the frames)`);
  } catch (e) {
    console.error(`[face-boxes] ✗ ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
