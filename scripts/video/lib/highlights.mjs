// highlights.mjs — pick the most animated moments of a video, spread over its whole length.
//
// A README preview cut from the first seven seconds shows the hook and nothing else: the
// reader never sees the chart, the map or the outro that make the video what it is. This
// picks one window per equal-length zone of the video — so the preview covers the start,
// the middle and the end — and inside each zone the window with the most motion.
//
// Motion is the mean absolute difference between successive downscaled grey frames
// (ffmpeg `tblend=difference` + `signalstats` YAVG). A hard cut shows up as a spike far above
// the motion around it; a window containing one would jump mid-clip, so those are avoided
// when the zone has any clean window at all, and the spike is clamped so a cut can never be
// the reason a window wins.
//
// Motion alone picks the wrong thing in template videos: a scene TRANSITION (blur-out, wipe,
// fade to paper) moves every pixel, so it outscores the chart drawing itself on. Each sample
// therefore also carries `d`, the frame's detail (mean of an edge-detected frame). A window
// whose least detailed frame drops under half the video's median detail is showing a
// transition or an empty background, and only wins when the zone has nothing else.

/** Join detail samples ({t, v} from the edge pass) onto motion samples as `d`, by nearest time. */
export function withDetail(motion, detail) {
  if (!detail?.length) return motion;
  let j = 0;
  return motion.map((s) => {
    while (j + 1 < detail.length && Math.abs(detail[j + 1].t - s.t) <= Math.abs(detail[j].t - s.t)) j++;
    return { ...s, d: detail[j].v };
  });
}

/** Parse `metadata=print` output into [{t, v}] samples. */
export function parseMotion(text) {
  const out = [];
  let t = null;
  for (const line of String(text).split(/\r?\n/)) {
    const pt = line.match(/pts_time:([\d.]+)/);
    if (pt) t = Number(pt[1]);
    const yv = line.match(/signalstats\.YAVG=([\d.]+)/);
    if (yv && t != null) out.push({ t, v: Number(yv[1]) });
  }
  return out;
}

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Times of hard cuts: samples whose difference is far above the video's typical motion. */
export function findCuts(samples, { factor = 4, floor = 10 } = {}) {
  const limit = Math.max(floor, factor * median(samples.map((s) => s.v)));
  return samples.filter((s) => s.v > limit).map((s) => s.t);
}

/**
 * Choose `count` windows of `len` seconds, one per zone.
 * @returns {{start:number, score:number, clean:boolean}[]} in time order
 */
export function pickWindows(samples, { duration, count = 6, len = 1.5, skipHead = 0.4, skipTail = 0.6, step = 0.25 } = {}) {
  if (!samples.length || !(duration > 0)) return [];
  const cuts = findCuts(samples);
  const cap = Math.max(10, 4 * median(samples.map((s) => s.v)));
  const lo = Math.min(skipHead, duration / 4);
  const hi = Math.max(lo + len, duration - skipTail);
  const usable = hi - lo;
  if (usable < len) return [{ start: 0, score: 0, clean: true }];
  const n = Math.max(1, Math.min(count, Math.floor(usable / len)));
  const zone = usable / n;
  const hasDetail = samples.some((s) => s.d != null);
  const medD = hasDetail ? median(samples.filter((s) => s.d != null).map((s) => s.d)) || 1 : 1;
  const inside = (a) => samples.filter((s) => s.t >= a && s.t < a + len);
  const score = (a) => {
    const xs = inside(a);
    if (!xs.length) return 0;
    const mv = xs.reduce((sum, s) => sum + Math.min(s.v, cap), 0) / xs.length;
    if (!hasDetail) return mv;
    // Motion counts only as far as there is something on screen to move.
    const dt = xs.reduce((sum, s) => sum + Math.min((s.d ?? medD) / medD, 1.5), 0) / xs.length;
    return mv * dt;
  };
  const solid = (a) => !hasDetail || inside(a).every((s) => (s.d ?? medD) >= 0.5 * medD);
  // A cut sample is the difference between the frame before it and itself, so a cut AT the
  // window's first sample is outside the clip — only cuts strictly after the start count.
  const clean = (a) => solid(a) && !cuts.some((c) => c > a + 0.01 && c < a + len - 0.01);
  const picks = [];
  for (let i = 0; i < n; i++) {
    const z0 = lo + i * zone;
    const z1 = Math.min(hi - len, z0 + zone - len);
    const cands = [];
    for (let a = z0; a <= Math.max(z0, z1) + 1e-9; a += step) cands.push({ start: +a.toFixed(3), score: score(a), clean: clean(a) });
    const pool = cands.some((c) => c.clean) ? cands.filter((c) => c.clean) : cands;
    pool.sort((x, y) => y.score - x.score || x.start - y.start);
    picks.push(pool[0]);
  }
  return picks;
}
