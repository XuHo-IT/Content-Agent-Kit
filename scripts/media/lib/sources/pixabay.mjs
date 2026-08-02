// pixabay.mjs — stock video from Pixabay.
// Free for commercial use, attribution NOT required. Forbidden: redistributing on other
// stock platforms, selling unaltered copies, using identifiable people in a bad light.
// See https://pixabay.com/service/license-summary/
//
// NOTE: Pixabay's VIDEO api has no orientation filter and its renditions are landscape
// (1920x1080 and down), so every clip has to be cropped into a 9:16 frame. Prefer Pexels
// when a portrait source matters.
//
// ENV: PIXABAY_API_KEY (also accepts PIXABAY_API)
import { optionalEnv } from "../../../lib/env.mjs";

export const id = "pixabay";
export const label = "Pixabay";
export const license = "Pixabay Content License";
export const keyEnv = ["PIXABAY_API_KEY", "PIXABAY_API"];

export function apiKey() {
  const k = optionalEnv("PIXABAY_API_KEY") || optionalEnv("PIXABAY_API");
  if (!k) {
    throw new Error(
      `Pixabay needs PIXABAY_API_KEY in your .env (see .env.example). Get one free at ` +
        `https://pixabay.com/api/docs/ — this kit is env-only, there are no hardcoded fallbacks.`,
    );
  }
  return k;
}

export function hasKey() {
  return !!(optionalEnv("PIXABAY_API_KEY") || optionalEnv("PIXABAY_API"));
}

/** Renditions are keyed large/medium/small/tiny. Pick the smallest clearing the bar. */
function bestFile(hit, minShortSide = 1080) {
  const vs = Object.entries(hit.videos ?? {})
    .map(([k, v]) => ({ quality: k, ...v }))
    .filter((v) => v.url && v.width && v.height);
  if (vs.length === 0) return null;
  const shortSide = (v) => Math.min(v.width, v.height);
  const enough = vs.filter((v) => shortSide(v) >= minShortSide);
  if (enough.length) return enough.sort((a, b) => shortSide(a) - shortSide(b))[0];
  return vs.sort((a, b) => shortSide(b) - shortSide(a))[0];
}

const toCandidate = (h) => {
  const f = bestFile(h);
  return f && {
    id: String(h.id),
    width: f.width,
    height: f.height,
    duration: h.duration,
    author: h.user ?? "",
    authorUrl: h.user_id ? `https://pixabay.com/users/${h.user_id}/` : "",
    pageUrl: h.pageURL ?? "",
    fileUrl: f.url,
    tags: h.tags ?? "",
    source: id,
    license,
  };
};

export async function search(query, { perPage = 10, minDuration = 0 } = {}) {
  const url = new URL("https://pixabay.com/api/videos/");
  url.searchParams.set("key", apiKey());
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", String(Math.max(3, perPage)));
  url.searchParams.set("safesearch", "true");

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(
      `Pixabay search failed (status ${res.status})` +
        (res.status === 400 ? " — check PIXABAY_API_KEY" : ""),
    );
  }
  const j = await res.json();
  return (j.hits ?? [])
    .filter((h) => !minDuration || (h.duration ?? 0) >= minDuration)
    .map(toCandidate)
    .filter(Boolean);
}

export async function byId(videoId) {
  const url = new URL("https://pixabay.com/api/videos/");
  url.searchParams.set("key", apiKey());
  url.searchParams.set("id", String(videoId));
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Pixabay lookup ${videoId} failed (status ${res.status})`);
  const j = await res.json();
  const c = (j.hits ?? []).map(toCandidate).filter(Boolean)[0];
  if (!c) throw new Error(`Pixabay clip ${videoId} not found or has no usable file`);
  return c;
}
