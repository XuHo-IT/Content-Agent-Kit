// theme.mjs — recolour any template to a different palette at render time.
//
// WHY THIS EXISTS. Every template ships one hand-authored palette, and almost all of them
// are dark. Wanting "white canvas, ocean-blue ink" used to mean forking fourteen templates
// and maintaining fourteen more. Instead this rewrites the colour literals in a THROWAWAY
// COPY of the template, so the vendored files keep their original design and a theme is
// three lines in script.json.
//
// HOW. Every colour becomes HSL, then:
//   lightness — flipped for a dark template, kept for a light one (see `invert` below)
//   hue       — squeezed into a narrow band around the theme hue, keeping the ORIGINAL
//               ordering so two accents that differed still differ
//   saturation— floored in the ink range and capped in the canvas range, so text lands
//               unmistakably on-hue and the canvas stays near-white
//
// The ordering-preserving hue squeeze is the point: a blanket "make everything #0a4a7a"
// flattens a comparison card's two sides into one colour. This keeps them distinguishable
// while both read as blue.
//
// KNOWING WHICH WAY TO FLIP is not guessed — `scripts/video/theme-probe.mjs` screenshots
// each composition and measures its actual canvas, writing video-templates/theme-map.json.
// Static CSS parsing was tried first and is not reliable: canvases are painted by a
// full-bleed child as often as by `body`, and two compositions of the SAME template can
// disagree (frame-bold-poster's 16:9 is light while its 9:16 is dark).

import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { templatesDir } from "./paths.mjs";

/**
 * Shipped palettes. `hue`/`spread`/`saturation` are the whole knob set — a new palette is
 * one entry here, not a new template.
 */
export const THEME_PRESETS = {
  "paper-blue": {
    label: "white canvas, ocean-blue ink",
    bg: "#ffffff",
    ink: "#0a4a7a",
    // Centre 212° with a tight ±18° band. A wider band reaches 180° and warm accents come
    // out teal — still blue by the numbers, not the blue anyone means by "ocean".
    hue: 212,
    spread: 18,
    saturation: 1.05,
  },
  "paper-ink": {
    label: "white canvas, near-black ink (neutral, print-like)",
    bg: "#ffffff",
    ink: "#16181d",
    hue: 220,
    spread: 12,
    saturation: 0.35,
  },
  "paper-forest": {
    label: "off-white canvas, forest-green ink",
    bg: "#fbfdfb",
    ink: "#14532d",
    hue: 150,
    spread: 24,
    saturation: 1.0,
  },
};

export const THEME_IDS = Object.keys(THEME_PRESETS);

/**
 * Palettes written by `theme-from-url.mjs`, or by hand, into
 * `video-templates/themes.json`. Kept out of THEME_PRESETS on purpose: those three ship
 * with the kit and its tests cover them, while these belong to whoever's brand they were
 * read from and travel with that person's repo rather than with this one.
 */
let USER_CACHE = null;
export function loadUserThemes() {
  if (USER_CACHE) return USER_CACHE;
  const p = join(templatesDir(), "themes.json");
  if (!existsSync(p)) return (USER_CACHE = {});
  const raw = JSON.parse(readFileSync(p, "utf8"));
  USER_CACHE = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
  return USER_CACHE;
}

/** Every id `script.theme` accepts as a bare string — shipped plus user-written. */
export function knownThemeIds() {
  return [...THEME_IDS, ...Object.keys(loadUserThemes())];
}

const lookup = (id) => THEME_PRESETS[id] ?? loadUserThemes()[id];

/**
 * Normalise `script.theme` — a preset id, or an object that may name a preset via `preset`
 * and override any field of it.
 * @returns {object|null} null when no theme is set (render the template as authored)
 */
export function resolveTheme(theme) {
  if (theme == null) return null;

  let base = {};
  let extra = {};
  if (typeof theme === "string") {
    base = lookup(theme);
    if (!base) throw new Error(`Unknown theme "${theme}". Known: ${knownThemeIds().join(", ")}`);
    extra = { id: theme };
  } else if (typeof theme === "object") {
    if (theme.preset) {
      base = lookup(theme.preset);
      if (!base) throw new Error(`Unknown theme preset "${theme.preset}". Known: ${knownThemeIds().join(", ")}`);
    }
    extra = { id: theme.preset ?? "custom", ...theme };
  } else {
    throw new Error(`theme must be a preset name or an object, got ${typeof theme}`);
  }

  const t = { hue: 205, spread: 26, saturation: 1, ...base, ...extra };
  for (const k of ["bg", "ink"]) {
    if (!/^#[0-9a-fA-F]{6}$/.test(t[k] ?? "")) {
      throw new Error(`theme.${k} must be a 6-digit hex colour, got ${JSON.stringify(t[k])}`);
    }
  }

  // Derive the working numbers once, so the per-colour hot path stays arithmetic.
  const bgH = rgbToHsl(hexToRgb(t.bg));
  const inkH = rgbToHsl(hexToRgb(t.ink));
  return {
    ...t,
    _bg: t.bg.toLowerCase(),
    _ink: t.ink.toLowerCase(),
    _lCanvas: bgH.l,
    _lInk: inkH.l,
    _sInk: Math.max(0.35, inkH.s),
  };
}

