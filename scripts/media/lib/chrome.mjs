// chrome.mjs — find a Chrome binary for headless screenshots.
//
// No new dependency: the render step already needs Chrome, and hyperframes downloads a
// chrome-headless-shell into the puppeteer cache the first time it runs. So a machine
// that can render video can already take screenshots.
//
// ENV: CHROME_PATH (optional explicit override)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { optionalEnv } from "../../lib/env.mjs";

/** Newest first, so a machine with several versions uses the current one. */
function fromPuppeteerCache() {
  const root = path.join(os.homedir(), ".cache", "puppeteer");
  const out = [];
  for (const flavour of ["chrome-headless-shell", "chrome"]) {
    const dir = path.join(root, flavour);
    if (!fs.existsSync(dir)) continue;
    for (const ver of fs.readdirSync(dir).sort().reverse()) {
      const base = path.join(dir, ver);
      for (const rel of [
        path.join(`${flavour}-win64`, `${flavour}.exe`),
        path.join(`${flavour}-linux64`, flavour),
        path.join(`${flavour}-mac-x64`, `${flavour}`),
        path.join(`${flavour}-mac-arm64`, `${flavour}`),
      ]) {
        const p = path.join(base, rel);
        if (fs.existsSync(p)) out.push(p);
      }
    }
  }
  return out;
}

const SYSTEM = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ],
};

/** @returns {string} absolute path to a usable Chrome/Chromium/Edge binary */
export function findChrome() {
  const explicit = optionalEnv("CHROME_PATH");
  if (explicit) {
    if (!fs.existsSync(explicit)) throw new Error(`CHROME_PATH points at a missing file: ${explicit}`);
    return explicit;
  }
  for (const p of [...fromPuppeteerCache(), ...(SYSTEM[process.platform] ?? [])]) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `No Chrome/Chromium found. Install Chrome, or set CHROME_PATH to a binary. ` +
      `(Rendering a video once also downloads one into ~/.cache/puppeteer.)`,
  );
}

export function chromeAvailable() {
  try {
    findChrome();
    return true;
  } catch {
    return false;
  }
}
