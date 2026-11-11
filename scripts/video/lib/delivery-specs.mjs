// delivery-specs.mjs — what each platform a Vietnamese creator posts to accepts, and a check
// of a real file against it. Pure; tests in tests/delivery.test.mjs. CLI: delivery-check.mjs.
//
// WHY. A video that renders is not a video that uploads: a Shopee listing video over 30 MB is
// refused, a 95-second "Reel" may land as a plain Facebook video, a Zalo ad over 60 s is
// rejected. Those limits live on help pages that change and disagree with each other, so
// every number here carries its source and the day it was checked, and the limits are split:
//   hard — from the platform's own page: a breach is an error (the upload fails)
//   soft — sources disagree, or it is advice: a breach is a warning
// Checked 2026-11-11. Specs drift — re-check the `source` pages before a campaign that matters.
//
// Idea from iart.ai's video-delivery-specs skill (MIT): a per-platform spec sheet + a QC
// checklist. Re-done for the platforms a Vietnamese creator actually uses, as a checker of a
// real file rather than a table to read.

const CHECKED = "2026-11-11";

/** Spec fields: ratios (w/h list), minRes [w,h], maxRes [w,h], minDur/maxDur s, maxBytes, codecs, containers, fps [lo,hi]. */
export const PLATFORMS = {
  tiktok: {
    label: "TikTok",
    hard: { maxDur: 600, maxBytes: 4 * 1024 ** 3, codecs: ["h264", "hevc"], containers: ["mp4", "mov"] },
    soft: { ratios: [9 / 16], minRes: [720, 1280], fps: [23, 60], maxDurNote: [180, "accounts that are new or unverified may be capped at 3 min"],
      bigBytes: [287 * 1024 ** 2, "over ~287 MB the phone app may refuse it — upload at tiktok.com (web takes up to 4 GB)"] },
    sources: ["https://postfa.st/sizes/tiktok/video", "https://socialrails.com/sizes/tiktok/video"],
  },
  "facebook-reels": {
    label: "Facebook Reels",
    hard: { codecs: ["h264", "hevc"], containers: ["mp4", "mov"], maxBytes: 4 * 1024 ** 3, minRes: [540, 960] },
    soft: { ratios: [9 / 16], fps: [24, 60], maxDurNote: [90, "sources disagree on a Reel's length (90 s vs no cap) — longer may show as a regular video, not in Reels"],
      bigBytes: [1024 ** 3, "one source caps Reels at 1 GB"] },
    sources: ["https://socialrails.com/sizes/facebook/reels", "https://postiz.com/blog/facebook-reel-size"],
  },
  "youtube-shorts": {
    label: "YouTube Shorts",
    hard: { maxDur: 180, verticalOrSquare: true, codecs: ["h264", "hevc", "vp9", "av1"], containers: ["mp4", "mov", "webm"] },
    soft: { ratios: [9 / 16, 1], minRes: [720, 1280], fps: [24, 60] },
    sources: ["https://support.google.com/youtube/answer/15424877", "https://support.google.com/youtube/answer/12779649"],
    note: "Official: ≤ 3 min AND square or vertical — a 16:9 upload is long-form, not a Short.",
  },
  "shopee-product": {
    label: "Shopee — video sản phẩm (trang bán hàng)",
    hard: { minDur: 10, maxDur: 60, maxBytes: 30 * 1024 ** 2, maxRes: [1280, 1280], containers: ["mp4"], codecs: ["h264", "hevc"] },
    soft: {},
    sources: ["https://seller.shopee.sg/edu/article/12279/product-videos"],
    note: "Shopee's own page (older, but no newer official one exists). Check your country's Seller Centre.",
  },
  "shopee-video": {
    label: "Shopee Video (kênh video)",
    hard: { minDur: 3, maxDur: 180, maxBytes: 1024 ** 3, containers: ["mp4", "mov"], codecs: ["h264", "hevc"] },
    soft: { ratios: [9 / 16], minRes: [480, 854], maxDurNote: [60, "Shopee's Malaysia page says 1 min; newer guides say 3 min — keep it ≤ 60 s to be safe"] },
    sources: ["https://seller.shopee.com.my/edu/article/24178/about-shopee-video", "https://help.bigseller.com/en_US/detailPage/what-is-shopee-video.9139"],
  },
  "zalo-ads": {
    label: "Zalo Ads — quảng cáo video",
    hard: { maxDur: 60, codecs: ["h264"], containers: ["mp4"], ratiosHard: [16 / 9, 9 / 16, 1] },
    soft: { bigBytes: [10 * 1024 ** 2, "the video DISPLAY ad format caps files at 10 MB"] },
    sources: ["https://ads.zalo.me/business/huong-dan-tao-quang-cao-video/", "https://ads.zalo.me/business/huong-dan-tao-quang-cao-dinh-dang-video/"],
  },
  zalo: {
    label: "Zalo — nhật ký / Zalo Video",
    hard: { containers: ["mp4", "mov"] },
    soft: { ratios: [9 / 16], minRes: [720, 1280], fps: [24, 60], maxDurNote: [180, "no official limit for organic posts; guides say 3 min from the gallery"],
      bigBytes: [100 * 1024 ** 2, "guides report ~100 MB from the gallery; larger files are compressed hard or refused"] },
    sources: ["https://cellphones.com.vn/sforum/cach-dang-video-hd-tren-zalo", "https://phanmemzalo.vn/cach-dang-zalo-video/"],
    note: "Zalo publishes no organic-video spec; these are third-party guides.",
  },
};
export const SPECS_CHECKED = CHECKED;

