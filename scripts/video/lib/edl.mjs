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
  (edl.cards ?? []).forEach((c, i) => {
    if (![c.at, c.dur].every(Number.isFinite) || c.dur < 1.5) p.push(`cards[${i}]: needs numeric at and dur ≥ 1.5 s (a card shorter than that cannot be read)`);
    else if (!segs.some((s) => c.at >= s.from && c.at + c.dur <= s.to + 0.05)) p.push(`cards[${i}] (${c.at}–${(c.at + c.dur).toFixed(1)}) must sit entirely inside one segment`);
    if (typeof c.templateId !== "string" || !/^frame-[a-z0-9-]+$/.test(c.templateId)) p.push(`cards[${i}].templateId must be a frame-* template id`);
    if (c.layout !== undefined && !CARD_LAYOUTS.includes(c.layout)) p.push(`cards[${i}].layout must be one of ${CARD_LAYOUTS.join(", ")}`);
  });
  // two cut-aways on screen at once would hide one behind the other
  const spans = [...(edl.broll ?? []).map((b, i) => ({ k: `broll[${i}]`, a: b.at, b: b.at + b.dur })),
    ...(edl.cards ?? []).map((c, i) => ({ k: `cards[${i}]`, a: c.at, b: c.at + c.dur }))].sort((x, y) => x.a - y.a);
  for (let i = 1; i < spans.length; i++) {
    if (spans[i].a < spans[i - 1].b - 0.01) p.push(`${spans[i - 1].k} and ${spans[i].k} overlap`);
  }
  const talk = segs.reduce((a, s) => a + (s.to - s.from), 0);
  const roll = (edl.broll ?? []).reduce((a, b) => a + (Number(b.dur) || 0), 0);
  // ghost-editor's measured ceiling for talking-head reels: past ~a third, it stops being one
  if (talk && roll / talk > 0.35) p.push(`B-roll is ${Math.round((roll / talk) * 100)}% of the runtime — keep it under ~35%, the speaker is the content`);
  // Cards in `pip` keep the speaker on screen, so they cost half: the face is still there.
  const away = roll + (edl.cards ?? []).reduce((a, c) => a + (Number(c.dur) || 0) * (c.layout === "pip" ? 0.5 : 1), 0);
  if (talk && away / talk > 0.55) p.push(`B-roll + cards hide the speaker for ${Math.round((away / talk) * 100)}% of the runtime — keep it under ~55% (pip cards count half)`);
  return p;
}

/** How a card sits over the speaker: full frame, or full frame with the speaker in a corner box. */
export const CARD_LAYOUTS = ["full", "pip"];

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

/**
 * Where each card lands on the FINAL (silence-cut) timeline.
 *
 * Cards are overlaid after the cut, not baked into the segments before it: baked in, the pauses
 * removed by autocut also removed frames from inside each card — animations jumped, and a card
 * whose key beat came late (a page that turns at 3 s) was gone before it happened. So a card's
 * START follows the speech (source → assembled → cut, like a caption), and it then plays its
 * full `dur` uninterrupted, clamped to the end of the video.
 *
 * `segs` carry their real encoded `dur`; `remap(t)` maps assembled time → cut time.
 */
export function cardsOnCut(cards, segs, remap, cutDur) {
  let off = 0;
  const offsets = segs.map((s) => { const o = off; off += s.dur ?? s.to - s.from; return o; });
  return (cards ?? [])
    .map((c) => {
      const i = segs.findIndex((s) => c.at >= s.from && c.at < s.to);
      if (i < 0) return null;
      const start = remap(offsets[i] + (c.at - segs[i].from));
      const end = Math.min(cutDur, start + c.dur);
      return end - start >= 1 ? { ...c, start: +start.toFixed(3), end: +end.toFixed(3) } : null;
    })
    .filter(Boolean);
}
