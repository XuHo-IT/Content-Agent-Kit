// geo-flythrough.mjs — a 9:16 hook clip that falls out of the sky onto a real place.
//   node scripts/video/geo-flythrough.mjs --place "Aokigahara, Japan" --out brain/x/geo.mp4
//   node scripts/video/geo-flythrough.mjs --lat 35.4694 --lng 138.6206 --out geo.mp4
//   node scripts/video/geo-flythrough.mjs --place "Hồ Tây, Hà Nội" --dry-run   # what it will fetch
//
// World map -> region -> city -> satellite close-up -> street-level, each still given a slow
// Ken Burns push and cross-faded into the next. Prints GEO=<path>.
//
// FREE AND KEYLESS. Map stills are stitched from OpenStreetMap-derived raster tiles (CARTO,
// Esri World Imagery, OpenTopoMap); geocoding is Nominatim. Nothing here needs an account
// and nothing here is billed. The optional street-level leg uses Mapillary, whose token is
// also free.
//
// WHY STITCHED TILES: there is no free static-map API worth depending on, and no API at all
// renders a video flythrough. Tiles are the raw material every map on the web is made of,
// the maths is public, and stitching them is a dozen requests and an ffmpeg filtergraph.
//
// ⚠️ ATTRIBUTION IS A LICENCE CONDITION AND IS **NOT** BAKED INTO A TILE. Unlike a Google
// static image, a raster tile arrives with no credit on it, so this script draws one itself
// onto every still. If no usable font is found it says so loudly and prints the exact string
// you must put on screen instead. Do not publish these frames without it.
//
// ENV: GEO_TILE_WIDE, GEO_TILE_CLOSE, GEO_ZOOM_STEPS, GEO_GRID, GEO_FONT,
//      GEO_STREET, MAPILLARY_TOKEN, RESEARCH_USER_AGENT
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { optionalEnv } from "../lib/env.mjs";
import { run } from "./lib/proc.mjs";
import { concatWithTransitions, transitionPlan } from "./lib/ffmpeg-video.mjs";
import { TILE_SOURCE_IDS, getTileSource, gridFor, tileGrid, cropWindow } from "./lib/tiles.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `geo-flythrough.mjs — build a map-to-street hook clip for one real location (free, no keys)\n` +
      `  --place "<name>"     geocoded via Nominatim (or pass --lat/--lng)\n` +
      `  --lat <n> --lng <n>  exact coordinates, skips geocoding\n` +
      `  --out <file.mp4>     output path (required unless --dry-run)\n` +
      `  --seconds <n>        total clip length (default 7)\n` +
      `  --zooms <a,b,c>      map zoom levels (default $GEO_ZOOM_STEPS or 3,6,11,16)\n` +
      `  --tiles-wide <id>    source for the far shots (default $GEO_TILE_WIDE or carto-dark)\n` +
      `  --tiles-close <id>   source for zoom>=10  (default $GEO_TILE_CLOSE or esri-satellite)\n` +
      `                       known: ${TILE_SOURCE_IDS.join(" | ")}\n` +
      `  --grid <CxR>         tiles per still (default 3x4 for @2x sources, 3x5 for 256px)\n` +
      `  --street <n>         Mapillary street-level images to append (needs MAPILLARY_TOKEN)\n` +
      `  --no-street          map stills only\n` +
      `  --label "<text>"     name drawn on the closest still\n` +
      `  --width/--height     output size (default 1080x1920)\n` +
      `  --font <path>        TTF for the attribution line (autodetected otherwise)\n` +
      `  --keep-frames        leave the stitched stills next to the output\n` +
      `  --sources            list the tile sources and exit\n` +
      `  --dry-run            print what it would fetch, fetch nothing\n` +
      `env: GEO_TILE_WIDE, GEO_TILE_CLOSE, GEO_ZOOM_STEPS, GEO_GRID, GEO_FONT, GEO_STREET,\n` +
      `     MAPILLARY_TOKEN (optional), RESEARCH_USER_AGENT`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const has = (n) => argv.includes(n);

