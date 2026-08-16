// tiles.test.mjs — the slippy-map projection, offline.
//
// This is the code most worth testing and least likely to announce a mistake: a map centred
// one tile off still looks exactly like a map, and satellite imagery of the wrong suburb
// looks exactly like satellite imagery. Every case below is hand-checkable against the OSM
// slippy-map spec rather than against this implementation's own output.
import test from "node:test";
import assert from "node:assert/strict";
import {
  lon2tileX,
  lat2tileY,
  wrapX,
  inRangeY,
  TILE_SOURCES,
  TILE_SOURCE_IDS,
  getTileSource,
  gridFor,
  tileGrid,
  cropWindow,
} from "../scripts/video/lib/tiles.mjs";

const tx = (lon, z) => Math.floor(lon2tileX(lon, z));
const ty = (lat, z) => Math.floor(lat2tileY(lat, z));

test("the projection matches the canonical slippy-map cases", () => {
  assert.deepEqual([tx(-0.12, 0), ty(51.5, 0)], [0, 0], "zoom 0 is one tile");
  assert.deepEqual([tx(0, 1), ty(0, 1)], [1, 1], "null island at z1");
  assert.deepEqual([tx(0, 2), ty(0, 2)], [2, 2], "null island at z2");
  assert.equal(tx(-180, 2), 0, "the antimeridian is the left edge");
  assert.equal(ty(85.0511, 2), 0, "the top of the projection");
  assert.equal(Math.min(3, ty(-85.0511, 2)), 3, "the bottom of the projection");
});

test("latitude is Mercator, not linear", () => {
  // A linear stand-in for asinh(tan φ) passes every equator-only check and is wrong
  // everywhere else — which on a video means the marker drifts as you move north.
  //
  // The expected number is analytic, not read off this implementation:
  //   asinh(tan 30°) = ln(1.73205…) = 0.549306
  //   asinh(tan 60°) = ln(3.73205…) = 1.316958
  //   (1.316958 - 0.549306) / 0.549306 = 1.39749
  // A linear projection would give exactly 1.
  const near = lat2tileY(0, 8) - lat2tileY(30, 8);
  const far = lat2tileY(30, 8) - lat2tileY(60, 8);
  assert.ok(Math.abs(far / near - 1.39749) < 0.001, `Mercator stretch ratio was ${(far / near).toFixed(5)}`);
});

test("longitude is exactly linear", () => {
  const step1 = lon2tileX(30, 8) - lon2tileX(0, 8);
  const step2 = lon2tileX(60, 8) - lon2tileX(30, 8);
  assert.ok(Math.abs(step1 - step2) < 1e-9, `longitude steps differed: ${step1} vs ${step2}`);
});

test("x wraps around the world and y does not", () => {
  assert.equal(wrapX(-1, 3), 7, "one tile west of the antimeridian is the far east");
  assert.equal(wrapX(8, 3), 0);
  assert.equal(wrapX(3, 3), 3);
  assert.equal(inRangeY(-1, 3), false, "there is no tile above the north pole");
  assert.equal(inRangeY(8, 3), false);
  assert.equal(inRangeY(0, 3), true);
});

test("Esri's tile path is row/col — every other source is x/y", () => {
  // Swapping these returns a perfectly valid tile of somewhere else entirely, which is the
  // hardest kind of wrong to notice. Pinning it here so a tidy-up cannot quietly align them.
  const esri = getTileSource("esri-satellite").url(11, 329, 792);
  assert.ok(esri.endsWith("/11/792/329"), `Esri url must be z/y/x, got ${esri}`);
  const osm = getTileSource("osm").url(11, 329, 792);
  assert.ok(osm.endsWith("/11/329/792.png"), `OSM url must be z/x/y, got ${osm}`);
});

test("every tile source declares what a publisher needs", () => {
  for (const id of TILE_SOURCE_IDS) {
    const s = TILE_SOURCES[id];
    assert.ok(s.attribution?.trim(), `${id} has no attribution string — it is a licence condition`);
    assert.ok(typeof s.size === "number" && s.size > 0, `${id} has no tile size`);
    assert.ok(typeof s.maxZoom === "number", `${id} has no maxZoom`);
    assert.equal(typeof s.url, "function", `${id} has no url builder`);
    assert.ok(s.label?.trim() && s.note?.trim(), `${id} is undocumented`);
  }
});

