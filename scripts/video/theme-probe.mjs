// theme-probe.mjs — measure each template's canvas, so theming flips the right way.
//
//   node scripts/video/theme-probe.mjs                      # measure all, write theme-map.json
//   node scripts/video/theme-probe.mjs --template frame-vignelli
//   node scripts/video/theme-probe.mjs --preview paper-blue  # + before/after PNG of every template
//
// A theme has to know whether a composition's canvas is dark (flip the lightness) or light
// (only re-hue). Reading that out of the CSS does not work: the canvas is painted by a
// full-bleed child as often as by `body`, `@media` blocks and comments defeat naive
// parsing, and two compositions of the SAME template can disagree — frame-bold-poster's
// 16:9 is light while its 9:16 is dark. So this measures the rendered pixels instead.
//
// Headless Chrome screenshots the composition, ffmpeg averages it down to an 8x8 grid, and
// the median luminance of the 28 EDGE cells is the canvas — the middle is where the content
// is, so it is excluded. Result lands in video-templates/theme-map.json, which
// lib/theme.mjs reads at render time.
//
// --preview additionally writes the themed page beside the original as PNGs, which is the
// cheap way to check a palette: fourteen stills in ~40s versus a five-minute video render.
//
// ENV: CHROME_PATH (optional), VIDEO_TEMPLATES_DIR (optional). Needs Chrome + ffmpeg.
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { run, pLimit } from "./lib/proc.mjs";
import { templatesDir, listTemplateIds } from "./lib/paths.mjs";
import { findChrome } from "../media/lib/chrome.mjs";
import { resolveTheme, applyTheme, THEME_IDS } from "./lib/theme.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `theme-probe.mjs — measure template canvases (dark/light) into theme-map.json\n` +
      `  --template <id>     probe one template instead of all\n` +
      `  --preview <theme>   also render before/after stills — ${THEME_IDS.join(" | ")}\n` +
      `  --out <dir>         where --preview writes PNGs (default scratch/theme-preview)\n` +
      `  --aspect <a>        limit to 9:16 or 16:9 (default both)\n` +
      `  --dry-run           print the measurements, do not write theme-map.json\n` +
      `  --selftest          check the recolour rules offline (no Chrome, no ffmpeg)\n` +
      `env: CHROME_PATH, VIDEO_TEMPLATES_DIR. Needs Chrome + ffmpeg.`,
  );
  process.exit(0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

/**
 * The recolour rules are pure arithmetic and string rewriting, so they can be checked
 * without a browser — which is what lets CI keep them honest on a runner that has neither
 * Chrome nor a template render. Every case below is a bug that actually shipped once.
 */
if (argv.includes("--selftest")) {
  const T = resolveTheme("paper-blue");
  const relLum = (hex) => {
    const c = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const themed = (src, invert = true) => applyTheme(src, T, { invert }).split("<style")[0];

  const cases = [
    ["dark canvas becomes the theme canvas", () => themed("body{background:#0a0c12}").includes(T.bg)],
    ["light text becomes the theme ink", () => themed("a{color:#ffffff}").includes(T.ink)],
    [
      "hex inside a JS/JSON string is recoloured",
      // Left untouched once, which left a themed comparison card with one orange side.
      () => !themed(`<i data-composition-variables='{"from":"#ffb020"}'>`).includes("#ffb020"),
    ],
    ["url(#id) is left alone", () => themed(".x{filter:url(#abc)}").includes("url(#abc)")],
    ['href="#id" is left alone', () => themed('<a href="#fff">').includes('href="#fff"')],
    ["transparent is left alone", () => themed(".t{color:transparent}").includes("transparent")],
    ["rgba keeps its alpha", () => themed(".s{background:rgba(0,0,0,0.55)}").includes("0.55")],
    [
      "screen flips to multiply on a dark canvas",
      // Unflipped, an aurora blob or glitch layer paints white-on-white and vanishes.
      () => themed(".b{mix-blend-mode:screen}").includes("multiply"),
    ],
    [
      "blend modes are untouched on a light canvas",
      () => themed(".b{mix-blend-mode:screen}", false).includes("screen"),
    ],
    [
      "every mapped accent clears 3:1 against the canvas",
      // Lightness inversion alone leaves mid-tone accents at ~1.5:1 on white.
      () =>
        ["#ffb020", "#ff7a3d", "#34e0c0", "#22d3ee", "#38bdf8", "#ff5757", "#8c52ff", "#2ee6a0"]
          .map((c) => themed(`a{color:${c}}`).match(/#[0-9a-f]{6}/)[0])
          .every((m) => ratio(m, T.bg) >= 3),
    ],
    [
      "distinct accents stay distinct",
      // A blanket "make it all one blue" flattens a two-sided comparison into one colour.
      () =>
        new Set(
          ["#ffb020", "#34e0c0", "#8c52ff", "#ff4d5e"].map(
            (c) => themed(`a{color:${c}}`).match(/#[0-9a-f]{6}/)[0],
          ),
        ).size === 4,
    ],
    [
      "bg/ink of every shipped preset clears 4.5:1",
      () => THEME_IDS.every((id) => {
        const t = resolveTheme(id);
        return ratio(t.bg, t.ink) >= 4.5;
      }),
    ],
    [
      "an unknown preset fails loudly",
      () => {
        try {
          resolveTheme("no-such-theme");
          return false;
        } catch {
          return true;
        }
      },
    ],
  ];

  let bad = 0;
  for (const [name, fn] of cases) {
    let ok = false;
    try {
      ok = fn() === true;
    } catch (e) {
      ok = false;
      name.length; // keep the message below the only output
    }
    if (!ok) bad++;
    console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  }
  console.log(`[theme] ${cases.length - bad}/${cases.length} checks passed`);
  process.exit(bad ? 1 : 0);
}

/** Each composition file with the canvas it was authored at. */
const ENTRIES = [
  { file: "compositions/portrait.html", w: 1080, h: 1920, aspect: "9:16" },
  { file: "index.html", w: 1920, h: 1080, aspect: "16:9" },
];

const GRID = 8; // 8x8 area-average: 28 edge cells is plenty to find the canvas
const rel = (p) => path.relative(process.cwd(), p).replace(/\\/g, "/");

/**
 * Templates fill their text through `window.__hyperframes.getVariables()`, which only
 * exists inside a real render — open one in a browser and every slot stays empty. Each
 * composition already carries sample values in `data-composition-variables`, so this shim
 * serves those. Without it a preview is a blank canvas and proves nothing about legibility,
 * which is the entire question a preview is asked.
 *
 * Probe-only. A real render gets the genuine object from hyperframes.
 */
const SHIM = `<script>
window.__hyperframes = { getVariables: function () {
  var el = document.querySelector("[data-composition-variables]");
  try { return el ? JSON.parse(el.getAttribute("data-composition-variables")) : {}; }
  catch (e) { return {}; }
} };
</script>`;

function withSampleText(html) {
  // Before any template script runs, and before </head> so the CSS is already parsed.
  return html.includes("<head>") ? html.replace("<head>", `<head>${SHIM}`) : SHIM + html;
}

/** Screenshot one HTML file at a fixed canvas size. */
async function shoot(chrome, htmlFile, w, h, outPng, profile) {
  await run(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--force-color-profile=srgb",
    "--force-device-scale-factor=1",
    "--disable-features=CalculateNativeWinOcclusion,site-per-process",
    `--user-data-dir=${profile}`,
    `--window-size=${w},${h}`,
    "--virtual-time-budget=5000", // let the entry animations settle (some run to 2.4s)
    `--screenshot=${outPng}`,
    `file:///${path.resolve(htmlFile).replace(/\\/g, "/")}`,
  ]);
  if (!fs.existsSync(outPng) || fs.statSync(outPng).size === 0) {
    throw new Error(`Chrome produced no image for ${rel(htmlFile)}`);
  }
}

/**
 * Median luminance of the frame's edge cells.
 * ffmpeg writes raw rgb24 to a FILE rather than a pipe on purpose — proc.run() buffers
 * stdout as a UTF-8 string, which would corrupt binary bytes.
 */
async function edgeLuminance(png, scratch) {
  const raw = path.join(scratch, `${path.basename(png, ".png")}.raw`);
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", png,
    "-vf", `scale=${GRID}:${GRID}:flags=area`,
    "-f", "rawvideo", "-pix_fmt", "rgb24",
    raw,
  ]);
  const buf = fs.readFileSync(raw);
  const lums = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (x > 0 && x < GRID - 1 && y > 0 && y < GRID - 1) continue; // skip the content middle
      const i = (y * GRID + x) * 3;
      lums.push((0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2]) / 255);
    }
  }
  lums.sort((a, b) => a - b);
  return lums[Math.floor(lums.length / 2)];
}