if (has("--sources")) {
  console.log(`[geo] tile sources — all free, all keyless:\n`);
  for (const id of TILE_SOURCE_IDS) {
    const s = getTileSource(id);
    console.log(`  ${id.padEnd(16)} ${String(s.size + "px").padEnd(6)} z<=${String(s.maxZoom).padEnd(3)} ${s.label}`);
    console.log(`  ${" ".repeat(16)} ${s.attribution}`);
    if (s.policy) console.log(`  ${" ".repeat(16)} usage policy: ${s.policy}`);
    console.log(`  ${" ".repeat(16)} ${s.note}\n`);
  }
  process.exit(0);
}

const UA = () =>
  optionalEnv("RESEARCH_USER_AGENT", "content-agent-kit/1.0 (+https://github.com/XuHo-IT/Content-Agent-Kit)");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchImage(url, outPath) {
  const res = await fetch(url, { headers: { "user-agent": UA() }, signal: AbortSignal.timeout(30000) });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) {
    const body = (await res.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200);
    throw new Error(`${url.slice(0, 90)} -> HTTP ${res.status} (${type || "no type"}): ${body}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  // Check the magic bytes, not the length. An empty-ocean tile is a solid colour and
  // compresses to ~126 bytes of entirely valid PNG — a size floor rejects real tiles.
  const png = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const jpg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const webp = buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
  if (!png && !jpg && !webp) {
    throw new Error(`${url.slice(0, 90)} returned ${buf.length} bytes that are not PNG/JPEG/WebP`);
  }
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

/** Keyless, and the only geocoder here. Their policy requires an identifying User-Agent. */
async function geocode(place) {
  const u = new URL("https://nominatim.openstreetmap.org/search");
  u.searchParams.set("q", place);
  u.searchParams.set("format", "json");
  u.searchParams.set("limit", "1");
  const r = await fetch(u.href, { headers: { "user-agent": UA() }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Nominatim HTTP ${r.status}`);
  const j = await r.json();
  if (!j?.[0]) throw new Error(`Could not geocode "${place}". Pass --lat and --lng instead.`);
  return { lat: Number(j[0].lat), lng: Number(j[0].lon), name: j[0].display_name, via: "nominatim" };
}

/**
 * Street-level imagery from Mapillary — the crowd-sourced, CC-BY-SA answer to Street View.
 *
 * ⚠️ WRITTEN FROM THE DOCS, NOT RUN AGAINST A LIVE ACCOUNT. The token is free but needs a
 * signup this kit cannot do for you. If the response shape has drifted, the leg is skipped
 * with the error printed rather than failing the clip — which is also what happens, quite
 * normally, when a place simply has no street-level coverage.
 */
async function mapillaryNear(lat, lng, token, limit, radiusDeg = 0.0015) {
  const bbox = [lng - radiusDeg, lat - radiusDeg, lng + radiusDeg, lat + radiusDeg].join(",");
  const u = new URL("https://graph.mapillary.com/images");
  u.searchParams.set("access_token", token);
  u.searchParams.set("fields", "id,thumb_2048_url,captured_at,compass_angle");
  u.searchParams.set("bbox", bbox);
  u.searchParams.set("limit", String(Math.max(1, limit) * 3));
  const r = await fetch(u.href, { headers: { "user-agent": UA() }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`Mapillary HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 160)}`);
  const j = await r.json();
  const items = (j?.data ?? []).filter((d) => d?.thumb_2048_url);
  // Spread the picks by compass angle so three images are three directions, not three
  // frames of one car driving down one street.
  items.sort((a, b) => (a.compass_angle ?? 0) - (b.compass_angle ?? 0));
  const step = Math.max(1, Math.floor(items.length / limit));
  return items.filter((_, i) => i % step === 0).slice(0, limit);
}

/** A TTF ffmpeg can actually open. Without one the attribution cannot be burned in. */
function findFont() {
  const explicit = flag("--font", optionalEnv("GEO_FONT"));
  if (explicit) return fs.existsSync(explicit) ? explicit : null;
  const candidates = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
  ];
  return candidates.find((f) => fs.existsSync(f)) ?? null;
}

