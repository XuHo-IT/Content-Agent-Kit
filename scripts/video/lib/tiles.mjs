// tiles.mjs — slippy-map maths and the free raster tile registry.
//
// Split out from geo-flythrough.mjs because this is the part that is worth testing without
// a network: the Web Mercator projection is four lines that are wrong in ways you cannot
// see. A map centred one tile off still looks like a map.
//
// A source is DATA plus one url function — same shape as the TTS provider registry and the
// stock-source registry, so adding one is a block here and nothing else.
//
// EVERY SOURCE IS FREE AND KEYLESS. That is the point of this file. Attribution, however,
// is NOT optional: unlike a Google static image, a raster tile arrives with no credit baked
// in, so the caller must draw one. Each entry carries the exact string its licence requires.

/** Longitude -> fractional tile X at zoom z. */
export const lon2tileX = (lon, z) => ((lon + 180) / 360) * 2 ** z;

/**
 * Latitude -> fractional tile Y at zoom z.
 *
 * `asinh(tan φ)` is the Mercator y, and is the same quantity as the `ln(tan φ + sec φ)`
 * written in most references — this form is one call and has no cancellation near the
 * equator. Latitudes beyond ±85.0511° are outside the projection entirely.
 */
export const lat2tileY = (lat, z) =>
  ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z;

/** X wraps around the world; Y does not — it runs out at the poles. */
export const wrapX = (x, z) => ((x % 2 ** z) + 2 ** z) % 2 ** z;
export const inRangeY = (y, z) => y >= 0 && y < 2 ** z;

export const TILE_SOURCES = {
  "carto-dark": {
    label: "CARTO Dark Matter",
    size: 512,
    maxZoom: 20,
    url: (z, x, y) => `https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png`,
    attribution: "© OpenStreetMap contributors © CARTO",
    note: "Dark basemap. The default wide shot — it suits this kit's dark templates, and @2x tiles mean a quarter as many requests.",
  },
  "carto-light": {
    label: "CARTO Positron",
    size: 512,
    maxZoom: 20,
    url: (z, x, y) => `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}@2x.png`,
    attribution: "© OpenStreetMap contributors © CARTO",
    note: "Light basemap. Pair with a paper-* theme.",
  },
  "carto-voyager": {
    label: "CARTO Voyager",
    size: 512,
    maxZoom: 20,
    url: (z, x, y) => `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png`,
    attribution: "© OpenStreetMap contributors © CARTO",
    note: "More colour and more labels than Positron.",
  },
  osm: {
    label: "OpenStreetMap standard",
    size: 256,
    maxZoom: 19,
    url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    attribution: "© OpenStreetMap contributors",
    // Their words, and they mean them: the OSMF runs the standard layer on donated
    // hardware. A daily video is nowhere near "heavy", but this is not a CDN to point a
    // batch job at, and the policy requires an identifying User-Agent — which is why
    // RESEARCH_USER_AGENT exists rather than a default library string.
    policy: "https://operations.osmfoundation.org/policies/tiles/",
    note: "The OSMF's own servers. Fine for a video a day; NOT for bulk rendering. Read the tile usage policy before scaling up.",
  },
  "esri-satellite": {
    label: "Esri World Imagery",
    size: 256,
    maxZoom: 19,
    // NOTE THE ORDER: Esri's REST path is {z}/{row}/{col}, i.e. y BEFORE x. Every other
    // source here is {z}/{x}/{y}. Getting this backwards returns a valid-looking tile of
    // somewhere else entirely, which is the hardest kind of wrong to notice.
    url: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    note: "Real satellite imagery. The default close-up — this is what replaces a Google satellite still.",
  },
  opentopo: {
    label: "OpenTopoMap",
    size: 256,
    maxZoom: 17,
    url: (z, x, y) => `https://a.tile.opentopomap.org/${z}/${x}/${y}.png`,
    attribution: "© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)",
    note: "Terrain and contours. Good for a forest, a mountain or a pass.",
  },
};

export const TILE_SOURCE_IDS = Object.keys(TILE_SOURCES);

export function getTileSource(id) {
  const s = TILE_SOURCES[String(id || "").toLowerCase()];
  if (!s) throw new Error(`Unknown tile source "${id}". Known: ${TILE_SOURCE_IDS.join(" | ")}.`);
  return s;
}

/**
 * How many tiles to stitch for one still.
 *
 * Fixed per tile size rather than derived from the output resolution, because the derived
 * version asks for 5×8 = 40 tiles at 256px — a request count that is rude to a donated
 * tile server and slow for no visible gain once Ken Burns has cropped into it anyway.
 *
 *   512px (@2x): 3×4 = 1536×2048, twelve requests, DOWNsampled into 1080×1920
 *   256px:       3×5 =  768×1280, fifteen requests, upscaled 1.5× — the same upscale the
 *                Google static image was getting, so no worse than before
 */
export function gridFor(size, override = null) {
  if (override) {
    const m = String(override).match(/^(\d+)\s*[x×]\s*(\d+)$/i);
    if (!m) throw new Error(`GEO_GRID must look like "3x5", got "${override}"`);
    return { cols: Number(m[1]), rows: Number(m[2]) };
  }
  return size >= 512 ? { cols: 3, rows: 4 } : { cols: 3, rows: 5 };
}

/**
 * Which tiles cover a `cols × rows` image centred on (lat, lng), and where the point lands
 * inside the stitched result.
 *
 * @returns {{ tiles: {x:number,y:number,col:number,row:number,missing:boolean}[],
 *             width:number, height:number, centerX:number, centerY:number, zoom:number }}
 */
export function tileGrid({ lat, lng, zoom, size, cols, rows }) {
  const z = Math.max(0, Math.min(zoom, 22));
  const n = 2 ** z;

  // Centre in whole-world pixel space, then the top-left corner of the window we want.
  const cx = lon2tileX(lng, z) * size;
  const cy = lat2tileY(lat, z) * size;
  const width = cols * size;
  const height = rows * size;

  // Anchor the window on tile boundaries so the stitch is a plain grid; the point then
  // sits wherever it sits inside it, and the crop step re-centres on it.
  const x0 = Math.floor(cx / size) - Math.floor(cols / 2);
  const y0 = Math.floor(cy / size) - Math.floor(rows / 2);

  const tiles = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ty = y0 + row;
      tiles.push({
        x: wrapX(x0 + col, z),
        y: ty,
        col,
        row,
        // Past the poles there is no tile. A blank stands in rather than the whole still
        // failing — at zoom 3 a portrait window genuinely runs off the top of the world.
        missing: !inRangeY(ty, z),
      });
    }
  }

  return {
    tiles,
    width,
    height,
    centerX: cx - x0 * size,
    centerY: cy - y0 * size,
    zoom: z,
  };
}

/** The largest 9:16-ish window inside the stitched image, centred on the point. */
export function cropWindow({ width, height, centerX, centerY, aspectW = 9, aspectH = 16 }) {
  let w = width;
  let h = Math.round((width * aspectH) / aspectW);
  if (h > height) {
    h = height;
    w = Math.round((height * aspectW) / aspectH);
  }
  // h264 needs even dimensions; an odd crop fails at encode time, not here.
  w -= w % 2;
  h -= h % 2;
  const x = Math.max(0, Math.min(Math.round(centerX - w / 2), width - w));
  const y = Math.max(0, Math.min(Math.round(centerY - h / 2), height - h));
  return { w, h, x: x - (x % 2), y: y - (y % 2) };
}
