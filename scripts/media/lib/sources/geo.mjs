// geo.mjs — a real place as B-roll: map zoom-in to satellite to street level.
//
// Lets a scene ask for a location the same way it asks for a stock clip:
//
//   "media": { "kind": "video", "source": "geo", "id": "35.4694,138.6206" }
//   "media": { "kind": "video", "source": "geo", "query": "Aokigahara, Japan" }
//
// UNLIKE EVERY OTHER SOURCE, this one has no remote catalogue to search — the clip does not
// exist until something builds it. So `search` and `byId` both BUILD. It costs nothing (all
// tile sources are free and keyless) but it does cost ~50 requests and ~25 seconds, so the
// result is cached on disk by request hash: re-rendering the same script, or two videos
// about the same place, build once.
//
// The build is spawned rather than imported, for the same reason resolve.mjs spawns
// screenshot.mjs — scripts/video/geo-flythrough.mjs stays the single definition of how a
// flythrough is made, with one place to fix flags and one place to document attribution.
//
// ⚠️ ATTRIBUTION: raster tiles carry no credit of their own. The flythrough burns one onto
// every still and writes `<out>.credits.txt` beside the clip; this source copies that into
// media-lock.json, which docs/15 already calls the credits ledger. Do not strip either.
//
// ENV: GEO_CACHE_DIR, GEO_CLIP_SECONDS, GEO_TILE_WIDE, GEO_TILE_CLOSE, GEO_ZOOM_STEPS,
//      GEO_STREET, MAPILLARY_TOKEN (optional)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { optionalEnv } from "../../../lib/env.mjs";
import { KIT_ROOT } from "../../../video/lib/paths.mjs";

export const id = "geo";
export const label = "Geo flythrough";
export const license = "OpenStreetMap-derived tiles — attribution required, see the clip's .credits.txt";
export const keyEnv = [];
/** Free and keyless. MAPILLARY_TOKEN only adds an optional street-level leg. */
export const hasKey = () => true;

const COORDS = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function cacheDir() {
  return path.resolve(optionalEnv("GEO_CACHE_DIR") || path.join(KIT_ROOT, ".cache", "geo"));
}

/** Everything that changes the pixels goes in the hash, so a settings change re-renders. */
function cacheKey(spec) {
  const shape = JSON.stringify({
    spec,
    seconds: optionalEnv("GEO_CLIP_SECONDS", "8"),
    zooms: optionalEnv("GEO_ZOOM_STEPS", "3,6,11,16"),
    wide: optionalEnv("GEO_TILE_WIDE", "carto-dark"),
    close: optionalEnv("GEO_TILE_CLOSE", "esri-satellite"),
    street: optionalEnv("GEO_STREET", "3"),
    hasMapillary: Boolean(optionalEnv("MAPILLARY_TOKEN")),
  });
  return crypto.createHash("sha1").update(shape).digest("hex").slice(0, 16);
}

/**
 * Build (or reuse) the clip for one place.
 * @param {string} spec  "lat,lng" or a place name to geocode
 */
function build(spec) {
  const dir = cacheDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${cacheKey(spec)}.mp4`);
  const creditsFile = file.replace(/\.mp4$/, "") + ".credits.txt";

  if (!fs.existsSync(file)) {
    const args = [
      path.join(KIT_ROOT, "scripts", "video", "geo-flythrough.mjs"),
      "--out", file,
      "--seconds", optionalEnv("GEO_CLIP_SECONDS", "8"),
    ];
    const m = spec.match(COORDS);
    if (m) args.push("--lat", m[1], "--lng", m[2]);
    else args.push("--place", spec);

    // stderr inherited: the flythrough reports what it is fetching, whether street-level
    // coverage exists, and whether it could draw the attribution. None of that should
    // disappear inside somebody else's render.
    const r = spawnSync(process.execPath, args, { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });
    if (r.status !== 0 || !fs.existsSync(file)) {
      throw new Error(`geo-flythrough failed for "${spec}" (exit ${r.status}).`);
    }
  }

  const credits = fs.existsSync(creditsFile)
    ? fs.readFileSync(creditsFile, "utf8").trim().split(/\r?\n/).filter(Boolean).join(" · ")
    : license;

  const [lat, lng] = spec.match(COORDS)?.slice(1) ?? [];
  return {
    id: spec,
    width: 1080,
    height: 1920,
    duration: Number(optionalEnv("GEO_CLIP_SECONDS", "8")),
    author: "OpenStreetMap contributors",
    authorUrl: "https://www.openstreetmap.org/copyright",
    pageUrl: lat
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(spec)}`,
    // A local path, not a URL. normalize.mjs `download()` copies these rather than fetching
    // them — Node's fetch refuses file:// and local paths outright.
    fileUrl: file,
    tags: `map, satellite, street level, ${spec}`,
    source: id,
    // The real per-source credits, so media-lock.json records exactly what has to stay
    // visible in anything published from this render.
    license: credits,
  };
}

/** Geocoded by the flythrough script; one place is one candidate, so there is nothing to rank. */
export async function search(query) {
  if (!query) throw new Error(`source "geo" needs a place name or "lat,lng".`);
  return [build(String(query))];
}

export async function byId(ref) {
  return build(String(ref));
}