/** ffmpeg filter syntax eats `:` `\` and `'`; a Windows font path contains two of them. */
const escFilterPath = (p) => p.replace(/\\/g, "/").replace(/:/g, "\\:");
const escText = (t) => String(t).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\u2019");

/**
 * Stitch one grid of tiles into a single still and crop it to 9:16 around the point.
 *
 * hstack per row then vstack, rather than one xstack, because xstack wants an explicit
 * layout string whose arithmetic is exactly the thing that would be wrong silently.
 *
 * NOTE: the attribution is deliberately NOT drawn here. See kenBurns().
 */
async function stitch({ tiles, files, cols, rows, size, crop, outPath, font, label }) {
  const inputs = [];
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].missing) {
      // Past the poles. A flat tile keeps the grid rectangular so the filtergraph is uniform.
      inputs.push("-f", "lavfi", "-i", `color=c=0x101014:s=${size}x${size}`);
    } else {
      inputs.push("-i", files[i]);
    }
  }

  const parts = [];
  for (let r = 0; r < rows; r++) {
    const row = Array.from({ length: cols }, (_, c) => `[${r * cols + c}:v]`).join("");
    parts.push(cols === 1 ? `${row}null[r${r}]` : `${row}hstack=inputs=${cols}[r${r}]`);
  }
  const rowsRef = Array.from({ length: rows }, (_, r) => `[r${r}]`).join("");
  parts.push(rows === 1 ? `${rowsRef}null[grid]` : `${rowsRef}vstack=inputs=${rows}[grid]`);
  parts.push(`[grid]crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}[cropped]`);

  let last = "cropped";
  if (font && label) {
    const fs_ = Math.max(13, Math.round(crop.w / 52));
    parts.push(
      `[${last}]drawtext=fontfile='${escFilterPath(font)}':text='${escText(label)}':` +
        `fontcolor=white:fontsize=${Math.round(fs_ * 1.9)}:` +
        // 0.65, not 0.5: at 0.5 the plate vanishes over bright satellite imagery, which is
        // exactly where the name is hardest to read. Checked on a rooftop-level tile.
        `box=1:boxcolor=black@0.65:boxborderw=${Math.round(fs_ * 0.6)}:` +
        // 0.62 rather than lower down: the Ken Burns push crops toward the centre, and
        // anything below ~0.72 leaves the frame before the clip ends.
        `x=(w-text_w)/2:y=h*0.62[labelled]`,
    );
    last = "labelled";
  }
  parts.push(`[${last}]format=rgb24[out]`);

  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    ...inputs,
    "-filter_complex", parts.join(";"),
    "-map", "[out]",
    "-frames:v", "1",
    outPath,
  ]);
}

/**
 * One still -> one clip with a slow push, then the attribution.
 *
 * `-loop 1 -t` plus `d=1` means one output frame per input frame and `on` counts them,
 * which makes the zoom a plain linear function of time rather than an accumulator that
 * drifts with the frame rate. The input is pre-scaled to 2x the output and centre-cropped
 * BEFORE zoompan so the filter zooms into real pixels and its virtual canvas already has
 * the output's aspect ratio — zoompan centres on its own canvas, and handing it a square
 * while asking for a 9:16 window puts the subject off screen.
 *
 * THE ATTRIBUTION IS DRAWN AFTER THE ZOOM, NOT BEFORE. Burning it into the still first is
 * the obvious way round and it is wrong: zoompan crops toward the centre, so a 1.16x push
 * eats the bottom 8% of the frame — exactly the band the credit sits in. The credit was
 * therefore visible at the start of each clip and gone by the end, which for a licence
 * condition is the same as absent. Drawn here it is fixed on screen for the whole clip,
 * and rendered once at final resolution instead of being upscaled with the imagery.
 */
