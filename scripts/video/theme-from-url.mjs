// theme-from-url.mjs — read a brand palette off a live web page and write it as a theme.
//
//   node scripts/video/theme-from-url.mjs --url https://example.com --name acme
//   node scripts/video/theme-from-url.mjs --url https://example.com --dry-run
//
// The kit ships three palettes. Anything else meant guessing hex codes by eye until a
// render looked close, and the palette that matters most — the user's own brand — is the
// one nobody has memorised.
//
// Every part of this already existed:
//   · scripts/media/screenshot.mjs captures the page (headless Chrome, no dependency)
//   · ffmpeg downscales it to raw RGB, the same tool the rest of the pipeline uses
//   · theme.mjs has the WCAG contrast rules and the HSL maths
//
// WHAT IT CANNOT DO, stated plainly: it reads the pixels that are there. On a page that is
// mostly photography the dominant colour is the photograph, not the brand. It prints the
// palette and asks before writing for exactly that reason — a machine can guess this, but
// it should not guess it on your behalf.
//
// ENV: CHROME_PATH (optional — same detection as screenshot.mjs)
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { run } from "./lib/proc.mjs";
import { templatesDir } from "./lib/paths.mjs";
import { contrastRatio, hexToRgb, THEME_IDS, loadUserThemes } from "./lib/theme.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `theme-from-url.mjs — build a theme from a live page's colours\n` +
      `  --url <url>       page to read (required)\n` +
      `  --name <id>       theme id to write into video-templates/themes.json\n` +
      `  --dry-run         print the palette and the theme, write nothing\n` +
      `  --yes             skip the confirmation (required when stdin is not a terminal)\n` +
      `  --force           overwrite an existing theme of that name\n` +
      `  --wait <ms>       let the page settle before capturing (default 6000)\n` +
      `  --keep-shot <f>   keep the screenshot, to check what was actually read\n` +
      `env: CHROME_PATH (optional)`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const has = (n) => argv.includes(n);

import { countColours, choose } from "./lib/palette.mjs";

// ── main ──────────────────────────────────────────────────────────────────────

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bar = (share) => "█".repeat(Math.max(1, Math.round(share * 40)));

try {
  const url = flag("--url");
  const name = flag("--name");
  const dry = has("--dry-run");
  if (!url) throw new Error("Pass --url");
  if (!/^https?:\/\//i.test(url)) throw new Error(`--url must be http(s), got "${url}"`);
  if (!name && !dry) throw new Error("Pass --name <id>, or --dry-run to just look");
  if (name && !/^[a-z0-9][a-z0-9-]{1,30}$/.test(name)) {
    throw new Error(`--name must be lowercase-kebab, got "${name}"`);
  }
  if (name && THEME_IDS.includes(name)) {
    throw new Error(`"${name}" is a shipped preset — pick another id`);
  }

  const tmp = await mkdtemp(path.join(tmpdir(), "cak-theme-"));
  try {
    // 1 — capture. Reuses the existing CLI rather than a second Chrome integration.
    const shot = path.join(tmp, "page.png");
    console.log(`[theme] capturing ${url}`);
    await run("node", [
      path.join(HERE, "..", "media", "screenshot.mjs"),
      "--url", url, "--out", shot,
      "--width", "1440", "--height", "900",
      "--wait", flag("--wait", "6000"), "--scale", "1",
    ]);
    if (flag("--keep-shot")) fs.copyFileSync(shot, flag("--keep-shot"));

    // 2 — downscale to raw RGB. Through a file, not stdout: run() decodes as UTF-8 and
    // would mangle every byte above 0x7f, which is most of an image.
    const raw = path.join(tmp, "page.rgb");
    await run("ffmpeg", ["-y", "-i", shot, "-vf", "scale=480:-1", "-f", "rawvideo", "-pix_fmt", "rgb24", raw]);
    const palette = countColours(await readFile(raw));
    if (palette.length < 2) throw new Error("the page came back as a single flat colour — is it behind a wall?");

    // 3 — choose, and show the working
    const { bg, ink, accent, theme, notes } = choose(palette);

    console.log(`\n  what the page is made of — top ${Math.min(8, palette.length)} of ${palette.length}\n`);
    for (const c of palette.slice(0, 8)) {
      const role = c === bg ? "canvas" : c === ink ? "ink" : c === accent ? "accent" : "";
      console.log(
        `    ${c.hex}  ${(c.share * 100).toFixed(1).padStart(5)}%  ${bar(c.share).padEnd(40)} ${role}`,
      );
    }

    const cr = (a, b) => contrastRatio(hexToRgb(a), hexToRgb(b)).toFixed(1);
    console.log(`\n  canvas ${theme.bg}  ·  ink ${theme.ink}  ·  contrast ${cr(theme.bg, theme.ink)}:1  (floor 4.5)`);
    if (accent) console.log(`  accent ${accent.hex}  ·  contrast ${cr(theme.bg, accent.hex)}:1  (floor 3.0)`);
    console.log(`  hue ${theme.hue}°  ·  spread ±${theme.spread}°  ·  saturation ${theme.saturation}`);
    for (const n of notes) console.log(`  ! ${n}`);

    console.log(`\n${JSON.stringify({ [name ?? "<name>"]: { label: `read from ${url}`, ...theme } }, null, 2)}\n`);

    if (dry) {
      console.log("[theme] --dry-run, nothing written");
      process.exit(0);
    }

    // 4 — confirm. The dominant colour of an image-heavy page is the image, and only the
    // person whose brand it is can tell the difference from a photograph.
    if (!has("--yes")) {
      if (!process.stdin.isTTY) {
        throw new Error("stdin is not a terminal — re-run with --yes once you have read the palette above");
      }
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const ans = (await rl.question(`Write this as "${name}"? [y/N] `)).trim().toLowerCase();
      rl.close();
      if (ans !== "y" && ans !== "yes") {
        console.log("[theme] not written");
        process.exit(1);
      }
    }

    // 5 — write
    const file = path.join(templatesDir(), "themes.json");
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {
      _comment: [
        "Palettes read off real pages by scripts/video/theme-from-url.mjs, or written by hand.",
        "Use one with \"theme\": \"<id>\" in a script.json, exactly like a shipped preset.",
        "",
        "These are NOT part of the kit: they describe someone's brand, so they belong to",
        "whoever's repo they sit in. Delete the file to remove them all.",
      ],
    };
    if (existing[name] && !has("--force")) {
      throw new Error(`"${name}" already exists in themes.json — pass --force to replace it`);
    }
    existing[name] = { label: `read from ${url}`, ...theme };
    fs.writeFileSync(file, JSON.stringify(existing, null, 2) + "\n", "utf8");
    console.log(`[theme] ✓ ${path.relative(process.cwd(), file)} — use it with "theme": "${name}"`);
    console.log(`[theme]   ${Object.keys(loadUserThemes()).length + (loadUserThemes()[name] ? 0 : 1)} user themes now defined`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
} catch (err) {
  console.error(`[theme] ✗ ${err.message}`);
  process.exit(1);
}
