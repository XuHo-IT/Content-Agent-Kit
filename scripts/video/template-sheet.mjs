// template-sheet.mjs — several templates side by side, labelled, in one strip.
//
//   node scripts/video/template-sheet.mjs frame-kinetic-type frame-product-reveal
//   node scripts/video/template-sheet.mjs --preset all --out examples/gallery/templates.jpg
//   node scripts/video/template-sheet.mjs --script brain/x/script.json --out frames.jpg
//
// WHY. The gallery images in the README were 2×2 grids of full 1080×1920 frames. GitHub
// scales an image to the column width, so a 9:16 block renders as a wall you have to scroll
// past, and nothing on it says which template is which — you had to count against the prose
// underneath. A labelled 1×N strip is the same information in a fifth of the height.
//
// It also makes the gallery REPRODUCIBLE. The old images came from an ad-hoc ffmpeg command
// that existed only in a terminal; regenerating them meant reconstructing it. This is the
// command, and the content comes from each template's own declared defaults.
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
import { run } from "./lib/proc.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * The catalogue image the README shows, ordered by WHAT EACH FRAME DOES.
 *
 * It used to be three strips ordered by when each batch was added — "the five newest", "the
 * four before that", "and four before those". That is archaeology: a reader choosing a frame
 * does not care which release it arrived in. Grouped by role, the same picture answers the
 * question they actually have.
 *
 * `all` is derived rather than listed, so a new template appears here the moment it exists.
 */
const ROLE_ORDER = [
  // hooks first — they are what a script picks before anything else
  "frame-liquid-bg-hero", "frame-bold-poster", "frame-glitch-title", "frame-creative-voltage",
  // statement / type
  "frame-kinetic-type", "frame-build-minimal", "frame-vignelli", "frame-analog-grain",
  // data
  "frame-chart-bars", "frame-pentagram-stat", "frame-trend-line", "frame-dashboard",
  "frame-split-compare", "frame-timeline", "frame-node-graph", "frame-hud",
  "frame-geo-markers", "frame-geo-route", "frame-funnel", "frame-progress", "frame-draw-on",
  // evidence
  "frame-screenshot", "frame-terminal", "frame-broll", "frame-media-inset",
  // people / proof
  "frame-quote-testimonial", "frame-chat-bubbles", "frame-review-verdict",
  // sequence / advice
  "frame-step-list", "frame-checklist", "frame-myth-fact", "frame-aicoding-list", "frame-aicoding-comparison",
  // reveal / close
  "frame-product-reveal", "frame-logo-outro", "frame-statement-outro",
];

const PRESETS = {
  get all() {
    const have = listTemplateIds();
    // Anything not yet placed in ROLE_ORDER still appears, at the end. A template missing
    // from the catalogue image because someone forgot to list it here is exactly the kind
    // of silent omission this repo keeps finding.
    return [...ROLE_ORDER.filter((id) => have.includes(id)), ...have.filter((id) => !ROLE_ORDER.includes(id))];
  },
};

/**
 * A template's own declared slot values, read out of its composition.
 *
 * These do NOT reach the renderer on their own — `composeTemplate({ inputs: {} })` comes
 * back blank, which is how a sheet of 27 templates would otherwise be 27 empty frames.
 * Reading them here is what makes `--preset all` need no second copy of the content.
 */
function defaultInputs(id, aspect) {
  const file = aspect === "16:9" ? "index.html" : "compositions/portrait.html";
  const html = fs.readFileSync(path.join(KIT, "video-templates", id, file), "utf8");
  const m = html.match(/data-composition-variables='([^']*)'/);
  return m ? JSON.parse(m[1]) : {};
}

/** Templates that draw a supplied clip or still — they have nothing to show without one. */
const MEDIA_TEMPLATES = ["frame-broll", "frame-media-inset", "frame-screenshot"];

