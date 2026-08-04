// palette.test.mjs — the colour decisions behind `theme-from-url.mjs`.
//
// The capture needs Chrome and a network; the decisions do not. Everything below builds a
// pixel buffer in memory and checks what comes out, so CI never fails because someone
// else's website was having a bad day.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countColours, choose } from "../scripts/video/lib/palette.mjs";
import { resolveTheme, THEME_IDS, contrastRatio, hexToRgb } from "../scripts/video/lib/theme.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Build an RGB24 buffer from `[hex, pixelCount]` pairs. */
function buffer(spec) {
  const total = spec.reduce((a, [, n]) => a + n, 0);
  const buf = Buffer.alloc(total * 3);
  let i = 0;
  for (const [hex, n] of spec) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    for (let k = 0; k < n; k++, i++) {
      buf[i * 3] = r; buf[i * 3 + 1] = g; buf[i * 3 + 2] = b;
    }
  }
  return buf;
}

const cr = (a, b) => contrastRatio(hexToRgb(a), hexToRgb(b));

test("the background is whatever covers the most of the page", () => {
  const p = countColours(buffer([["#ffffff", 8000], ["#111111", 1500], ["#ff0055", 500]]));
  assert.equal(p[0].hex, "#ffffff");
  assert.ok(Math.abs(p[0].share - 0.8) < 0.01, `share was ${p[0].share}`);
});

test("bucket colours come back as themselves, not as the bucket centre", () => {
  // #fefefe and #ffffff quantise together. Reporting the average keeps the answer honest —
  // a page whose canvas is white should not produce a theme whose canvas is #f0f0f0.
  const p = countColours(buffer([["#ffffff", 5000], ["#fefefe", 5000], ["#000000", 1000]]));
  assert.ok(["#ffffff", "#fefefe", "#feffff", "#fffefe"].includes(p[0].hex), `got ${p[0].hex}`);
});

test("colours below the share floor are dropped", () => {
  // Antialiasing produces hundreds of one-off blends; keeping them would drown the palette.
  const p = countColours(buffer([["#ffffff", 10000], ["#000000", 2], ["#123456", 3000]]));
  assert.deepEqual(p.map((c) => c.hex).sort(), ["#123456", "#ffffff"]);
});

test("ink is the most PROMINENT readable colour, not the most contrasting", () => {
  // This is the bug the first version had. #000000 wins on contrast but covers 0.5% of the
  // page — it is a border or an icon. #333333 covers 30% and is the text.
  const p = countColours(buffer([
    ["#ffffff", 6900],
    ["#333333", 3000],
    ["#000000", 50],
    ["#0066cc", 50],
  ]));
  const { theme } = choose(p);
  assert.equal(theme.bg, "#ffffff");
  assert.equal(theme.ink, "#333333", "the darkest speck should not become the ink");
});

test("ink always clears the 4.5:1 floor validate.mjs enforces", () => {
  // Otherwise the tool writes a theme its own validator rejects.
  for (const spec of [
    [["#ffffff", 9000], ["#767676", 900], ["#e0e0e0", 100]],
    [["#0d1117", 9000], ["#c9d1d9", 900], ["#30363d", 100]],
    [["#fbf7f0", 9000], ["#4a3728", 900], ["#c8a882", 100]],
  ]) {
    const { theme } = choose(countColours(buffer(spec)));
    assert.ok(cr(theme.bg, theme.ink) >= 4.5, `${theme.bg}/${theme.ink} is ${cr(theme.bg, theme.ink).toFixed(2)}:1`);
  }
});

test("a page with no readable pair gets a synthesised ink and says so", () => {
  // A page whose own text fails WCAG should not silently produce a theme that does too.
  const { theme, notes } = choose(countColours(buffer([["#888888", 9000], ["#909090", 1000]])));
  assert.ok(["#000000", "#ffffff"].includes(theme.ink), `got ${theme.ink}`);
  assert.ok(notes.some((n) => /synthesised/.test(n)), `no note: ${JSON.stringify(notes)}`);
  assert.ok(cr(theme.bg, theme.ink) >= 4.5);
});

test("the accent drives the hue, and has to clear 3:1 to count", () => {
  const { theme, accent } = choose(countColours(buffer([
    ["#ffffff", 8000],
    ["#222222", 1500],
    ["#c1121f", 500], // crimson, ~5.9:1 on white
  ])));
  assert.equal(accent.hex, "#c1121f");
  assert.ok(Math.abs(theme.hue - 357) < 6 || theme.hue < 6, `hue ${theme.hue} is not the crimson`);
  assert.ok(cr(theme.bg, accent.hex) >= 3);
});

