// paths.mjs — where the video pipeline finds its templates / SFX / kit root.
//
// Upstream (AI-auto-generate-video) hardcoded both of these relative to the
// OUTPUT directory (`outputDir/../../assets/sfx`), which silently broke as soon
// as you rendered anywhere other than `<repo>/output/<slug>/`. Here they are
// resolved from THIS module's location instead, and both are overridable.
//
// ENV (both optional): VIDEO_TEMPLATES_DIR, VIDEO_SFX_DIR
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { optionalEnv } from "../../lib/env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Repo root of content-agent-kit (scripts/video/lib → ../../..). */
export const KIT_ROOT = path.resolve(here, "..", "..", "..");

/** Vendored HyperFrames templates. Named `video-templates/` so it is never
 *  confused with `templates/`, which in this kit means {{PLACEHOLDER}} scaffolds. */
export function templatesDir() {
  return path.resolve(optionalEnv("VIDEO_TEMPLATES_DIR") || path.join(KIT_ROOT, "video-templates"));
}

/** Optional SFX library. Missing → the pipeline renders without sound effects. */
export function sfxDir() {
  return path.resolve(optionalEnv("VIDEO_SFX_DIR") || path.join(KIT_ROOT, "assets", "sfx"));
}

/** Template folder names that actually exist on disk (sorted). */
export function listTemplateIds() {
  const dir = templatesDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => fs.existsSync(path.join(dir, n, "index.html")))
    .sort();
}