/** Social loudness: every platform normalises; -14 LUFS is where they meet, true peak ≤ -1 dBTP. */
export const LOUDNESS = { target: -14, low: -20, high: -9, truePeak: -1 };

const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
const mb = (b) => `${(b / 1024 ** 2).toFixed(1)} MB`;
const ratioName = (r) => (near(r, 9 / 16) ? "9:16" : near(r, 16 / 9) ? "16:9" : near(r, 1) ? "1:1" : near(r, 4 / 5) ? "4:5" : r.toFixed(3));

/**
 * probe: { width, height, duration, bytes, fps, vcodec, acodec, container, lufs?, truePeak? }
 * → { errors: [], warnings: [] } for one platform id.
 */
export function checkDelivery(probe, id) {
  const p = PLATFORMS[id];
  if (!p) throw new Error(`unknown platform "${id}" — one of ${Object.keys(PLATFORMS).join(", ")}`);
  const E = [], W = [];
  const { hard = {}, soft = {} } = p;
  const r = probe.width / probe.height;
  // resolution by short and long side, so a landscape file is not "too narrow" for a portrait minimum
  const short = Math.min(probe.width, probe.height), long = Math.max(probe.width, probe.height);
  const under = (m) => short < Math.min(...m) || long < Math.max(...m);
  if (hard.containers && probe.container && !hard.containers.includes(probe.container)) E.push(`container ${probe.container} — needs ${hard.containers.join("/")}`);
  if (hard.codecs && probe.vcodec && !hard.codecs.includes(probe.vcodec)) E.push(`video codec ${probe.vcodec} — needs ${hard.codecs.join("/")}`);
  if (hard.minDur && probe.duration < hard.minDur) E.push(`${probe.duration.toFixed(1)} s — at least ${hard.minDur} s`);
  if (hard.maxDur && probe.duration > hard.maxDur + 0.05) E.push(`${probe.duration.toFixed(1)} s — at most ${hard.maxDur} s`);
  if (hard.maxBytes && probe.bytes > hard.maxBytes) E.push(`${mb(probe.bytes)} — at most ${mb(hard.maxBytes)} (fix: --fix re-encodes to fit)`);
  if (hard.maxRes && (Math.max(probe.width, probe.height) > Math.max(...hard.maxRes))) E.push(`${probe.width}×${probe.height} — at most ${hard.maxRes.join("×")} (fix: --fix scales it down)`);
  if (hard.minRes && under(hard.minRes)) E.push(`${probe.width}×${probe.height} — at least ${hard.minRes.join("×")}`);
  if (hard.verticalOrSquare && r > 1.01) E.push(`ratio ${ratioName(r)} — a Short must be square or vertical; wider is filed as a long video`);
  if (hard.ratiosHard && !hard.ratiosHard.some((x) => near(r, x))) E.push(`ratio ${ratioName(r)} — needs ${hard.ratiosHard.map(ratioName).join(", ")}`);

  if (soft.ratios && !soft.ratios.some((x) => near(r, x)) && !E.some((e) => e.startsWith("ratio"))) W.push(`ratio ${ratioName(r)} — ${soft.ratios.map(ratioName).join(" or ")} fills the screen`);
  if (soft.minRes && under(soft.minRes) && !E.some((e) => /at least d+×/.test(e))) W.push(`${probe.width}×${probe.height} — ${soft.minRes.join("×")} or more looks sharp; 1080×1920 is the norm`);
  if (soft.fps && probe.fps && (probe.fps < soft.fps[0] - 0.5 || probe.fps > soft.fps[1] + 0.5)) W.push(`${probe.fps.toFixed(2)} fps — ${soft.fps.join("–")} is safe`);
  if (soft.maxDurNote && probe.duration > soft.maxDurNote[0] + 0.05) W.push(`${probe.duration.toFixed(1)} s > ${soft.maxDurNote[0]} s: ${soft.maxDurNote[1]}`);
  if (soft.bigBytes && probe.bytes > soft.bigBytes[0]) W.push(`${mb(probe.bytes)}: ${soft.bigBytes[1]}`);
  if (probe.acodec && probe.acodec !== "aac") W.push(`audio ${probe.acodec} — AAC is what every platform expects`);
  if (!probe.acodec) W.push("no audio track — fine for a silent ad, a mistake anywhere else");
  if (Number.isFinite(probe.lufs)) {
    if (probe.lufs > LOUDNESS.high) W.push(`${probe.lufs.toFixed(1)} LUFS — too loud, the platform will turn it down and it will sound squashed (aim ${LOUDNESS.target})`);
    else if (probe.lufs < LOUDNESS.low) W.push(`${probe.lufs.toFixed(1)} LUFS — quiet next to the video before it (aim ${LOUDNESS.target})`);
  }
  if (Number.isFinite(probe.truePeak) && probe.truePeak > LOUDNESS.truePeak) W.push(`true peak ${probe.truePeak.toFixed(1)} dBTP — over ${LOUDNESS.truePeak}, it will clip after the platform's encode`);
  return { errors: E, warnings: W };
}

