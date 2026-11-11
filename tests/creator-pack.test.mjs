// Creator-pack additions: delivery checks per platform, beat grid, adaptive silence
// threshold, before/after compare. Pure functions only — no ffmpeg.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PLATFORMS, checkDelivery, tightest, fitBitrate, SPECS_CHECKED } from "../scripts/video/lib/delivery-specs.mjs";
import { onsetEnvelope, estimateTempo, beatTimes, snapToBeat, HOP } from "../scripts/video/lib/beats.mjs";
import { parseLevels, adaptiveNoise } from "../scripts/video/lib/autocut.mjs";
import { savedLine, mmss } from "../scripts/video/compare.mjs";

const vert = { width: 1080, height: 1920, duration: 30, bytes: 20 * 1024 ** 2, fps: 30, vcodec: "h264", acodec: "aac", container: "mp4", lufs: -14, truePeak: -2 };

test("every platform spec is sourced and dated", () => {
  assert.match(SPECS_CHECKED, /^\d{4}-\d{2}-\d{2}$/);
  for (const [id, p] of Object.entries(PLATFORMS)) {
    assert.ok(p.label && p.hard && p.soft, `${id} needs label, hard and soft`);
    assert.ok(p.sources?.length && p.sources.every((u) => /^https:\/\//.test(u)), `${id} has no source`);
  }
});

test("a clean 30 s vertical file passes everywhere it should", () => {
  for (const id of Object.keys(PLATFORMS)) {
    // Shopee listing videos are capped at 1280 px on the long side — 720×1280 is the delivery
    const p = id === "shopee-product" ? { ...vert, width: 720, height: 1280 } : vert;
    assert.deepEqual(checkDelivery(p, id).errors, [], id);
  }
  assert.match(checkDelivery(vert, "shopee-product").errors.join(), /1280×1280/);
});

test("official limits are errors; disputed ones are warnings", () => {
  // Shopee listing video: official 10–60 s, ≤ 30 MB, ≤ 1280 px
  const e = checkDelivery({ ...vert, duration: 75, bytes: 45 * 1024 ** 2 }, "shopee-product").errors.join(" | ");
  assert.match(e, /at most 60 s/);
  assert.match(e, /at most 30\.0 MB/);
  assert.match(e, /at most 1280×1280/);
  // Facebook Reels length is disputed (90 s vs none) → warning only
  const fb = checkDelivery({ ...vert, duration: 120 }, "facebook-reels");
  assert.deepEqual(fb.errors, []);
  assert.match(fb.warnings.join(), /sources disagree/);
  // a 16:9 Short is filed as a long video (YouTube's own page)
  assert.match(checkDelivery({ ...vert, width: 1920, height: 1080 }, "youtube-shorts").errors.join(), /square or vertical/);
  assert.equal(checkDelivery({ ...vert, duration: 170 }, "youtube-shorts").errors.length, 0);
  assert.match(checkDelivery({ ...vert, duration: 181 }, "youtube-shorts").errors.join(), /at most 180/);
  // Zalo Ads: ≤ 60 s, H.264 only
  assert.match(checkDelivery({ ...vert, vcodec: "hevc" }, "zalo-ads").errors.join(), /h264/);
});

test("loudness and sound warnings", () => {
  const w = (p) => checkDelivery({ ...vert, ...p }, "tiktok").warnings.join(" | ");
  assert.match(w({ lufs: -6 }), /too loud/);
  assert.match(w({ lufs: -26 }), /quiet/);
  assert.match(w({ truePeak: 0.2 }), /clip/);
  assert.match(w({ acodec: null }), /no audio/);
  assert.doesNotMatch(w({}), /LUFS|clip|audio/);
});

test("resolution is judged by short and long side, not orientation", () => {
  assert.doesNotMatch(checkDelivery({ ...vert, width: 1920, height: 1080 }, "tiktok").warnings.join(), /looks sharp/);
  assert.match(checkDelivery({ ...vert, width: 540, height: 960 }, "tiktok").warnings.join(), /looks sharp/);
});

test("--fix targets: the tightest hard limits, and a bitrate that fits", () => {
  assert.deepEqual(tightest(["tiktok", "shopee-product"]), { maxBytes: 30 * 1024 ** 2, maxLong: 1280, maxDur: 60 });
  const kbps = fitBitrate(45, 30 * 1024 ** 2);
  const bytes = ((kbps + 128) * 1000 * 45) / 8;
  assert.ok(bytes < 30 * 1024 ** 2 && bytes > 25 * 1024 ** 2, `${kbps} kbit/s → ${bytes} bytes`);
  assert.equal(fitBitrate(10, Infinity), 10000);
  assert.equal(fitBitrate(3600, 30 * 1024 ** 2), null); // an hour in 30 MB cannot look like anything
});

/** A click track: a decaying 90 Hz thump every `period` s starting at `first`, plus a quiet hum. */
function clicks(bpm, { first = 0.37, seconds = 20, sr = 22050 } = {}) {
  const period = 60 / bpm, x = new Float32Array(seconds * sr);
  for (let i = 0; i < x.length; i++) {
    const t = i / sr, ph = (((t - first) % period) + period) % period;
    x[i] = (t >= first ? 0.8 * Math.exp(-40 * ph) * Math.sin(2 * Math.PI * 90 * t) : 0) + 0.05 * Math.sin(2 * Math.PI * 330 * t);
  }
  return x;
}

test("beat grid: tempo within 1 BPM and every beat within ~1.5 hops of the truth", () => {
  const sr = 22050, fps = sr / HOP;
  for (const bpm of [90, 128]) {
    const env = onsetEnvelope(clicks(bpm));
    const { bpm: coarse, confidence } = estimateTempo(env, fps);
    const g = beatTimes(env, fps, coarse, { duration: 20 });
    assert.ok(Math.abs(g.bpm - bpm) < 1, `${bpm}: got ${g.bpm}`);
    assert.ok(confidence > 0.5, `${bpm}: confidence ${confidence}`);
    const p = 60 / bpm;
    const worst = Math.max(...g.beats.map((b) => Math.abs(b - (0.37 + Math.round((b - 0.37) / p) * p))));
    assert.ok(worst < 0.04, `${bpm}: a beat is ${worst.toFixed(3)} s off`);
  }
});

test("snapToBeat nudges only within the tolerance", () => {
  const beats = [1, 1.5, 2];
  assert.equal(snapToBeat(1.45, beats), 1.5);
  assert.equal(snapToBeat(1.3, beats), 1.3); // 0.2 s from any beat: left on its word
  assert.equal(snapToBeat(0.95, beats, 0.04), 0.95);
});

test("adaptive silence threshold: just above the room, never near the voice, falls back when unsure", () => {
  const take = (room, voice, roomShare = 0.3) =>
    Array.from({ length: 400 }, (_, i) => (i < 400 * roomShare ? room + (i % 3) : voice - (i % 7)));
  const a = adaptiveNoise(take(-60, -15));
  assert.equal(a.fallback, false);
  assert.equal(a.noise, -50); // -60 + 3 = -57 → clamped to the floor of -50
  const noisy = adaptiveNoise(take(-31, -12));
  assert.equal(noisy.noise, Math.max(-50, Math.min(-26, noisy.floor + 3, noisy.speech - 12)));
  assert.ok(noisy.noise > -35, "a noisy room needs a threshold above -35, or nothing is cut");
  const close = adaptiveNoise(take(-22, -16)); // music bed under the voice
  assert.equal(close.fallback, true);
  assert.equal(close.noise, -35);
  assert.equal(adaptiveNoise([-30, -20]).fallback, true); // too few windows to judge
  assert.deepEqual(parseLevels("lavfi.astats.Overall.Peak_level=-23.5\nlavfi.astats.Overall.Peak_level=-inf\n"), [-23.5, -120]);
});

test("compare: the headline says how much was cut", () => {
  assert.equal(mmss(102), "1:42");
  assert.equal(savedLine(102, 58), "Bớt 0:44 (43%)");
  assert.match(savedLine(60, 59.8), /Cùng độ dài/);
});
