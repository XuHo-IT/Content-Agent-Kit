// motion-index.mjs — which template moves HOW, generated from the templates themselves.
//   node scripts/video/motion-index.mjs                 # the table + the ids under each technique
//   node scripts/video/motion-index.mjs --technique mask-sweep
//   node scripts/video/motion-index.mjs --json          # machine-readable
//   node scripts/video/motion-index.mjs --catalog       # `**Motion:**` lines for CATALOG.md
//
// WHY THIS EXISTS. The kit is not short of advanced motion — 20-odd templates already draw
// lines with `stroke-dashoffset`, sweep gradients through text, and open `clip-path` shapes.
// What was missing is any path TO them. `CATALOG.md` says what a template is FOR, never how it
// MOVES, so an agent opens `frame-vox-collage`, sees `translateY`, and writes `translateY` —
// while `frame-geo-route` next door is drawing a route on a map.
//
// Hand-written lists go stale the first time somebody edits a template. This reads the HTML.
//
// ENV: none. Reads video-templates/ only (VIDEO_TEMPLATES_DIR overrides the location).
import fs from "node:fs";
import path from "node:path";
import { templatesDir, listTemplateIds } from "./lib/paths.mjs";

const argv = process.argv.slice(2);
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);

/**
 * ONE counting definition, because there were two.
 *
 * The 2026-08-16 plan counted 13 `stroke-dashoffset` templates; a naive grep finds 14. Both
 * numbers are "right" — `frame-portfolio-donut` sets a dash offset to carve its donut segments
 * and never animates it. That is geometry, not motion, and an agent told to copy it for a
 * draw-on effect gets a static ring.
 *
 * So: a technique counts as USED only where it can actually move. For the properties that are
 * only interesting when animated, the match must land inside a `@keyframes` block. `staticToo`
 * marks the ones that read as motion either way — a `mask-image` gradient that never travels
 * is still revealing content by light, and `perspective` is a property you set once.
 */
const TECHNIQUES = {
  "draw-on": {
    label: "SVG stroke-dashoffset — a line/route/underline drawing itself",
    re: /stroke-dashoffset/i,
    keyframesOnly: true,
  },
  "clip-reveal": {
    label: "clip-path reveal — a shape opening, reads as a camera move",
    re: /clip-path\s*:\s*(polygon|inset|circle|ellipse)/i,
    keyframesOnly: true,
  },
  "mask-sweep": {
    label: "mask-image — content revealed by light rather than by opacity",
    re: /(-webkit-)?mask-image\s*:/i,
    keyframesOnly: false,
  },
  "gradient-text": {
    label: "background-clip:text + moving gradient — fill moves, letters stay put",
    re: /(-webkit-)?background-clip\s*:\s*text/i,
    keyframesOnly: false,
  },
  dimensional: {
    label: "perspective + rotateX/Y — a card turning, a page lifting",
    re: /rotate[XY3]d?\s*\(/i,
    keyframesOnly: true,
  },
  conic: {
    label: "conic-gradient rotation — radar sweep / ring light, no image needed",
    re: /conic-gradient/i,
    keyframesOnly: false,
  },
  mechanical: {
    label: "steps() easing — deliberate judder for counters and film grain",
    re: /steps\s*\(/i,
    keyframesOnly: false,
  },
  ambient: {
    label: "a continuous (infinite) layer — the frame never goes dead",
    re: /infinite/i,
    keyframesOnly: false,
  },
};

if (argv.includes("--help")) {
  console.log(
    `motion-index.mjs — index which template uses which motion technique\n` +
      `  node scripts/video/motion-index.mjs                  table + ids per technique\n` +
      `  node scripts/video/motion-index.mjs --technique <k>  just the ids for one technique\n` +
      `  node scripts/video/motion-index.mjs --json           machine-readable\n` +
      `  node scripts/video/motion-index.mjs --catalog        **Motion:** lines for CATALOG.md\n` +
      `  node scripts/video/motion-index.mjs --write-catalog  write those lines INTO CATALOG.md\n` +
      `  node scripts/video/motion-index.mjs --debt           templates with no continuous layer\n` +
      `techniques: ${Object.keys(TECHNIQUES).join(" ")}\n` +
      `env: none`,
  );
  process.exit(0);
}

/** Both aspects. A template counts if EITHER composition uses the technique — 9:16 is what
 *  this pipeline renders, but a 16:9-only effect is still a working sample to copy from. */
const compositionsOf = (id) =>
  ["index.html", "compositions/portrait.html"]
    .map((f) => path.join(templatesDir(), id, f))
    .filter((p) => fs.existsSync(p));

/**
 * Concatenate every `@keyframes` body in the file.
 *
 * Brace-matched rather than regex'd to the first `}`: a keyframes block contains nested
 * `0% { … }` steps, so `/@keyframes[^}]*}/` stops at the end of the FIRST step and would miss
 * every property after it.
 */
function keyframeBodies(css) {
  let out = "";
  const re = /@(?:-webkit-)?keyframes\b/gi;
  let m;
  while ((m = re.exec(css))) {
    const open = css.indexOf("{", m.index);
    if (open === -1) continue;
    let depth = 0;
    let i = open;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) break;
    }
    out += css.slice(open, i) + "\n";
  }
  return out;
}

