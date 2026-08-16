// meme.mjs — a meme as a scene's media, from memegen.link.
//
//   "media": { "kind": "image", "source": "meme", "id": "drake|Viết tay|Dùng agent" }
//   "media": { "kind": "image", "source": "meme", "query": "drake" }
//   "media": { "kind": "video", "source": "meme", "id": "buzz|Meme|Meme khắp nơi" }  // animated
//
// Free, keyless, MIT (https://github.com/jacebrowning/memegen). ~400 templates.
//
// TWO THINGS HERE ARE NOT PREFERENCES, THEY ARE FINDINGS — both were rendered and looked at:
//
// 1. `font=notosans`, NOT the site default `impact`. Impact has no Vietnamese diacritics.
//    "Viết script bằng tay" renders as "VI T SCRIPT BẰNG TAY" and "Để agent viết bước đầu"
//    as "Đ AGENT VI T B C Đ U" — the glyphs are silently dropped, the image still 200s, and
//    nothing downstream can tell. notosans renders all of it correctly.
//
// 2. Text is sent via POST, not built into the URL path. memegen's path encoding is a
//    minefield — `_` is a space, `__` a literal underscore, `--` a literal dash, plus `~q`
//    `~s` `~a` `~p` `~h` and `''` — and Vietnamese punctuation walks straight into it. POST
//    takes a plain array and does the escaping server-side; verified that "Cái gì? 50% / 50%"
//    comes back correctly as `c..i_g..~q_50~p_~s_50~p`.
//
// LINE LENGTH IS THE REAL CONSTRAINT. memegen sizes text to ONE line inside the template's
// text box; when a line wraps to two, the second overflows the box and is clipped. How much
// fits depends on that template's box width, so there is no single number:
//   drake  (two half-width panels) — wraps at ~15 Vietnamese chars, safe under ~14
//   afraid (full-width box)        — 23 chars still fits on one line
// Which is why meme-search.mjs saves the rendered PNG: look at it, do not estimate.
//
// ENV: MEME_API_BASE (default https://api.memegen.link), MEME_FONT (default notosans)
import { optionalEnv } from "../../../lib/env.mjs";

export const id = "meme";
export const label = "memegen.link";
export const license = "Meme templates are internet culture; memegen.link is MIT. See each template's `source`.";
export const keyEnv = [];
export const hasKey = () => true;

const base = () => optionalEnv("MEME_API_BASE", "https://api.memegen.link").replace(/\/+$/, "");
const font = () => optionalEnv("MEME_FONT", "notosans");

const UA = () =>
  optionalEnv("RESEARCH_USER_AGENT", "content-agent-kit/1.0 (+https://github.com/XuHo-IT/Content-Agent-Kit)");

/**
 * `"<template>|<line1>|<line2>"` -> its parts.
 * A bare `"drake"` is a blank template, which is legitimate: some memes carry no text.
 */
export function parseSpec(spec) {
  const parts = String(spec ?? "")
    .split("|")
    .map((s) => s.trim());
  const template = parts.shift();
  if (!template) throw new Error(`source "meme" needs "<template>|<line one>|<line two>".`);
  return { template, text: parts.filter((s) => s.length > 0) };
}

/**
 * The POST body memegen expects. Exported so a test can assert the font default and that
 * Vietnamese survives untouched — the escaping happens server-side, so anything this
 * function does to the text is a bug.
 */
export function imageRequest(spec, { extension = "png", fontId = null } = {}) {
  const { template, text } = parseSpec(spec);
  return {
    template_id: template,
    text,
    font: fontId ?? font(),
    extension,
  };
}

async function getJson(url) {
  const r = await fetch(url, {
    headers: { "user-agent": UA(), accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`memegen HTTP ${r.status} for ${url}`);
  return r.json();
}

/** Ask memegen to render, and take back the canonical URL it built. */
export async function renderUrl(spec, { extension = "png", fontId = null } = {}) {
  const body = imageRequest(spec, { extension, fontId });
  const r = await fetch(`${base()}/images/`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": UA() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) {
    const detail = (await r.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200);
    throw new Error(`memegen POST /images/ -> ${r.status}: ${detail}`);
  }
  const { url } = await r.json();
  if (!url) throw new Error(`memegen POST /images/ returned no url`);
  return url;
}

/** All templates, or those matching a filter. */
export async function templates(filter = "") {
  const u = new URL(`${base()}/templates/`);
  if (filter) u.searchParams.set("filter", filter);
  const list = await getJson(u.href);
  return Array.isArray(list) ? list : [];
}

const toCandidate = (spec, url, tpl = null) => ({
  id: spec,
  // memegen renders at the template's own size; the pipeline scales it into the frame.
  width: 0,
  height: 0,
  duration: 0,
  author: "memegen.link",
  authorUrl: "https://memegen.link",
  pageUrl: tpl?.source || url,
  fileUrl: url,
  tags: tpl ? [tpl.name, ...(tpl.keywords ?? [])].join(", ") : "",
  source: id,
  license,
});

/**
 * Find a template by name/keyword. Returns ONE candidate per template, rendered blank —
 * there is no text to put on it yet, and picking words is the caller's job, not a search's.
 */
export async function search(query, { perPage = 10, kind = "image" } = {}) {
  const found = await templates(String(query || ""));
  const picked = found.slice(0, perPage);
  const extension = kind === "video" ? "gif" : "png";
  return Promise.all(
    picked.map(async (t) => {
      const url = await renderUrl(t.id, { extension }).catch(() => t.blank);
      return toCandidate(t.id, url, t);
    }),
  );
}

/**
 * `kind` decides the format: an animated meme has to arrive as a .gif so normalizeVideo can
 * turn it into an mp4. Requesting .png for a `kind:"video"` scene would hand ffmpeg a still
 * and produce a frozen "animation".
 */
export async function byId(spec, { kind = "image" } = {}) {
  const extension = kind === "video" ? "gif" : "png";
  const url = await renderUrl(spec, { extension });
  const { template } = parseSpec(spec);
  const tpl = (await templates(template).catch(() => []))?.find((t) => t.id === template) ?? null;
  return toCandidate(spec, url, tpl);
}