test("a vivid colour that cannot clear 3:1 is not promoted to accent", () => {
  // Pale yellow on white is invisible. Using it as the hue source would produce a video
  // whose accents disappear — the exact failure the theme system exists to prevent.
  const { accent, notes } = choose(countColours(buffer([
    ["#ffffff", 8000],
    ["#222222", 1500],
    ["#fff59d", 500], // saturated, but ~1.3:1 on white
  ])));
  assert.equal(accent, null);
  assert.ok(notes.some((n) => /monochrome/.test(n)), `no note: ${JSON.stringify(notes)}`);
});

test("a monochrome page keeps the ink's hue at low saturation rather than inventing one", () => {
  const { theme, accent } = choose(countColours(buffer([["#ffffff", 9000], ["#1a1a1a", 1000]])));
  assert.equal(accent, null);
  assert.equal(theme.saturation, 0.35, "an invented accent would push this up");
});

test("a small vivid logo beats a large washed-out band", () => {
  // Brand colours are usually small and vivid; a big pale wash is usually a section
  // background. Ranking on share alone would pick the wash.
  const { accent } = choose(countColours(buffer([
    ["#ffffff", 6000],
    ["#222222", 1500],
    ["#8fa8bd", 2000], // large, desaturated
    ["#0057b8", 500],  // small, vivid
  ])));
  assert.equal(accent.hex, "#0057b8");
});

test("spread widens for a page using a family of hues", () => {
  const tight = choose(countColours(buffer([
    ["#ffffff", 7000], ["#222222", 1500],
    ["#0057b8", 900], ["#0060c8", 600],
  ]))).theme;
  const wide = choose(countColours(buffer([
    ["#ffffff", 6000], ["#222222", 1500],
    ["#0057b8", 800], ["#b80057", 800], ["#57b800", 800],
  ]))).theme;
  assert.ok(wide.spread > tight.spread, `wide ${wide.spread} should exceed tight ${tight.spread}`);
  for (const t of [tight, wide]) assert.ok(t.spread >= 12 && t.spread <= 40, `spread ${t.spread} out of range`);
});

test("every produced theme resolves through the real theme system", () => {
  // A theme this tool writes has to be usable as `"theme": {...}` with no editing.
  for (const spec of [
    [["#ffffff", 8000], ["#222222", 1500], ["#0057b8", 500]],
    [["#0d1117", 8000], ["#c9d1d9", 1500], ["#58a6ff", 500]],
  ]) {
    const { theme } = choose(countColours(buffer(spec)));
    const r = resolveTheme(theme);
    assert.equal(r.bg, theme.bg);
    assert.ok(r.hue >= 0 && r.hue < 360, `hue ${r.hue}`);
    assert.ok(r.saturation > 0 && r.saturation <= 1.4, `saturation ${r.saturation}`);
  }
});

test("saturation stays inside the range the shipped presets use", () => {
  for (const spec of [
    [["#ffffff", 8000], ["#222222", 1500], ["#ff0000", 500]],
    [["#ffffff", 8000], ["#222222", 1500], ["#7f8a94", 500]],
    [["#ffffff", 9500], ["#222222", 500]],
  ]) {
    const { theme } = choose(countColours(buffer(spec)));
    assert.ok(theme.saturation >= 0.35 && theme.saturation <= 1.4, `saturation ${theme.saturation}`);
  }
});

test("a themes.json in the tree, if present, is usable and readable", () => {
  // The file is written by a tool from a live page, so it is the one theme source nobody
  // hand-checked. If someone commits one, it still has to clear the same floor.
  const p = path.join(KIT, "video-templates", "themes.json");
  if (!fs.existsSync(p)) return; // none shipped — that is the normal state
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const [id, entry] of Object.entries(raw)) {
    if (id.startsWith("_")) continue;
    assert.ok(!THEME_IDS.includes(id), `"${id}" shadows a shipped preset`);
    const t = resolveTheme(id);
    assert.ok(cr(t.bg, t.ink) >= 4.5, `themes.json "${id}": contrast ${cr(t.bg, t.ink).toFixed(2)}:1`);
  }
});
