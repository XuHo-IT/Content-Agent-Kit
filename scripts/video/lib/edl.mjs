// edl.mjs — edit decision lists for talking-head.mjs: several source ranges, each with its own
// crop, plus B-roll cut-aways laid over the speaker. Pure functions, so they can be tested.

const CROP = /^\d+:\d+:\d+:\d+$/;

/** Problems with an EDL, as readable strings ([] = fine). Times are source seconds. */
export function validateEdl(edl) {
  const p = [];
  const segs = edl?.segments;
  if (!Array.isArray(segs) || !segs.length) return ["edl.segments must be a non-empty array of {from, to, crop?}"];
  segs.forEach((s, i) => {
    if (!(Number.isFinite(s.from) && Number.isFinite(s.to) && s.to > s.from && s.from >= 0))
      p.push(`segments[${i}]: needs numeric from < to (got ${s.from}–${s.to})`);
    if (s.crop && !CROP.test(s.crop)) p.push(`segments[${i}].crop must be w:h:x:y in source pixels, got "${s.crop}"`);
  });
  (edl.broll ?? []).forEach((b, i) => {
    if (![b.at, b.src, b.dur].every(Number.isFinite) || b.dur <= 0) p.push(`broll[${i}]: needs numeric at, src and dur > 0`);
    else if (!segs.some((s) => b.at >= s.from && b.at < s.to)) p.push(`broll[${i}].at ${b.at} is not inside any segment`);
    if (b.crop && !CROP.test(b.crop)) p.push(`broll[${i}].crop must be w:h:x:y, got "${b.crop}"`);
  });
  const talk = segs.reduce((a, s) => a + (s.to - s.from), 0);
  const roll = (edl.broll ?? []).reduce((a, b) => a + (Number(b.dur) || 0), 0);
  // ghost-editor's measured ceiling for talking-head reels: past ~a third, it stops being one
  if (talk && roll / talk > 0.35) p.push(`B-roll is ${Math.round((roll / talk) * 100)}% of the runtime — keep it under ~35%, the speaker is the content`);
  return p;
}

/**
 * Words in source time → words on the assembled timeline. A word belongs to the segment that
 * holds its midpoint; words outside every segment are dropped. `segs` carry their real encoded
 * duration as `dur` (an encoded segment can be a frame longer or shorter than to − from).
 */
export function sourceToJoined(words, segs) {
  const out = [];
  let off = 0;
  for (const s of segs) {
    const len = s.dur ?? s.to - s.from;
    for (const w of words) {
      const mid = (w.start + w.end) / 2;
      if (mid < s.from || mid >= s.to) continue;
      const start = Math.max(0, w.start - s.from);
      const end = Math.min(len, w.end - s.from);
      out.push({ ...w, start: +(off + start).toFixed(3), end: +(off + Math.max(start, end)).toFixed(3) });
    }
    off += len;
  }
  return out;
}
