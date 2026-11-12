// file.mjs — a clip or image already on this machine, used as a scene's media.
//
// The AI-footage backends (api, fal, higgsfield) leave one paid clip per scene in clips/.
// To turn those into a finished video — narration, captions, music, one MP4 — the html
// pipeline needs to treat a local file as media like any stock clip. That is all this is:
//   "media": { "kind": "video", "source": "file", "id": "clips/scene-hook.mp4" }
// A relative path resolves against the script's folder (the render's working directory is
// the kit, so relative paths are resolved by the caller writing absolute ones — see
// backends/finish.mjs). Your own footage works the same way.
import fs from "node:fs";
import path from "node:path";

export const id = "file";
export const label = "Local file";
export const license = "yours";
export const keyEnv = [];
export const hasKey = () => true;

export async function byId(p) {
  const abs = path.resolve(String(p));
  if (!fs.existsSync(abs)) throw new Error(`media source "file": not found: ${abs}`);
  return {
    id: path.basename(abs),
    width: 0,
    height: 0,
    duration: 0,
    author: "",
    authorUrl: "",
    pageUrl: "",
    fileUrl: abs,
    source: id,
    license: "own or generated footage",
  };
}

export async function search() {
  throw new Error(`media source "file" takes a path in "id", not a query`);
}
