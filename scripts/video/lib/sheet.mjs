// sheet.mjs — labelled thumbnails laid out in a grid.
//
// Extracted from contact-sheet.mjs so template-sheet.mjs can reuse it rather than
// reimplement it. The hard part here is not stacking images; it is three things that
// each break the whole run when got wrong:
//
//   1. `drawtext` does NOT fall back to a system font. Given no `fontfile` it errors and
//      takes the entire filter chain with it, so a sheet with no font available has to
//      degrade to unlabelled tiles rather than fail.
//   2. ffmpeg's filter parser reads `:` as an option separator, so a Windows drive letter
//      needs exactly ONE backslash — `C\:/…`. Two makes the path invalid again.
//   3. `drawtext` has its own expression vocabulary. `h` is the input height there, while
//      `ih` — perfectly valid in scale/pad — is undefined and fails the chain.
//
// ENV: none. Needs ffmpeg + ffprobe.
import fs from "node:fs";
import path from "node:path";
import { run } from "./proc.mjs";

export const SHEET_BG = "0x111318";
const LABEL_H = 26;

/** drawtext needs a real font file. Look in the usual places per platform. */
const FONT_CANDIDATES = {
  win32: ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/consola.ttf"],
  darwin: ["/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc"],
  linux: [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
  ],
};

export function findFont() {
  for (const p of FONT_CANDIDATES[process.platform] ?? []) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** See note 2 in the header — exactly one backslash before the drive colon. */
export const escapeFontPath = (p) => p.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");

/**
 * The -vf chain for one tile: scale, add a label strip, write the label into it.
 * Pure string building, so the escaping can be asserted in a test without ffmpeg.
 */
export function tileFilter({ width, label, font }) {
  const base = `scale=${width}:-2,pad=iw:ih+${LABEL_H}:0:0:color=${SHEET_BG}`;
  if (!font) return base;
  // `h` is the input height in drawtext's vocabulary; `ih` is not defined there.
  return (
    `${base},drawtext=fontfile='${escapeFontPath(font)}':` +
    `text='${String(label).replace(/[':\\]/g, "")}':x=6:y=h-19:fontsize=13:fontcolor=white`
  );
}

/**
 * Grab one frame and label it.
 *
 * @param {object}  o
 * @param {string}  o.input   video or image to sample
 * @param {number} [o.atSec]  seek position; omit for a still image
 * @param {string}  o.out     destination PNG
 * @returns {Promise<boolean>} whether the label was actually drawn
 */
export async function labelledTile({ input, atSec = null, out, width = 240, label = "", font = null }) {
  const seek = atSec == null ? [] : ["-ss", atSec.toFixed(3)];
  if (font) {
    try {
      await run("ffmpeg", ["-y", ...seek, "-i", input, "-frames:v", "1", "-vf", tileFilter({ width, label, font }), out]);
      return true;
    } catch {
      // Fall through: an unlabelled sheet is still worth looking at.
    }
  }
  await run("ffmpeg", ["-y", ...seek, "-i", input, "-frames:v", "1", "-vf", tileFilter({ width, label, font: null }), out]);
  return false;
}

/** Width of an image, for padding short rows to match. */
async function widthOf(file) {
  const j = JSON.parse(
    await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width", "-of", "json", file]),
  );
  return j.streams[0].width;
}

/**
 * Stack tiles into rows of `perRow`, then stack the rows.
 *
 * A short last row is padded to the widest row first: `vstack` refuses inputs of differing
 * width, and the failure message names the filter rather than the cause.
 */
export async function grid(tiles, { perRow, out, tmpDir }) {
  if (tiles.length === 0) throw new Error("grid: no tiles");

  const rows = [];
  for (let i = 0; i < tiles.length; i += perRow) {
    const chunk = tiles.slice(i, i + perRow);
    const rowFile = path.join(tmpDir, `row${i}.png`);
    if (chunk.length === 1) {
      fs.copyFileSync(chunk[0], rowFile);
    } else {
      await run("ffmpeg", ["-y", ...chunk.flatMap((f) => ["-i", f]), "-filter_complex", `hstack=inputs=${chunk.length}`, rowFile]);
    }
    rows.push(rowFile);
  }

  if (rows.length === 1) {
    // ENCODE, do not copy. The intermediate rows are PNG; copying one to `out` produces a
    // file whose bytes disagree with its extension — a "sheet.jpg" that is really a PNG.
    // Browsers sniff the content so it still displays, which is exactly why this survives
    // unnoticed. Passing it through ffmpeg lets the extension pick the encoder.
    await run("ffmpeg", ["-y", "-i", rows[0], "-q:v", "3", out]);
    return { rows: 1 };
  }

  const widths = [];
  for (const r of rows) widths.push(await widthOf(r));
  const maxW = Math.max(...widths);

  const padded = [];
  for (const [i, r] of rows.entries()) {
    if (widths[i] === maxW) {
      padded.push(r);
      continue;
    }
    const p = path.join(tmpDir, `pad${i}.png`);
    await run("ffmpeg", ["-y", "-i", r, "-vf", `pad=${maxW}:ih:0:0:color=${SHEET_BG}`, p]);
    padded.push(p);
  }
  await run("ffmpeg", ["-y", ...padded.flatMap((f) => ["-i", f]), "-filter_complex", `vstack=inputs=${padded.length}`, out]);
  return { rows: rows.length };
}
