// pexels.mjs — stock video from Pexels.
// Free for commercial use and social media, modification allowed, attribution NOT required.
// Forbidden: reselling unaltered copies, implying endorsement, redistributing to other
// stock platforms. See https://www.pexels.com/license/
//
// ENV: PEXELS_API_KEY (also accepts PEXELS_API)
import { optionalEnv } from "../../../lib/env.mjs";

export const id = "pexels";
export const label = "Pexels";
export const license = "Pexels License";
export const keyEnv = ["PEXELS_API_KEY", "PEXELS_API"];

export function apiKey() {
  const k = optionalEnv("PEXELS_API_KEY") || optionalEnv("PEXELS_API");
  if (!k) {
    throw new Error(
      `Pexels needs PEXELS_API_KEY in your .env (see .env.example). Get one free at ` +
        `https://www.pexels.com/api/ — this kit is env-only, there are no hardcoded fallbacks.`,
    );
  }
  return k;
}

export function hasKey() {
  return !!(optionalEnv("PEXELS_API_KEY") || optionalEnv("PEXELS_API"));
}

/**
 * Pexels renders each clip at several sizes. For a PORTRAIT target the limiting
 * dimension is the WIDTH, not the height — a "720x1280" file is only 720 wide and
 * would upscale badly into a 1080-wide frame. So pick by the SHORT side.
 */
function bestFile(video, minShortSide = 1080) {
  const files = (video.video_files ?? []).filter((f) => f.width && f.height);
  if (files.length === 0) return null;
  const shortSide = (f) => Math.min(f.width, f.height);
  const enough = files.filter((f) => shortSide(f) >= minShortSide);
  // Smallest file that still clears the bar — sharp enough, cheapest download.
  if (enough.length) return enough.sort((a, b) => shortSide(a) - shortSide(b))[0];
  // Nothing big enough: take the largest available and let the caller decide.
  return files.sort((a, b) => shortSide(b) - shortSide(a))[0];
}

/**
 * @returns {Promise<Array<{id,width,height,duration,author,authorUrl,pageUrl,fileUrl,source,license}>>}
 */
export async function search(query, { orientation = "portrait", perPage = 10, minDuration = 0 } = {}) {
  const url = new URL("https://api.pexels.com/videos/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  if (orientation) url.searchParams.set("orientation", orientation);
  if (minDuration) url.searchParams.set("min_duration", String(minDuration));

  const res = await fetch(url, {
    headers: { Authorization: apiKey() },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    throw new Error(
      `Pexels search failed (status ${res.status})` +
        (res.status === 401 ? " — check PEXELS_API_KEY" : ""),
    );
  }
  const j = await res.json();
  return (j.videos ?? []).map((v) => {
    const f = bestFile(v);
    return {
      id: String(v.id),
      width: f?.width ?? v.width,
      height: f?.height ?? v.height,
      duration: v.duration,
      author: v.user?.name ?? "",
      authorUrl: v.user?.url ?? "",
      pageUrl: v.url ?? "",
      fileUrl: f?.link ?? "",
      source: id,
      license,
    };
  }).filter((c) => c.fileUrl);
}

/** Look one clip up by id — how the lockfile re-resolves without searching. */
export async function byId(videoId) {
  const res = await fetch(`https://api.pexels.com/videos/videos/${encodeURIComponent(videoId)}`, {
    headers: { Authorization: apiKey() },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Pexels lookup ${videoId} failed (status ${res.status})`);
  const v = await res.json();
  const f = bestFile(v);
  if (!f) throw new Error(`Pexels clip ${videoId} has no usable video file`);
  return {
    id: String(v.id),
    width: f.width,
    height: f.height,
    duration: v.duration,
    author: v.user?.name ?? "",
    authorUrl: v.user?.url ?? "",
    pageUrl: v.url ?? "",
    fileUrl: f.link,
    source: id,
    license,
  };
}