const index = {};
for (const key of Object.keys(TECHNIQUES)) index[key] = [];
const perTemplate = {};

for (const id of listTemplateIds()) {
  const found = new Set();
  for (const file of compositionsOf(id)) {
    const html = fs.readFileSync(file, "utf8");
    const frames = keyframeBodies(html);
    for (const [key, t] of Object.entries(TECHNIQUES)) {
      if (t.re.test(t.keyframesOnly ? frames : html)) found.add(key);
    }
  }
  perTemplate[id] = [...found].sort();
  for (const key of found) index[key].push(id);
}

const total = listTemplateIds().length;
const dead = Object.entries(perTemplate)
  .filter(([, ks]) => !ks.includes("ambient"))
  .map(([id]) => id);

if (argv.includes("--json")) {
  console.log(JSON.stringify({ total, byTechnique: index, byTemplate: perTemplate, dead }, null, 2));
  process.exit(0);
}

if (argv.includes("--debt")) {
  console.log(`${dead.length}/${total} templates have no continuous layer:\n`);
  for (const id of dead) console.log(`  ${id}`);
  process.exit(0);
}

/**
 * The `**Motion:**` line for one template, or null when it has nothing worth pointing at.
 *
 * Only templates using a technique BEYOND opacity/translate get a line. Tagging all 106 would
 * bury the ~26 that are actually worth copying from, which is the entire point of the field.
 */
function motionLine(id) {
  const ks = perTemplate[id].filter((k) => k !== "ambient");
  if (!ks.length) return null;
  const loop = perTemplate[id].includes("ambient") ? " · continuous loop" : "";
  return `**Motion:** ${ks.join(", ")}${loop}`;
}

// `**Motion:** …` lines to paste under a template's `**Best for:**` in CATALOG.md.
if (argv.includes("--catalog")) {
  for (const id of listTemplateIds()) {
    const line = motionLine(id);
    if (line) console.log(`## ${id}\n${line}\n`);
  }
  process.exit(0);
}

/**
 * Write the `**Motion:**` lines INTO CATALOG.md, in place.
 *
 * Idempotent: an existing `**Motion:**` line is replaced, not duplicated, so this is safe to
 * re-run after editing a template. That is the difference between a catalogue that stays true
 * and one that was accurate on the day somebody typed it.
 */
if (argv.includes("--write-catalog")) {
  const catalog = path.join(templatesDir(), "CATALOG.md");
  if (!fs.existsSync(catalog)) {
    console.error(`[motion-index] ✗ not found: ${catalog}`);
    process.exit(1);
  }
  const lines = fs.readFileSync(catalog, "utf8").split(/\r?\n/);
  const out = [];
  let current = null;
  let added = 0;
  let updated = 0;

  for (const line of lines) {
    const heading = /^##\s+(\S+)\s*$/.exec(line);
    if (heading) current = heading[1];

    // Drop any previous Motion line for this template; we re-emit it below.
    if (current && /^\*\*Motion:\*\*/.test(line)) {
      updated++;
      continue;
    }
    out.push(line);

    // `**Best for:**` is the last line of the prose header, so the Motion line lands third
    // and above the slot table — read as a fact about the template, not a footnote.
    if (current && /^\*\*Best for:\*\*/.test(line)) {
      const motion = motionLine(current);
      if (motion) {
        out.push(motion);
        added++;
      }
    }
  }

  fs.writeFileSync(catalog, out.join("\n"), "utf8");
  console.log(
    `[motion-index] ✓ ${catalog}\n` +
      `[motion-index]   ${added} template(s) carry a Motion line (${updated} rewritten).`,
  );
  process.exit(0);
}

const only = flag("--technique");
if (only) {
  if (!TECHNIQUES[only]) {
    console.error(`Unknown technique "${only}". Known: ${Object.keys(TECHNIQUES).join(" ")}`);
    process.exit(1);
  }
  console.log(index[only].join("\n"));
  process.exit(0);
}

const pad = Math.max(...Object.keys(TECHNIQUES).map((k) => k.length));
console.log(`\n  ${total} templates in ${templatesDir()}\n`);
for (const [key, t] of Object.entries(TECHNIQUES)) {
  const ids = index[key];
  console.log(`  ${key.padEnd(pad)}  ${String(ids.length).padStart(3)}   ${t.label}`);
}
console.log(`\n  ${dead.length} still render a still image after their entrance.\n`);
console.log(`  Copy from these:\n`);
for (const [key, ids] of Object.entries(index)) {
  if (key === "ambient") continue;
  const sample = ids.slice(0, 4).join(", ");
  console.log(`  ${key.padEnd(pad)}  ${sample}${ids.length > 4 ? ` … (+${ids.length - 4})` : ""}`);
}
console.log("");