/**
 * The tightest limits across several platforms — what one --fix file must meet to go everywhere.
 * → { maxBytes, maxRes, maxDur }
 */
export function tightest(ids) {
  const out = { maxBytes: Infinity, maxLong: Infinity, maxDur: Infinity };
  for (const id of ids) {
    const h = PLATFORMS[id]?.hard ?? {};
    if (h.maxBytes) out.maxBytes = Math.min(out.maxBytes, h.maxBytes);
    if (h.maxRes) out.maxLong = Math.min(out.maxLong, Math.max(...h.maxRes));
    if (h.maxDur) out.maxDur = Math.min(out.maxDur, h.maxDur);
  }
  return out;
}

/**
 * Video bitrate (kbit/s) that lands a file of `duration` s under `maxBytes`, leaving room for
 * `audioKbps` of audio and 4% container overhead; capped at `ceilingKbps` (more is wasted —
 * the platform re-encodes). null when even 300 kbit/s would not fit.
 */
export function fitBitrate(duration, maxBytes, { audioKbps = 128, ceilingKbps = 10000 } = {}) {
  if (!Number.isFinite(maxBytes)) return ceilingKbps;
  const totalKbps = ((maxBytes * 8) / 1000 / duration) * 0.96;
  const v = Math.floor(totalKbps - audioKbps);
  return v < 300 ? null : Math.min(ceilingKbps, v);
}
