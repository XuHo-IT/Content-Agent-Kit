// compose.mjs — render ONE HyperFrames template to MP4, injecting text slots.
// Ported from AI-auto-generate-video/src/render/template-composer.ts (MIT — see NOTICE.md).
//
// HyperFrames is invoked through `npx -y` rather than being an npm dependency —
// that is how upstream does it, and it is what lets this kit stay install-free.
// The version is PINNED so renders stay deterministic.
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, isAbsolute, join, resolve } from "node:path";
import { runInherit } from "./proc.mjs";
import { templatesDir } from "./paths.mjs";
import { applyTheme, canvasOf, mapInputColors } from "./theme.mjs";

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
 *          mediaFile?:string, theme?:object, log?:Function}} args
 *   mediaFile  — a resolved clip or still for this ONE scene, at `assets/media.mp4|png`.
 *   mediaFiles — several, for a frame that shows a grid of pictures. They land at
 *   `assets/media-1.*` … `assets/media-4.*`, AND the first is ALSO written to
 *   `assets/media.*` so every template built before this kept working unchanged.
 *   theme — a resolved theme (lib/theme.mjs). Recolours a COPY; the vendored template
 *   keeps the palette it was authored with.
 * @returns {Promise<string>} absolute path of the rendered mp4
 */
export async function composeTemplate(args) {
  const { templateId, inputs, fps = 30, quality = "standard", aspect, mediaFile, mediaFiles, theme, durationSec, log } = args;
  const files = (mediaFiles ?? (mediaFile ? [mediaFile] : [])).filter(Boolean);
  const vendored = join(templatesDir(), templateId);
  if (!existsSync(join(vendored, "index.html"))) {
    throw new Error(
      `Template not found: ${join(vendored, "index.html")}\n` +
        `Check the templateId, or set VIDEO_TEMPLATES_DIR.`,
    );
  }

  const entry = aspect ? (ASPECT_ENTRY[aspect] ?? "index.html") : "index.html";
  const entryFile = existsSync(join(vendored, entry)) ? entry : "index.html";

  // A scene with its own footage, or a theme, gets a THROWAWAY COPY of the template.
  // Writing into the vendored folder instead would make two scenes using the same template
  // overwrite each other's clip, and would leave junk in a git-tracked dir.
  let templateDir = vendored;
  let scratch = null;
  if (files.length || theme || durationSec) {
    scratch = mkdtempSync(join(tmpdir(), "cak-tpl-"));
    templateDir = join(scratch, templateId);
    cpSync(vendored, templateDir, { recursive: true });
  }

  if (files.length) {
    mkdirSync(join(templateDir, "assets"), { recursive: true });
    files.forEach((f, i) => {
      if (!existsSync(f)) throw new Error(`Media file not found: ${f}`);
      const ext = extname(f).toLowerCase() === ".png" ? ".png" : ".mp4";
      cpSync(f, join(templateDir, "assets", `media-${i + 1}${ext}`));
      // The first also goes to the original fixed path. Without this every template written
      // before multi-media existed would stop finding its file the moment a caller switched
      // to the array form — a silently blank frame, not an error.
      if (i === 0) cpSync(f, join(templateDir, "assets", `media${ext}`));
    });
  }

  /**
   * Render the composition for as long as the scene actually runs.
   *
   * Templates are authored at a fixed 5–6s, but a scene lasts as long as its narration —
   * 8 to 10 seconds is normal. The gap used to be filled by freezing the last frame
   * (`tpad=stop_mode=clone` in ffmpeg-video.mjs), so a ten-second scene showed a still
   * photograph for its final four. With entrances finishing around the four-second mark, more
   * than half of some scenes had nothing moving at all, and the whole video read as a
   * slideshow.
   *
   * Rewriting `data-duration` in the throwaway copy is the honest fix: the ambient layers keep
   * running, the freeze branch stops firing, and no template file changes on disk.
   */
  if (durationSec) {
    const target = join(templateDir, entryFile);
    const html = readFileSync(target, "utf8");
    const secs = Math.max(1, Math.round(durationSec * 100) / 100);
    const patched = html.replace(/data-duration="[^"]*"/, `data-duration="${secs}"`);
    if (patched === html) {
      log?.(`duration: ${templateId} has no data-duration attribute — leaving its own length`);
    } else {
      writeFileSync(target, patched, "utf8");
    }
  }

  let themedInputs = inputs;
  if (theme) {
    const invert = canvasOf(templateId, entryFile, log) === "dark";

    // Only the entry actually being rendered is rewritten — theming the other composition
    // would double the work for a file hyperframes never opens.
    const target = join(templateDir, entryFile);
    writeFileSync(target, applyTheme(readFileSync(target, "utf8"), theme, { invert, templateId }), "utf8");

    // The template's HTML is not the only place colours live. `scene.inputs` never passes
    // through applyTheme — it travels out through variables.json and hyperframes injects it
    // at render time, AFTER theming has run. So a caller who wrote "accent": "#f59e0b" got
    // amber on a paper-blue video and the only remedy was editing the script by hand, which
    // is literally what the paper-blue sample had to do. Same theme, same invert flag, so
    // the two halves cannot disagree.
    const { mapped, changed } = mapInputColors(inputs, theme, invert);
    themedInputs = mapped;
    for (const c of changed) log?.(`theme: inputs.${c}`);
  }

  try {
    return await renderWith(templateDir, {
      inputs: themedInputs, fps, quality, entryFile, outputPath: args.outputPath,
    });
  } finally {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  }
}

async function renderWith(templateDir, { inputs, fps, quality, entryFile, outputPath: requested }) {

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
