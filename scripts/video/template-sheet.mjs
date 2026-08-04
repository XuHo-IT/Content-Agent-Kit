// template-sheet.mjs — several templates side by side, labelled, in one strip.
//
//   node scripts/video/template-sheet.mjs frame-kinetic-type frame-product-reveal
//   node scripts/video/template-sheet.mjs --preset 2026 --out examples/gallery/templates-2026.jpg
//
// WHY. The gallery images in the README were 2×2 grids of full 1080×1920 frames. GitHub
// scales an image to the column width, so a 9:16 block renders as a wall you have to scroll
// past, and nothing on it says which template is which — you had to count against the prose
// underneath. A labelled 1×N strip is the same information in a fifth of the height.
//
// It also makes the gallery REPRODUCIBLE. The old images came from an ad-hoc ffmpeg command
// that existed only in a terminal; regenerating them meant reconstructing it. This is the
// command, and `examples/gallery/gallery-inputs.json` is the content it draws.
//
// Tiling, labelling and font detection come from lib/sheet.mjs — the same code the contact
// sheet uses, so the three ffmpeg traps documented there are solved once.
//
// ENV: none beyond what composeTemplate needs (Chrome). Needs ffmpeg + ffprobe.
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { findFont, labelledTile, grid } from "./lib/sheet.mjs";
import { composeTemplate } from "./lib/compose.mjs";
import { listTemplateIds } from "./lib/paths.mjs";
import { resolveTheme } from "./lib/theme.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The strips the README shows. Named here so regenerating one is a flag, not a list. */
const PRESETS = {
  "2026": ["frame-kinetic-type", "frame-product-reveal", "frame-analog-grain", "frame-split-compare"],
  previous: ["frame-review-verdict", "frame-chart-bars", "frame-step-list", "frame-quote-testimonial"],
};

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `template-sheet.mjs — several templates side by side, labelled\n` +
      `  <id> [<id>…]     template ids to show\n` +
      `  --preset <name>  a named set: ${Object.keys(PRESETS).join(", ")}\n` +
      `  --out <file>     output .jpg or .png (default video-templates/<first>-sheet.jpg)\n` +
      `  --inputs <file>  JSON { "<templateId>": { …slots } } so tiles show real content\n` +
      `  --per-row <n>    columns (default 4)\n` +
      `  --width <n>      thumbnail width in px (default 240)\n` +
      `  --aspect <a>     9:16 (default) | 16:9\n` +
      `  --at <sec>       when to sample each clip (default 4 — after animations settle)\n` +
      `  --theme <id>     render through a theme\n` +
      `env: none (needs Chrome + ffmpeg)`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

try {
  const preset = flag("--preset");
  const ids = preset
    ? PRESETS[preset] ?? (() => { throw new Error(`Unknown preset "${preset}". Known: ${Object.keys(PRESETS).join(", ")}`); })()
    : argv.filter((a) => a.startsWith("frame-") || a.startsWith("caption-") || a.startsWith("transitions-"));
  if (ids.length === 0) throw new Error("Name at least one template id, or pass --preset.");

  const known = listTemplateIds();
  const missing = ids.filter((id) => !known.includes(id));
  if (missing.length) throw new Error(`Not a scene template: ${missing.join(", ")}. Known: ${known.join(", ")}`);

  const perRow = Number(flag("--per-row", "4"));
  const thumbW = Number(flag("--width", "240"));
  const aspect = flag("--aspect", "9:16");
  const atSec = Number(flag("--at", "4"));
  const theme = flag("--theme") ? resolveTheme(flag("--theme")) : null;
  const out = path.resolve(flag("--out") ?? path.join(KIT, "video-templates", `${ids[0]}-sheet.jpg`));

  // Content is a committed file rather than baked in here, so the picture in the README and
  // the command that made it stay in step.
  let inputsMap = {};
  const inputsFile = flag("--inputs");
  if (inputsFile) {
    if (!fs.existsSync(inputsFile)) throw new Error(`No such --inputs file: ${inputsFile}`);
    inputsMap = JSON.parse(fs.readFileSync(inputsFile, "utf8"));
  }

  const tmp = await mkdtemp(path.join(tmpdir(), "cak-tsheet-"));
  try {
    const font = findFont();
    let labels = !!font;
    const tiles = [];

    for (const [i, id] of ids.entries()) {
      const clip = path.join(tmp, `${id}.mp4`);
      console.log(`[video] ${i + 1}/${ids.length} rendering ${id}`);
      await composeTemplate({
        templateId: id,
        inputs: inputsMap[id] ?? {},
        aspect,
        outputPath: clip,
        fps: 30,
        theme,
        log: (m) => console.warn(`[video] ! ${m}`),
      });

      const tile = path.join(tmp, `t${String(i).padStart(2, "0")}.png`);
      const drawn = await labelledTile({ input: clip, atSec, out: tile, width: thumbW, label: id, font });
      if (!drawn) labels = false;
      tiles.push(tile);
    }

    fs.mkdirSync(path.dirname(out), { recursive: true });
    const { rows } = await grid(tiles, { perRow, out, tmpDir: tmp });

    console.log(`[video] ✓ ${ids.length} template(s), ${perRow} per row, ${rows} row(s)`);
    console.log(`[video]   ${out}`);
    if (!labels) {
      console.log(`[video] ! no usable font for labels — order: ${ids.join("  ")}`);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
} catch (e) {
  console.error(`[video] ✗ ${e.message}`);
  process.exit(1);
}
