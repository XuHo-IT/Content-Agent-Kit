// index.mjs — the stock-source registry.
//
// Same shape as the TTS provider registry: a source is data + three functions, so adding
// one is a file plus a line here. Every source returns the SAME candidate object, which
// is why the rest of the pipeline never branches on which site a clip came from:
//
//   { id, width, height, duration, author, authorUrl, pageUrl, fileUrl, source, license }
import * as pexels from "./pexels.mjs";
import * as pixabay from "./pixabay.mjs";
import * as manual from "./manual.mjs";
import * as geo from "./geo.mjs";
import * as meme from "./meme.mjs";
import * as social from "./social.mjs";
import { optionalEnv } from "../../../lib/env.mjs";

export const SOURCES = { pexels, pixabay, manual, geo, meme, social };
export const SOURCE_IDS = Object.keys(SOURCES);

export function getSource(name) {
  const key = String(name || optionalEnv("STOCK_SOURCE", "pexels")).toLowerCase();
  const s = SOURCES[key];
  if (!s) {
    throw new Error(
      `Unknown stock source "${key}". Known: ${SOURCE_IDS.join(" | ")}. ` +
        `Sites without a public API (Mixkit, Videezy, Videvo, …) go through "manual" — ` +
        `see docs/15-media-sources.md.`,
    );
  }
  return s;
}

/** Which sources are usable right now (key present). For --help style output. */
export function sourceStatus() {
  return SOURCE_IDS.map((k) => {
    const s = SOURCES[k];
    return {
      id: k,
      label: s.label,
      ready: s.hasKey(),
      keyEnv: s.keyEnv,
      license: s.license,
    };
  });
}
