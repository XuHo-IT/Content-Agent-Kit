// screenshot.mjs — capture a web page as a PNG, for "here is the actual source" scenes.
//   node scripts/media/screenshot.mjs --url "https://example.com/post" --out shot.png
//   node scripts/media/screenshot.mjs --url "..." --width 1280 --height 900 --wait 6000
//
// Uses headless Chrome directly — no puppeteer, no new dependency. The binary is found
// via CHROME_PATH, then the puppeteer cache that rendering already populated, then the
// system install. See scripts/media/lib/chrome.mjs.
//
// LIMITATION, stated plainly: `--screenshot` gives no hook for injecting CSS, so a cookie
// or consent wall WILL appear in the image if the site shows one. There is no flag that
// removes it. When that happens: raise --wait (some banners auto-dismiss), point --url at
// a page without the wall, or capture that one by hand. Everything else here is automatic.
//
// ENV: CHROME_PATH (optional)
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { runInherit } from "../video/lib/proc.mjs";
import { findChrome } from "./lib/chrome.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `screenshot.mjs — capture a web page as PNG (headless Chrome)\n` +
      `  --url <url>       page to capture (required)\n` +
      `  --out <file>      output .png (required)\n` +
      `  --width <n>       viewport width  (default 1280)\n` +
      `  --height <n>      viewport height (default 800)\n` +
      `  --wait <ms>       let the page settle (default 6000)\n` +
      `  --scale <n>       device pixel ratio, 2 = retina (default 2)\n` +
      `note: a site's cookie/consent wall cannot be suppressed here — see the file header\n` +
      `env: CHROME_PATH (optional — otherwise auto-detected)`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

try {
  const url = flag("--url");
  const out = flag("--out");
  if (!url) throw new Error("Pass --url");
  if (!out) throw new Error("Pass --out <file>.png");
  if (!/^https?:\/\//i.test(url)) throw new Error(`--url must be http(s), got "${url}"`);

  const width = Number(flag("--width", "1280"));
  const height = Number(flag("--height", "800"));
  const wait = Number(flag("--wait", "6000"));
  const scale = Number(flag("--scale", "2"));

  const chrome = findChrome();
  const outPath = path.resolve(out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const profile = await mkdtemp(path.join(tmpdir(), "cak-shot-"));
  try {
    await runInherit(chrome, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--force-color-profile=srgb",
      "--disable-features=CalculateNativeWinOcclusion,site-per-process",
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      `--force-device-scale-factor=${scale}`,
      `--virtual-time-budget=${wait}`,
      `--screenshot=${outPath}`,
      url,
    ]);

    if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
      throw new Error(`Chrome produced no image for ${url}`);
    }
    const kb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`[media] ✓ screenshot ${width}x${height} @${scale}x — ${kb} KB`);
    console.log(`[media]   ${outPath}`);
  } finally {
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
} catch (e) {
  console.error(`[media] ✗ ${e.message}`);
  process.exit(1);
}