/** Short stable id for a resolved theme — used to invalidate cached scene clips. */
export function themeKey(theme) {
  if (!theme) return "none";
  const shape = JSON.stringify([
    theme.bg, theme.ink, theme.hue, theme.spread, theme.saturation,
    theme.css ?? "", theme.overrides ?? {},
  ]);
  return `${theme.id ?? "custom"}-${createHash("sha256").update(shape).digest("hex").slice(0, 8)}`;
}

// ── the measured dark/light map ────────────────────────────────────────────────

let MAP_CACHE = null;

/** `{ "<templateId>/<entryFile>": "dark"|"light" }`, produced by theme-probe.mjs. */
export function loadThemeMap() {
  if (MAP_CACHE) return MAP_CACHE;
  const p = join(templatesDir(), "theme-map.json");
  MAP_CACHE = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).canvases ?? {} : {};
  return MAP_CACHE;
}

/**
 * Does this composition need its lightness flipped? A dark canvas does; a light one only
 * needs re-hueing. Unmeasured compositions default to dark — the common case — and say so,
 * because a silent wrong guess produces a video that is wrong in exactly the way the theme
 * was meant to fix.
 */
export function canvasOf(templateId, entryFile, log = null) {
  const map = loadThemeMap();
  const hit = map[`${templateId}/${entryFile}`];
  if (hit) return hit;
  log?.(
    `theme: ${templateId}/${entryFile} not in theme-map.json — assuming a dark canvas. ` +
      `Run: node scripts/video/theme-probe.mjs`,
  );
  return "dark";
}

// ── colour maths ───────────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a,
  };
}

export function rgbToHsl({ r, g, b }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  if (s === 0) return { r: l, g: l, b: l };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: f(h / 360 + 1 / 3), g: f(h / 360), b: f(h / 360 - 1 / 3) };
}

const to255 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
const hex2 = (v) => to255(v).toString(16).padStart(2, "0");
export const toHex = ({ r, g, b }) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