async function kenBurns(still, outPath, { seconds, width, height, fps, direction, attribution, font }) {
  const frames = Math.max(2, Math.round(seconds * fps));
  const amount = 0.16;
  const z =
    direction === "out" ? `${(1 + amount).toFixed(3)}-${amount}*on/${frames}` : `1+${amount}*on/${frames}`;

  const chain = [
    `scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase`,
    `crop=${width * 2}:${height * 2}`,
    `zoompan=z='${z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps}`,
  ];

  if (font && attribution) {
    const fs_ = Math.max(15, Math.round(width / 46));
    const band = Math.round(fs_ * 2.4);
    // A scrim under the credit: tile imagery is arbitrary, and white text on a snow field
    // is an attribution nobody can read — which is the same as no attribution.
    chain.push(`drawbox=x=0:y=ih-${band}:w=iw:h=${band}:color=black@0.5:t=fill`);
    // `h`, not `ih`: drawtext's expression vocabulary is w/h/text_w/text_h. `ih` belongs to
    // drawbox and crop, and drawtext rejects it outright rather than ignoring it.
    chain.push(
      `drawtext=fontfile='${escFilterPath(font)}':text='${escText(attribution)}':` +
        `fontcolor=white@0.94:fontsize=${fs_}:x=${Math.round(fs_ * 0.7)}:y=h-${Math.round(fs_ * 1.72)}`,
    );
  }
  chain.push("format=yuv420p");

  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-loop", "1",
    "-framerate", String(fps),
    "-t", seconds.toFixed(3),
    "-i", still,
    "-vf", chain.join(","),
    "-c:v", "libx264", "-preset", "fast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", String(fps), "-an",
    outPath,
  ]);
}