test("an unknown tile source names the ones that exist", () => {
  assert.throws(() => getTileSource("google"), /Unknown tile source .*carto-dark/s);
});

test("the grid is smaller for @2x sources, and overridable", () => {
  assert.deepEqual(gridFor(512), { cols: 3, rows: 4 }, "12 requests, downsampled into frame");
  assert.deepEqual(gridFor(256), { cols: 3, rows: 5 }, "15 requests, the same 1.5x upscale as before");
  assert.deepEqual(gridFor(256, "4x6"), { cols: 4, rows: 6 });
  assert.throws(() => gridFor(256, "lots"), /GEO_GRID/);
});

test("a grid is centred on its point", () => {
  const g = tileGrid({ lat: 37.3184, lng: -121.9511, zoom: 16, size: 256, cols: 3, rows: 5 });
  assert.equal(g.tiles.length, 15);
  assert.equal(g.width, 768);
  assert.equal(g.height, 1280);
  // The point must land inside the stitched image, near the middle of it.
  assert.ok(g.centerX > 0 && g.centerX < g.width, `centerX ${g.centerX} outside the image`);
  assert.ok(g.centerY > 0 && g.centerY < g.height, `centerY ${g.centerY} outside the image`);
  assert.ok(Math.abs(g.centerX - g.width / 2) < 256, "point should be within a tile of centre");
  assert.ok(Math.abs(g.centerY - g.height / 2) < 256, "point should be within a tile of centre");
});

test("a portrait window near the pole runs off the world and says so", () => {
  // At zoom 3 the world is only 8 tiles tall, so a 5-row window centred high up genuinely
  // has no tile for some rows. They must be flagged, not silently requested and 404'd.
  const g = tileGrid({ lat: 78, lng: 15, zoom: 3, size: 256, cols: 3, rows: 5 });
  assert.ok(g.tiles.some((t) => t.missing), "expected some rows past the top of the projection");
  for (const t of g.tiles) {
    if (!t.missing) assert.ok(t.y >= 0 && t.y < 8, `live tile y=${t.y} is out of range at z3`);
  }
});

test("x still wraps when the window straddles the antimeridian", () => {
  const g = tileGrid({ lat: 0, lng: 179.9, zoom: 3, size: 256, cols: 3, rows: 5 });
  for (const t of g.tiles) assert.ok(t.x >= 0 && t.x < 8, `x=${t.x} is not a real tile index at z3`);
  assert.ok(new Set(g.tiles.map((t) => t.x)).size > 1, "the window should span more than one column");
});

test("the crop is 9:16, even-sided, and inside the image", () => {
  for (const [w, h] of [[1536, 2048], [768, 1280], [2048, 1536]]) {
    const c = cropWindow({ width: w, height: h, centerX: w / 2, centerY: h / 2 });
    assert.equal(c.w % 2, 0, "h264 rejects an odd width");
    assert.equal(c.h % 2, 0, "h264 rejects an odd height");
    assert.ok(c.w <= w && c.h <= h, `crop ${c.w}x${c.h} does not fit in ${w}x${h}`);
    assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= w && c.y + c.h <= h, "crop falls outside the image");
    assert.ok(Math.abs(c.w / c.h - 9 / 16) < 0.02, `crop ${c.w}x${c.h} is not 9:16`);
  }
});

test("the crop stays inside the image even when the point is at a corner", () => {
  // The point can sit near an edge whenever the tile grid rounds against it. Clamping is
  // what stops ffmpeg being handed a negative offset.
  for (const [cx, cy] of [[0, 0], [1536, 2048], [-500, -500], [9999, 9999]]) {
    const c = cropWindow({ width: 1536, height: 2048, centerX: cx, centerY: cy });
    assert.ok(c.x >= 0 && c.y >= 0, `negative offset for centre ${cx},${cy}`);
    assert.ok(c.x + c.w <= 1536 && c.y + c.h <= 2048, `overflow for centre ${cx},${cy}`);
  }
});
