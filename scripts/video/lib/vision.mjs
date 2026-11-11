// vision.mjs — the kit's one door to computer vision: face boxes (YuNet) and a person matte
// (MediaPipe selfie segmenter), both run in Python because neither has a dependency-free
// Node equivalent. Same contract as transcribe.mjs: Python is OPTIONAL, called only by the
// scripts that need it, and a missing install is a clear message, never a stack trace.
//
// Setup, once (≈ 300 MB, pulls OpenCV with it):
//   python -m venv .venv-vision && .venv-vision/Scripts/pip install mediapipe     (Windows)
//   python3 -m venv .venv-vision && .venv-vision/bin/pip install mediapipe        (macOS/Linux)
// The kit looks for VISION_PYTHON, then ./.venv-vision, then python / python3 on PATH.
//
// MODELS are fetched on first use into assets/models/ (gitignored), from a pinned URL, and
// refused if their sha256 differs — a model is code, and "latest" is not a version.
//   YuNet 2023mar     opencv_zoo @48b10fa  code Apache-2.0, model MIT (Shiqi Yu)
//   selfie_segmenter  MediaPipe float16 v1  Apache-2.0 (Google)
// Not used, on purpose: RobustVideoMatting (GPL-3.0), rembg's bria-rmbg (non-commercial).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { optionalEnv } from "../../lib/env.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const MODEL_DIR = path.join(KIT, "assets", "models");

export const MODELS = {
  yunet: {
    file: "face_detection_yunet_2023mar.onnx",
    url: "https://media.githubusercontent.com/media/opencv/opencv_zoo/48b10fa505aeb51fbd127fc60a5c660040e823b7/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    sha256: "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    licence: "MIT (model) / Apache-2.0 (opencv_zoo code)",
  },
  selfie: {
    file: "selfie_segmenter.tflite",
    url: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
    sha256: "191ac9529ae506ee0beefa6b2c945a172dab9d07d1e802a290a4e4038226658b",
    licence: "Apache-2.0",
  },
};

/** The Python to use, or null. Checked in order: VISION_PYTHON, ./.venv-vision, PATH. */
export function findPython() {
  const env = optionalEnv("VISION_PYTHON");
  const venv = process.platform === "win32"
    ? path.join(KIT, ".venv-vision", "Scripts", "python.exe")
    : path.join(KIT, ".venv-vision", "bin", "python");
  const cands = [env, venv, process.platform === "win32" ? "python" : "python3", "python"].filter(Boolean);
  for (const c of cands) {
    if (path.isAbsolute(c) && !fs.existsSync(c)) continue;
    const r = spawnSync(c, ["-I", "-c", "import sys; print(sys.version_info[0])"], { encoding: "utf8" });
    if (!r.error && r.status === 0 && r.stdout.trim() === "3") return c;
  }
  return null;
}

const SETUP =
  process.platform === "win32"
    ? "python -m venv .venv-vision && .venv-vision\\Scripts\\pip install mediapipe"
    : "python3 -m venv .venv-vision && .venv-vision/bin/pip install mediapipe";

/** Download a pinned model once; verify its sha256 every time it is fetched. Returns the path. */
export async function ensureModel(key) {
  const m = MODELS[key];
  if (!m) throw new Error(`unknown model "${key}"`);
  const dest = path.join(MODEL_DIR, m.file);
  if (fs.existsSync(dest)) return dest;
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  const res = await fetch(m.url);
  if (!res.ok) throw new Error(`model download failed (${res.status}): ${m.url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  if (sha !== m.sha256) throw new Error(`${m.file}: sha256 ${sha} ≠ pinned ${m.sha256} — refusing it`);
  fs.writeFileSync(dest, buf);
  return dest;
}

/**
 * Run a Python snippet with args; returns its stdout parsed as JSON. `-I` keeps the snippet
 * from importing anything that happens to sit in the working directory.
 */
export function runPython(code, args = [], { what = "vision" } = {}) {
  const py = findPython();
  if (!py) throw new Error(`no Python 3 found — ${what} needs it. Set up once:\n  ${SETUP}`);
  const r = spawnSync(py, ["-I", "-c", code, ...args.map(String)], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error) throw new Error(`could not start ${py}: ${r.error.message}`);
  if (r.status !== 0) {
    const err = String(r.stderr || "");
    if (/No module named '(cv2|mediapipe|numpy)'/.test(err)) throw new Error(`${what} needs mediapipe (it brings OpenCV) — set up once:\n  ${SETUP}`);
    throw new Error(err.trim().split("\n").slice(-4).join("\n"));
  }
  const line = r.stdout.trim().split("\n").at(-1);
  return JSON.parse(line);
}
