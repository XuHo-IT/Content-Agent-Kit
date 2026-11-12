// finish.mjs — turn the clips an AI backend made into a finished video.
//
// Veo, fal and Higgsfield return one silent clip per scene. A creator does not want a folder
// of clips; they want the video: narration, word-by-word captions, music, one MP4 to post.
// The html pipeline already does all of that, and it already knows how to put footage
// behind a scene (`media`, frame-broll). So finishing is a rewrite, not a new renderer:
//
//   every scene that got a clip → templateId frame-broll, media = that clip (source "file"),
//   the scene's own words kept as the on-screen line; the outro keeps its designed card;
//   scenes without a clip stay as they are.
//
// The rewritten script is written beside the original as script.finished.json with
// backend "html", and render.mjs runs on it. `--clips-only` skips this step.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HEADLINE_MAX = 42; // frame-broll `headline` limit (CATALOG.md)
const SUB_MAX = 90; // frame-broll `subheadline`
// The templates that PLAY a video clip — validate.mjs VIDEO_SAFE_TEMPLATES; anything else
// renders a clip black or frozen.
const FOOTAGE_TEMPLATES = new Set(["frame-broll"]);

/** Cut at a word boundary under `max`, no ellipsis — a caption that trails "…" looks broken. */
export function fitWords(text, max) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.5 ? cut.slice(0, at) : s.slice(0, max)).replace(/[,;:–-]\s*$/, "");
}

/**
 * @param {object} script  the script the AI backend rendered
 * @param {Record<string,string>} clips  scene id → absolute clip path
 * @returns {object} a new script for the html backend
 */
export function finishScript(script, clips) {
  const out = JSON.parse(JSON.stringify(script));
  out.backend = "html";
  out.scenes = (out.scenes ?? []).map((scene) => {
    const clip = clips[scene.id];
    if (!clip) return scene;
    const inputs = scene.inputs ?? {};
    const media = { kind: "video", source: "file", id: clip, fit: "cover" };
    const tpl = scene.templateId ?? scene.template;
    if (FOOTAGE_TEMPLATES.has(tpl)) return { ...scene, media };
    // The outro keeps its own frame (follow button, logo, closing statement) — the validator
    // requires an outro template, and a call to action reads better on a designed card.
    if (scene.type === "outro") return scene;
    // The words a viewer should read over the footage: the scene's own headline if it had
    // one, else the start of what is said. Never invented text.
    const headline = fitWords(inputs.headline ?? inputs.title ?? inputs.statement ?? scene.voiceText, HEADLINE_MAX);
    const sub = inputs.subheadline ?? inputs.subtitle ?? inputs.body;
    const { template: _drop, ...rest } = scene;
    return {
      ...rest,
      templateId: "frame-broll",
      inputs: {
        ...(inputs.kicker ? { kicker: fitWords(inputs.kicker, 30) } : {}),
        headline,
        ...(sub ? { subheadline: fitWords(sub, SUB_MAX) } : {}),
      },
      media,
    };
  });
  return out;
}

/** Write script.finished.json and run the html pipeline on it. Returns the video path or null. */
export function renderFinished({ script, scriptPath, outputDir, clips, argv = [] }) {
  if (argv.includes("--clips-only")) {
    console.log(`[video]   --clips-only: stopping at the clips. Finish later with:\n` +
      `[video]     node scripts/video/render.mjs ${path.join(outputDir, "script.finished.json")}`);
  }
  const finished = finishScript(script, clips);
  const finishedPath = path.join(outputDir, "script.finished.json");
  fs.writeFileSync(finishedPath, JSON.stringify(finished, null, 2));
  if (argv.includes("--clips-only")) return null;

  console.log(`[video] finishing: narration, captions, music → one video (html pipeline on script.finished.json)`);
  const render = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "render.mjs");
  const pass = argv.filter((a) => ["--captions", "--profile"].includes(a) || /^(on|off|active)$/.test(a));
  const r = spawnSync(process.execPath, [render, finishedPath, "--backend", "html", ...pass], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`[video] ✗ finishing failed — the paid clips are kept in ${path.join(outputDir, "clips")}. Re-run:\n` +
      `[video]     node scripts/video/render.mjs ${finishedPath}`);
    return null;
  }
  return finishedPath;
}

/** scene id → clip path, for the clips that exist on disk. */
export function clipsOnDisk(script, outputDir) {
  const map = {};
  for (const s of script.scenes ?? []) {
    const f = path.join(outputDir, "clips", `scene-${s.id}.mp4`);
    if (fs.existsSync(f)) map[s.id] = f;
  }
  return map;
}