/** WCAG relative luminance. */
export function relLum({ r, g, b }) {
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a, b) {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Flipping lightness alone is not enough. An accent that sat at mid-lightness was perfectly
 * readable on a near-black canvas and is nearly invisible on a near-white one: amber #ffb020
 * inverts to a cyan of the same lightness, which is 1.5:1 against white. So a SATURATED
 * result — an accent, not a surface — is darkened until it clears the large-text contrast
 * floor. Neutral tints are left alone so cards and panels keep their shading.
 */
const ACCENT_SAT = 0.25;
const ACCENT_MIN_CONTRAST = 3; // WCAG large-text floor; every slot here is poster-sized

function enforceAccentContrast(h, s, l, T) {
  if (s < ACCENT_SAT) return l;
  const bg = hexToRgb(T._bg);
  const floor = Math.max(0.08, T._lInk * 0.7);
  // Measure the QUANTISED colour, not the float one. Rounding to 8 bits moves the ratio by
  // a hair, and #ff5757 came out at 2.995 against a 3.0 floor — a guarantee that misses by
  // 0.005 is not a guarantee.
  const quantised = (lightness) => hexToRgb(toHex(hslToRgb(h, s, lightness)));
  let out = l;
  while (out > floor && contrastRatio(quantised(out), bg) < ACCENT_MIN_CONTRAST) {
    out -= 0.02;
  }
  return out;
}

/**
 * Map one colour onto the theme palette. Exported so theme-probe.mjs can print a palette
 * table without going through a render.
 */
export function mapColor(rgb, T, invert) {
  const { h, s, l } = rgbToHsl(rgb);

  // Snap the two extremes to the exact declared colours. Without this, `color:#fff` lands
  // on a computed near-ink that is close to but never actually the ink the theme names —
  // and the canvas ends up faintly tinted instead of white.
  if (invert) {
    if (l <= 0.07) return T._bg;
    if (l >= 0.9 && s <= 0.45) return T._ink;
  } else {
    if (l >= 0.9 && s <= 0.3) return T._bg;
    if (l <= 0.15) return T._ink;
  }

  let l2 = invert ? T._lInk + (1 - l) * (T._lCanvas - T._lInk) : l;
  // Ordering-preserving squeeze: hue 0° → band start, 180° → centre, 360° → band end.
  const h2 = T.hue + T.spread * ((h / 360) * 2 - 1);

  let s2 = Math.min(0.92, s * T.saturation);
  if (s < 0.05) s2 = 0.06; // greys pick up a faint tint so the frame reads as one palette
  if (l2 <= 0.55) s2 = Math.max(s2, T._sInk * 0.85); // ink range: unmistakably on-hue
  if (l2 >= 0.86) s2 = Math.min(s2, 0.1); // canvas range: stays near-white

  l2 = enforceAccentContrast(h2, s2, l2, T);

  return toHex(hslToRgb(h2, s2, l2));
}

// ── source rewriting ───────────────────────────────────────────────────────────

// `#` followed by 3/4/6/8 hex digits and not part of a longer word.
//
// QUOTED HEX MUST BE INCLUDED. A first cut skipped anything after a quote to dodge
// `href="#id"`, and that silently left every JS palette and every `data-composition-
// variables` default untouched — a themed comparison card still had one orange side and one
// teal one. Those literals are where a template keeps its caller-facing colours, so they are
// exactly the ones a theme has to reach. Only genuine references are excluded, by context.
const HEX_RE = /(^|[^\w&])#([0-9a-fA-F]{3,8})\b/g;
const REF_BEFORE = /(url\(|href\s*=\s*["']?|xlink:href\s*=\s*["']?)$/i;
const RGB_RE = /\brgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/g;

/**
 * A dark canvas going light must flip its blend modes too: `screen` over white paints
 * white, so an aurora blob or a glitch layer silently disappears. These are the standard
 * duals — flipping them is what keeps those effects visible.
 */
const BLEND_FLIP = {
  screen: "multiply",
  multiply: "screen",
  lighten: "darken",
  darken: "lighten",
  "color-dodge": "color-burn",
  "color-burn": "color-dodge",
};

/**
 * Rewrite one composition's HTML into the theme palette.
 * @param {string} html   the composition source
 * @param {object} T      a resolved theme (from resolveTheme)
 * @param {{invert:boolean, templateId?:string}} opts
 */
/**
 * Recolour hex values inside a scene's `inputs`.
 *
 * `applyTheme` rewrites the template's HTML, which covers every colour written INTO the
 * template — but `scene.inputs` never passes through it. Those go out through
 * variables.json and are injected by hyperframes at render time, after theming has already
 * happened. So a caller who passed `"accent": "#f59e0b"` got amber on a paper-blue video,
 * and the only fix was to edit the script by hand. That is exactly what the paper-blue
 * sample had to do.
 *
 * Only whole-string hex values are mapped, and `#AI` style text is untouched: a caption
 * ending in hashtags is far more common in these scripts than a colour, and silently
 * recolouring a word would be worse than leaving a colour alone.
 *
 * @param {*} value    a scene's `inputs` (any nested shape)
 * @param {object} T   a resolved theme
 * @param {boolean} invert
 * @returns {{mapped: *, changed: string[]}} changed lists "path: #old → #new"
 */
export function mapInputColors(value, T, invert, path = "") {
  const changed = [];
  const walk = (v, at) => {
    if (typeof v === "string") {
      const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(v.trim());
      if (!m) return v;
      const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1].slice(0, 6);
      const rgb = {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
      const out = mapColor(rgb, T, invert);
      if (out.toLowerCase() !== v.trim().toLowerCase()) changed.push(`${at}: ${v} → ${out}`);
      return out;
    }
    if (Array.isArray(v)) return v.map((x, i) => walk(x, `${at}[${i}]`));
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, at ? `${at}.${k}` : k)]));
    }
    return v;
  };
  return { mapped: walk(value, path), changed };
}

export function applyTheme(html, T, { invert, templateId } = { invert: true }) {
  let out = html;

  out = out.replace(HEX_RE, (m, pre, digits, offset, whole) => {
    // Look back a few characters rather than at `pre` alone: the character before a
    // quoted colour and before an id reference is the same quote.
    if (REF_BEFORE.test(whole.slice(Math.max(0, offset - 14), offset + pre.length))) return m;
    const len = digits.length;
    if (len !== 3 && len !== 4 && len !== 6 && len !== 8) return m;
    const { a, ...rgb } = hexToRgb(`#${digits}`);
    const mapped = mapColor(rgb, T, invert);
    // Preserve an alpha suffix so translucent scrims stay translucent.
    const alpha = len === 4 || len === 8 ? hex2(a) : "";
    return `${pre}${mapped}${alpha}`;
  });

  out = out.replace(RGB_RE, (m, r, g, b, a) => {
    const mapped = mapColor({ r: +r / 255, g: +g / 255, b: +b / 255 }, T, invert);
    const { r: R, g: G, b: B } = hexToRgb(mapped);
    return a === undefined
      ? `rgb(${to255(R)}, ${to255(G)}, ${to255(B)})`
      : `rgba(${to255(R)}, ${to255(G)}, ${to255(B)}, ${a})`;
  });

  if (invert) {
    out = out.replace(
      /(mix-blend-mode\s*:\s*)(screen|multiply|lighten|darken|color-dodge|color-burn)/g,
      (_m, prop, mode) => prop + BLEND_FLIP[mode],
    );
  }

  const extra = [
    `html, body { background: ${T.bg}; }`,
    T.css ?? "",
    (templateId && T.overrides?.[templateId]) || "",
  ]
    .filter(Boolean)
    .join("\n");

  const tag = `\n<style data-theme="${T.id ?? "custom"}">\n${extra}\n</style>\n`;
  return out.includes("</head>") ? out.replace("</head>", `${tag}</head>`) : out + tag;
}
