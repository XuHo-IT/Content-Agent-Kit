// palette.mjs — read a colour palette out of a raster image, and pick a theme from it.
//
// Split out of theme-from-url.mjs so the part that makes the decisions can be tested
// without a browser, a network connection, or ffmpeg. Everything here is arithmetic on a
// pixel buffer; the CLI does the capturing.
import { rgbToHsl, relLum, contrastRatio, toHex } from "./theme.mjs";

// ── palette extraction ────────────────────────────────────────────────────────

/** Quantise to a 16-level cube. Fine enough to keep two brand colours apart, coarse
 *  enough that antialiasing and JPEG noise land in the same bucket as their parent. */
export const KEY = (r, g, b) => ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);

/**
 * Count colours in a raw RGB24 buffer, returning buckets with their true average colour
 * rather than the bucket centre — a page's #ffffff and #fefefe should come back as what
 * they are, not as #f0f0f0.
 */
export function countColours(buf, minShare = 0.0005) {
  const px = Math.floor(buf.length / 3);
  const acc = new Map();
  for (let i = 0; i < px; i++) {
    const r = buf[i * 3], g = buf[i * 3 + 1], b = buf[i * 3 + 2];
    const k = KEY(r, g, b);
    let e = acc.get(k);
    if (!e) acc.set(k, (e = { n: 0, r: 0, g: 0, b: 0 }));
    e.n++; e.r += r; e.g += g; e.b += b;
  }
  return [...acc.values()]
    .filter((e) => e.n / px >= minShare)
    .map((e) => {
      const rgb = { r: e.r / e.n / 255, g: e.g / e.n / 255, b: e.b / e.n / 255 };
      return { ...rgbToHsl(rgb), rgb, hex: toHex(rgb), share: e.n / px, lum: relLum(rgb) };
    })
    .sort((a, b) => b.share - a.share);
}

/**
 * Choose canvas, ink and accent from a counted palette.
 *
 * The rules are the ones `validate.mjs` already enforces on a hand-written theme, applied
 * here instead of discovered after a render: ink must clear 4.5:1 against the canvas, and
 * an accent that cannot clear 3:1 is not an accent, it is a colour that will disappear.
 */
export function choose(palette) {
  const notes = [];
  const bg = palette[0]; // a page's background wins on area, essentially always

  const contrastBg = (c) => contrastRatio(c.rgb, bg.rgb);

  // Ink: the most PROMINENT colour that clears 4.5:1, not the most contrasting one.
  //
  // Ranking by contrast was the first version and it is unstable: the darkest thing on a
  // page is often a 0.05% speck — a border, an icon, one logo — and which speck wins moves
  // between two captures of the same URL. Measured on nodejs.org, two runs minutes apart
  // picked #3a7a31 and then #64696b. Ranked by share, both runs pick #417e38.
  //
  // It is also more nearly correct: on developer.mozilla.org the by-share winner is
  // #222527 at 35% of the page, which is the text. The by-contrast winner is #001b28 at
  // 0.40%, which is nothing anyone would call the ink.
  const inkCands = palette
    .slice(1)
    .filter((c) => contrastBg(c) >= 4.5)
    .sort((a, b) => b.share - a.share || contrastBg(b) - contrastBg(a));
  let ink = inkCands[0];
  if (!ink) {
    // A page with no 4.5:1 pair anywhere is a page whose own text fails WCAG. Synthesise
    // rather than fail: black or white against the canvas, whichever wins.
    const black = { rgb: { r: 0, g: 0, b: 0 }, hex: "#000000", s: 0, share: 0 };
    const white = { rgb: { r: 1, g: 1, b: 1 }, hex: "#ffffff", s: 0, share: 0 };
    ink = contrastRatio(black.rgb, bg.rgb) > contrastRatio(white.rgb, bg.rgb) ? black : white;
    notes.push(
      `no colour on the page reaches 4.5:1 against the canvas — ink synthesised as ${ink.hex}`,
    );
  }

  // Accent: prominent AND vivid. Ranked by share × saturation so a small vivid logo can
  // still beat a large washed-out band, which is usually what a brand colour is.
  const accents = palette
    .filter((c) => c !== bg && c !== ink && c.s >= 0.28 && c.l > 0.12 && c.l < 0.92)
    .filter((c) => contrastBg(c) >= 3)
    .sort((a, b) => b.share * b.s - a.share * a.s);
  const accent = accents[0] ?? null;
  if (!accent) {
    notes.push(
      "no colour clears 3:1 against the canvas while staying saturated — the page reads as " +
        "monochrome, so the theme keeps the ink's hue at low saturation rather than inventing one",
    );
  }

  const inkHsl = rgbToHsl(ink.rgb);
  const hue = Math.round(accent ? accent.h : inkHsl.h);

  // Spread: how far the page's own accents wander from the chosen hue. A site using one
  // colour gets a tight band; one using a gradient family gets a wider one. Guessing a
  // constant here is what makes a themed video look like a different brand.
  let spread = 20;
  if (accents.length > 1) {
    const d = accents.slice(0, 6).map((c) => {
      const raw = Math.abs(c.h - hue);
      return Math.min(raw, 360 - raw);
    });
    spread = Math.round(Math.max(12, Math.min(40, d.reduce((a, b) => a + b, 0) / d.length)));
  }

  // `saturation` is a multiplier the shipped presets set between 0.35 and 1.05.
  const sat = accent
    ? Math.round(Math.max(0.35, Math.min(1.4, 0.35 + accent.s * 0.8)) * 100) / 100
    : 0.35;

  return { bg, ink, accent, theme: { bg: bg.hex, ink: ink.hex, hue, spread, saturation: sat }, notes };
}
