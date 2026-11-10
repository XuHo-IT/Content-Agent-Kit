// clip-key.mjs — what a rendered scene clip was made FROM, so render.mjs reuses a clip only
// while that is unchanged. Keyed by scene id alone, editing a scene's inputs, swapping its
// template, or fixing the template itself (a font, a hard-coded line) silently re-used the
// old picture.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { templatesDir } from "./paths.mjs";

const ENTRY = { "9:16": "compositions/portrait.html", "16:9": "index.html" };

/** Hash of the template file that will actually be rendered (portrait entry falls back to index). */
export function templateHash(templateId, aspect, dir = templatesDir()) {
  for (const rel of [ENTRY[aspect] ?? "index.html", "index.html"]) {
    const f = path.join(dir, templateId, rel);
    if (fs.existsSync(f)) return createHash("sha1").update(fs.readFileSync(f)).digest("hex").slice(0, 12);
  }
  return "missing";
}

/** Rounded to 0.1 s so a few ms of TTS jitter still reuses the clip. */
export function sceneClipKey(scene, media, durationSec, aspect, tplHash = templateHash(scene.templateId, aspect)) {
  const files = (media ?? []).map((m) => {
    let size = 0;
    try {
      size = fs.statSync(m.file).size;
    } catch {}
    return [m.kind, path.basename(m.file), size];
  });
  const basis = JSON.stringify([scene.templateId, tplHash, scene.inputs ?? {}, files, Math.round(durationSec * 10) / 10, aspect]);
  return createHash("sha1").update(basis).digest("hex").slice(0, 16);
}