try {
  const place = flag("--place");
  const latArg = flag("--lat");
  const lngArg = flag("--lng");
  if (!place && !(latArg && lngArg)) throw new Error(`Pass --place "<name>" or both --lat and --lng.`);

  const out = flag("--out");
  const dryRun = has("--dry-run");
  if (!out && !dryRun) throw new Error(`Pass --out <file.mp4>.`);

  const width = Number(flag("--width", "1080"));
  const height = Number(flag("--height", "1920"));
  const fps = 30;
  const total = Number(flag("--seconds", "7"));
  const label = flag("--label", "");

  const zooms = String(flag("--zooms", optionalEnv("GEO_ZOOM_STEPS", "3,6,11,16")))
    .split(",")
    .map((z) => Number(z.trim()))
    .filter((z) => Number.isFinite(z) && z >= 0 && z <= 22);
  if (zooms.length === 0) throw new Error(`--zooms must name at least one zoom level (0–22).`);

  const wideId = flag("--tiles-wide", optionalEnv("GEO_TILE_WIDE", "carto-dark"));
  const closeId = flag("--tiles-close", optionalEnv("GEO_TILE_CLOSE", "esri-satellite"));
  getTileSource(wideId);
  getTileSource(closeId);

  const streetCount = has("--no-street") ? 0 : Number(flag("--street", optionalEnv("GEO_STREET", "3")));
  const mapillaryToken = optionalEnv("MAPILLARY_TOKEN");

  const point =
    latArg && lngArg
      ? { lat: Number(latArg), lng: Number(lngArg), name: place || `${latArg},${lngArg}`, via: "given" }
      : await geocode(place);
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) throw new Error(`Bad coordinates for "${place}".`);

  console.error(`[geo] ${point.name}`);
  console.error(`[geo] ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}  (${point.via})`);

  // ── plan the stills ───────────────────────────────────────────────────────
  const shots = zooms.map((zoom) => {
    const src = getTileSource(zoom >= 10 ? closeId : wideId);
    const zoomUsed = Math.min(zoom, src.maxZoom);
    const { cols, rows } = gridFor(src.size, flag("--grid", optionalEnv("GEO_GRID")));
    const grid = tileGrid({ lat: point.lat, lng: point.lng, zoom: zoomUsed, size: src.size, cols, rows });
    return {
      kind: "map",
      name: `map-z${zoomUsed}`,
      zoom: zoomUsed,
      src,
      srcId: zoom >= 10 ? closeId : wideId,
      cols,
      rows,
      grid,
      crop: cropWindow(grid),
    };
  });

  const tileCount = shots.reduce((n, s) => n + s.grid.tiles.filter((t) => !t.missing).length, 0);

  if (dryRun) {
    console.log(`[geo] ${shots.length} map still(s) for "${point.name}":\n`);
    for (const s of shots) {
      const live = s.grid.tiles.filter((t) => !t.missing).length;
      console.log(
        `  ${s.name.padEnd(10)} ${s.srcId.padEnd(16)} ${s.cols}x${s.rows} = ${String(live).padStart(2)} tiles` +
          `  ${s.grid.width}x${s.grid.height} -> crop ${s.crop.w}x${s.crop.h}`,
      );
      console.log(`  ${" ".repeat(10)} ${s.src.url(s.zoom, s.grid.tiles[0].x, Math.max(0, s.grid.tiles[0].y))}`);
      console.log(`  ${" ".repeat(10)} ${s.src.attribution}`);
    }
    console.log(`\n  ${tileCount} tile request(s) total.  COST: $0 — every source here is free and keyless.`);
    if (streetCount > 0) {
      console.log(
        mapillaryToken
          ? `  + up to ${streetCount} Mapillary street-level image(s) (free token present).`
          : `  street-level: skipped — no MAPILLARY_TOKEN. Free at mapillary.com; --no-street silences this.`,
      );
    }
    const font = findFont();
    console.log(
      font
        ? `  attribution will be drawn with ${font}`
        : `  ⚠ NO FONT FOUND — attribution cannot be burned in. Set GEO_FONT or --font.`,
    );
    for (const s of new Set(shots.map((x) => x.src))) {
      if (s.policy) console.log(`  ⚠ ${s.label} usage policy: ${s.policy}`);
    }
    console.log(`  --dry-run: nothing fetched.`);
    process.exit(0);
  }

  const outPath = path.resolve(out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const workDir = has("--keep-frames")
    ? path.join(path.dirname(outPath), "geo-frames")
    : fs.mkdtempSync(path.join(os.tmpdir(), "geo-"));
  fs.mkdirSync(workDir, { recursive: true });

  const font = findFont();
  if (!font) {
    console.error(
      `[geo] ⚠ NO USABLE FONT FOUND — the attribution line cannot be drawn onto the stills.\n` +
        `[geo]   Attribution is a LICENCE CONDITION of every source here, so you must put it\n` +
        `[geo]   on screen yourself, in the scene's own text:\n` +
        `[geo]     ${[...new Set(shots.map((s) => s.src.attribution))].join("  ·  ")}\n` +
        `[geo]   Or point --font / GEO_FONT at a .ttf and it will be burned in for you.`,
    );
  }

  // ── fetch + stitch ────────────────────────────────────────────────────────
  console.error(`[geo] fetching ${tileCount} tile(s) — free, no key`);
  const stills = [];
  for (const shot of shots) {
    const files = [];
    for (const t of shot.grid.tiles) {
      if (t.missing) {
        files.push(null);
        continue;
      }
      const f = path.join(workDir, `t-${shot.name}-${t.col}-${t.row}.img`);
      await fetchImage(shot.src.url(shot.zoom, t.x, t.y), f);
      files.push(f);
      // Deliberate: these are donated / free-tier servers, not a CDN to hammer.
      await sleep(80);
    }

    const still = path.join(workDir, `${shot.name}.png`);
    await stitch({
      tiles: shot.grid.tiles,
      files,
      cols: shot.cols,
      rows: shot.rows,
      size: shot.src.size,
      crop: shot.crop,
      outPath: still,
      font,
      // Name the place only once, on the closest shot — earlier it is unreadable clutter.
      label: shot === shots[shots.length - 1] ? label : "",
    });
    console.error(`[geo]   ${shot.name.padEnd(10)} ${shot.srcId}`);
    stills.push({ file: still, attribution: shot.src.attribution });
  }

  // ── optional street level ─────────────────────────────────────────────────
  if (streetCount > 0 && mapillaryToken) {
    try {
      const found = await mapillaryNear(point.lat, point.lng, mapillaryToken, streetCount);
      if (found.length === 0) {
        console.error(`[geo] street level: no Mapillary coverage here — map stills only`);
      }
      for (const [i, img] of found.entries()) {
        const f = path.join(workDir, `street-${i}.jpg`);
        await fetchImage(img.thumb_2048_url, f);
        stills.push({ file: f, attribution: "Street-level imagery © Mapillary contributors (CC BY-SA)" });
        console.error(`[geo]   street-${i}  ${img.captured_at ?? ""}`);
      }
    } catch (e) {
      // Never fatal: no coverage and a drifted API shape both mean "no street leg".
      console.error(`[geo] street level: skipped (${e.message.slice(0, 120)})`);
    }
  } else if (streetCount > 0) {
    console.error(`[geo] street level: skipped — no MAPILLARY_TOKEN (free at mapillary.com)`);
  }

  if (stills.length === 0) throw new Error(`No stills were produced.`);

  // ── ken burns + join ──────────────────────────────────────────────────────
  // Never below the time an eye needs to register a frame: a 7s clip over 7 stills is a
  // slideshow nobody can read.
  const per = Math.max(1.1, total / stills.length);
  const fade = Math.min(0.35, per / 3);

  console.error(`[geo] ${stills.length} clip(s) x ${per.toFixed(2)}s`);
  const clips = [];
  for (const [i, s] of stills.entries()) {
    const clip = path.join(workDir, `clip-${String(i).padStart(2, "0")}.mp4`);
    await kenBurns(s.file, clip, {
      seconds: per + (i < stills.length - 1 ? fade : 0), // padded for the overlap that follows
      width, height, fps,
      direction: i % 2 === 0 ? "in" : "out",
      attribution: s.attribution,
      font,
    });
    clips.push(clip);
  }

  if (clips.length === 1) {
    fs.copyFileSync(clips[0], outPath);
  } else {
    const base = clips.map(() => per);
    const secs = base.slice(0, -1).map(() => fade);
    const { offsets } = transitionPlan(base, secs);
    // `kinds` takes the KIT's names, not ffmpeg's — transitionGraph does the lookup itself.
    // Passing `TRANSITIONS.fade` worked only because that one maps to the identical ffmpeg
    // name; `TRANSITIONS.iris` would have looked up TRANSITIONS["circleopen"] and thrown.
    await concatWithTransitions(clips, outPath, { offsets, kinds: secs.map(() => "fade"), secs, fps });
  }

  if (!has("--keep-frames")) fs.rmSync(workDir, { recursive: true, force: true });

  const credits = [...new Set(stills.map((s) => s.attribution))];
  fs.writeFileSync(outPath.replace(/\.mp4$/, "") + ".credits.txt", credits.join("\n") + "\n", "utf8");

  console.error(`[geo] ✓ ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)}MB`);
  console.error(`[geo] credits: ${credits.join(" · ")}`);
  console.log(`GEO=${outPath}`);
} catch (e) {
  console.error(`[geo] ✗ ${e.message}`);
  process.exit(1);
}