try {
  const chrome = findChrome();
  const tplDir = templatesDir();
  const only = flag("--template");
  const wantAspect = flag("--aspect");
  const previewTheme = flag("--preview");
  const theme = previewTheme ? resolveTheme(previewTheme) : null;
  const previewDir = path.resolve(flag("--out", "scratch/theme-preview"));

  let ids = listTemplateIds();
  if (only) {
    if (!ids.includes(only)) throw new Error(`Unknown template "${only}". Known: ${ids.join(", ")}`);
    ids = [only];
  }

  const jobs = [];
  for (const id of ids) {
    for (const e of ENTRIES) {
      if (wantAspect && e.aspect !== wantAspect) continue;
      if (fs.existsSync(path.join(tplDir, id, e.file))) jobs.push({ id, ...e });
    }
  }
  if (jobs.length === 0) throw new Error("No compositions to probe.");

  console.log(`[theme] probing ${jobs.length} compositions with headless Chrome`);
  if (theme) {
    fs.mkdirSync(previewDir, { recursive: true });
    console.log(`[theme] preview "${theme.id}" → ${rel(previewDir)}`);
  }

  const scratch = await mkdtemp(path.join(tmpdir(), "cak-theme-"));
  const canvases = {};
  const rows = [];
  // Chrome instances are heavy; three at a time keeps a laptop responsive.
  const limit = pLimit(3);

  try {
    await Promise.all(
      jobs.map((job) =>
        limit(async () => {
          const key = `${job.id}/${job.file}`;
          const tag = `${job.id}-${job.aspect.replace(":", "x")}`;
          const profile = await mkdtemp(path.join(scratch, "prof-"));
          const srcHtml = fs.readFileSync(path.join(tplDir, job.id, job.file), "utf8");

          // Work inside a copy of the template folder so the shimmed page keeps its
          // relative asset paths, and the vendored folder is never written to.
          const copy = path.join(scratch, tag);
          fs.cpSync(path.join(tplDir, job.id), copy, { recursive: true });
          const sibling = (suffix) => path.join(copy, job.file.replace(/\.html$/, `.${suffix}.html`));

          const beforeHtml = sibling("probe");
          fs.writeFileSync(beforeHtml, withSampleText(srcHtml), "utf8");
          const beforePng = path.join(theme ? previewDir : scratch, `${tag}-before.png`);
          await shoot(chrome, beforeHtml, job.w, job.h, beforePng, profile);
          const L = await edgeLuminance(beforePng, scratch);
          const canvas = L < 0.5 ? "dark" : "light";
          canvases[key] = canvas;

          let afterNote = "";
          if (theme) {
            const afterHtml = sibling("themed");
            fs.writeFileSync(
              afterHtml,
              withSampleText(
                applyTheme(srcHtml, theme, { invert: canvas === "dark", templateId: job.id }),
              ),
              "utf8",
            );
            const afterPng = path.join(previewDir, `${tag}-after.png`);
            await shoot(chrome, afterHtml, job.w, job.h, afterPng, profile);
            afterNote = ` → L=${(await edgeLuminance(afterPng, scratch)).toFixed(2)}`;
          }

          rows.push(`  ${key.padEnd(48)} L=${L.toFixed(2)}  ${canvas.padEnd(5)}${afterNote}`);
        }),
      ),
    );
  } finally {
    await rm(scratch, { recursive: true, force: true }).catch(() => {});
  }

  for (const r of rows.sort()) console.log(r);

  const dark = Object.values(canvases).filter((c) => c === "dark").length;
  console.log(`[theme] ${dark} dark · ${Object.keys(canvases).length - dark} light`);

  if (argv.includes("--dry-run")) {
    console.log(`[theme] --dry-run — theme-map.json not written`);
  } else {
    const out = path.join(tplDir, "theme-map.json");
    // Probing one template must not drop the other measurements.
    const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")).canvases ?? {} : {};
    const merged = Object.fromEntries(Object.entries({ ...prev, ...canvases }).sort());
    fs.writeFileSync(
      out,
      `${JSON.stringify(
        {
          _comment:
            "Measured by scripts/video/theme-probe.mjs — the canvas each composition renders. " +
            "lib/theme.mjs flips lightness only for a dark canvas. Re-run after editing a template's palette.",
          grid: GRID,
          canvases: merged,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    console.log(`[theme] ✓ ${rel(out)}`);
  }
  if (theme) console.log(`[theme]   open ${rel(previewDir)} and compare *-before / *-after`);
} catch (e) {
  console.error(`[theme] ✗ ${e.message}`);
  process.exit(1);
}