/** A neutral gradient, built once per run, so a footage-led tile is not an empty box. */
let placeholderPath = null;
async function placeholder(tmp, aspect) {
  if (placeholderPath) return placeholderPath;
  const [w, h] = aspect === "16:9" ? [1920, 1080] : [1080, 1920];
  placeholderPath = path.join(tmp, "placeholder.png");
  await run("ffmpeg", [
    "-y", "-f", "lavfi",
    "-i", `gradients=s=${w}x${h}:c0=0x1b2430:c1=0x2e3b4e:type=linear:duration=1`,
    "-frames:v", "1", placeholderPath,
  ]);
  return placeholderPath;
}

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `template-sheet.mjs — several templates side by side, labelled\n` +
      `  <id> [<id>…]     template ids to show\n` +
      `  --preset all     every scene template, grouped by what it does\n` +
      `  --script <file>  the scenes of a script.json, in order, with its own inputs\n` +
      `  --out <file>     output .jpg or .png (default video-templates/<first>-sheet.jpg)\n` +
      `  --inputs <file>  JSON { "<templateId>": { …slots } }; without it each template\n` +
      `                   falls back to its own data-composition-variables\n` +
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
  const scriptFile = flag("--script");

  // A script's scenes, in order, each with the inputs that script gives it. This is how a
  // sample gets a picture without spending a single TTS character — the frames are exactly
  // the ones a render would produce, minus the narration timing.
  let scriptScenes = null;
  if (scriptFile) {
    if (!fs.existsSync(scriptFile)) throw new Error(`No such --script file: ${scriptFile}`);
    const script = JSON.parse(fs.readFileSync(scriptFile, "utf8"));
    scriptScenes = (script.scenes ?? []).map((s) => ({ id: s.templateId, inputs: s.inputs ?? {}, sceneId: s.id }));
    if (!scriptScenes.length) throw new Error(`${scriptFile} has no scenes`);
  }

  const ids = scriptScenes
    ? scriptScenes.map((s) => s.id)
    : preset
      ? PRESETS[preset] ?? (() => { throw new Error(`Unknown preset "${preset}". Known: ${Object.keys(PRESETS).join(", ")}`); })()
      : argv.filter((a) => a.startsWith("frame-") || a.startsWith("caption-") || a.startsWith("transitions-"));
  if (ids.length === 0) throw new Error("Name at least one template id, or pass --preset / --script.");

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
      // A script's own inputs win; then the --inputs file; then the template's declared
      // defaults. That last fallback matters more than it looks: passing `inputs: {}`
      // renders a BLANK frame. `data-composition-variables` is the editor's preview state
      // and never reaches the renderer — true of frame-review-verdict too, which predates
      // all of this, so it is long-standing behaviour rather than a new bug.
      let inputs = scriptScenes?.[i]?.inputs ?? inputsMap[id] ?? defaultInputs(id, aspect);
      // These templates switch between <video> and <img> on `media_kind`, so it has to say
      // what was actually supplied. render.mjs carries the same note; a still handed to a
      // template expecting a clip renders as nothing at all, with no error.
      if (MEDIA_TEMPLATES.includes(id)) inputs = { ...inputs, media_kind: "image" };
      const clip = path.join(tmp, `t${String(i).padStart(2, "0")}.mp4`);
      console.log(`[video] ${i + 1}/${ids.length} rendering ${id}`);
      await composeTemplate({
        templateId: id,
        inputs,
        aspect,
        outputPath: clip,
        fps: 30,
        theme,
        // Footage-led frames render as an empty box with nothing behind them, which in a
        // catalogue reads as a broken tile rather than as "this one needs footage". A plain
        // gradient says the frame works without pretending to be someone's B-roll.
        mediaFile: MEDIA_TEMPLATES.includes(id) ? await placeholder(tmp, aspect) : undefined,
        log: (m) => console.warn(`[video] ! ${m}`),
      });

      const tile = path.join(tmp, `t${String(i).padStart(2, "0")}.png`);
      // In script mode the scene id says more than the template id — two scenes can share
      // a template, and "which scene is that" is the question a sheet is opened to answer.
      const label = scriptScenes ? `${i + 1}. ${scriptScenes[i].sceneId}` : id;
      const drawn = await labelledTile({ input: clip, atSec, out: tile, width: thumbW, label, font });
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
