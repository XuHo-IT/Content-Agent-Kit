// compose.mjs — render ONE HyperFrames template to MP4, injecting text slots.
// Ported from AI-auto-generate-video/src/render/template-composer.ts (MIT — see NOTICE.md).
//
// HyperFrames is invoked through `npx -y` rather than being an npm dependency —
// that is how upstream does it, and it is what lets this kit stay install-free.
// The version is PINNED so renders stay deterministic.
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, isAbsolute, join, resolve } from "node:path";
import { runInherit } from "./proc.mjs";
import { templatesDir } from "./paths.mjs";

export const HYPERFRAMES_VERSION = "0.6.94";

/**
 * Each aspect renders a composition authored at that native canvas — these
 * templates use absolute-px layouts, so re-laying-out beats scaling one file.
 * Missing file → fall back to index.html.
 *
 * NOTE: upstream also mapped "1:1" → compositions/square.html, but no template
 * ships that file, so 1:1 silently rendered 16:9. Only 9:16 and 16:9 are real.
 */
const ASPECT_ENTRY = {
  "16:9": "index.html",
  "9:16": "compositions/portrait.html",
};

/**
 * @param {{templateId:string, inputs:object, outputPath:string,
 *          aspect?:"9:16"|"16:9", fps?:number, quality?:"draft"|"standard"|"high",
 *          mediaFile?:string}} args
 *   mediaFile — a resolved clip or still for this ONE scene. Templates reference it at the
 *   fixed path `assets/media.mp4` / `assets/media.png`.
 * @returns {Promise<string>} absolute path of the rendered mp4
 */
export async function composeTemplate(args) {
  const { templateId, inputs, fps = 30, quality = "standard", aspect, mediaFile } = args;
  const vendored = join(templatesDir(), templateId);
  if (!existsSync(join(vendored, "index.html"))) {
    throw new Error(
      `Template not found: ${join(vendored, "index.html")}\n` +
        `Check the templateId, or set VIDEO_TEMPLATES_DIR.`,
    );
  }

  // A scene with its own footage gets a THROWAWAY COPY of the template with the media
  // dropped in. Writing into the vendored folder instead would make two scenes using the
  // same template overwrite each other's clip, and would leave junk in a git-tracked dir.
  let templateDir = vendored;
  let scratch = null;
  if (mediaFile) {
    if (!existsSync(mediaFile)) throw new Error(`Media file not found: ${mediaFile}`);
    scratch = mkdtempSync(join(tmpdir(), "cak-tpl-"));
    templateDir = join(scratch, templateId);
    cpSync(vendored, templateDir, { recursive: true });
    const ext = extname(mediaFile).toLowerCase() === ".png" ? ".png" : ".mp4";
    mkdirSync(join(templateDir, "assets"), { recursive: true });
    cpSync(mediaFile, join(templateDir, "assets", `media${ext}`));
  }

  try {
    return await renderWith(templateDir, { inputs, fps, quality, aspect, outputPath: args.outputPath });
  } finally {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  }
}

async function renderWith(templateDir, { inputs, fps, quality, aspect, outputPath: requested }) {
  const entry = aspect ? (ASPECT_ENTRY[aspect] ?? "index.html") : "index.html";
  const entryFile = existsSync(join(templateDir, entry)) ? entry : "index.html";

  const outputPath = isAbsolute(requested) ? requested : resolve(process.cwd(), requested);

  // Pass variables via a TEMP FILE, not --variables: a JSON argument through
  // npx + shell:true on Windows mangles quotes and Unicode (em-dash, Vietnamese
  // diacritics) and the render silently no-ops. A file is shell-safe and UTF-8 clean.
  const varsFile = join(mkdtempSync(join(tmpdir(), "cak-hf-vars-")), "variables.json");
  writeFileSync(varsFile, JSON.stringify(inputs ?? {}), "utf8");

  await runInherit(
    "npx",
    [
      "-y", // never prompt to install
      `hyperframes@${HYPERFRAMES_VERSION}`,
      "render",
      templateDir,
      "--composition", entryFile,
      "--output", outputPath,
      "--fps", String(fps),
      "--quality", quality,
      "--variables-file", varsFile,
    ],
    { shell: true }, // required for npx resolution on Windows
  );

  return outputPath;
}
