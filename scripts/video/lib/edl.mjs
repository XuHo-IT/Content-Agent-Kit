// edl.mjs — edit decision lists for talking-head.mjs: several source ranges, each with its own
// crop, plus B-roll cut-aways laid over the speaker. Pure functions, so they can be tested.

const CROP = /^\d+:\d+:\d+:\d+$/;

/**
 * Problems with an EDL, as readable strings ([] = fine). Times are source seconds.
 * `audioOnly`: the input is a voice recording — there is no picture to cut away FROM, so
 * B-roll, `pip`/`split` cards and text "behind" a person are refused, and the
 * "don't hide the speaker" ceiling does not apply (the cards ARE the picture).
 */
export function validateEdl(edl, { audioOnly = false } = {}) {
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
    if (audioOnly && (c.layout === "pip" || c.layout === "split")) p.push(`cards[${i}].layout "${c.layout}" shows the speaker — a voice-only input has none; use "full"`);
    if (c.speakerY !== undefined && !(Number.isFinite(c.speakerY) && c.speakerY >= 0 && c.speakerY <= 960)) p.push(`cards[${i}].speakerY must be 0–960 (top of the speaker's half, in 1080×1920 pixels)`);
  });
  if (audioOnly && (edl.broll ?? []).length) p.push("broll needs a picture to cut away from — a voice-only input has none; use cards");
  (edl.behind ?? []).forEach((b, i) => {
    if (![b.at, b.dur].every(Number.isFinite) || b.dur < 1 || b.dur > 6) p.push(`behind[${i}]: needs numeric at and dur 1–6 s`);
    else if (!segs.some((s) => b.at >= s.from && b.at + b.dur <= s.to + 0.05)) p.push(`behind[${i}] must sit entirely inside one segment`);
    const t = String(b.text ?? "").trim();
    if (!t || [...t].length > 24) p.push(`behind[${i}].text must be 1–24 characters (it is set huge, behind a head)`);
    if (audioOnly) p.push(`behind[${i}]: text behind the speaker needs a speaker — a voice-only input has none`);
  });
  // two cut-aways on screen at once would hide one behind the other
  const spans = [...(edl.broll ?? []).map((b, i) => ({ k: `broll[${i}]`, a: b.at, b: b.at + b.dur })),
    ...(edl.cards ?? []).map((c, i) => ({ k: `cards[${i}]`, a: c.at, b: c.at + c.dur }))].sort((x, y) => x.a - y.a);
  for (let i = 1; i < spans.length; i++) {
    if (spans[i].a < spans[i - 1].b - 0.01) p.push(`${spans[i - 1].k} and ${spans[i].k} overlap`);
  }
  // "popout": the frame shrinks into a white-bordered card and the speaker's head breaks out
  // over its top edge (person mask laid over the card). Same span rules as "behind".
  (edl.popout ?? []).forEach((b, i) => {
    if (![b.at, b.dur].every(Number.isFinite) || b.dur < 1 || b.dur > 6) p.push(`popout[${i}]: needs numeric at and dur 1–6 s`);
    else if (!segs.some((s) => b.at >= s.from && b.at + b.dur <= s.to + 0.05)) p.push(`popout[${i}] must sit entirely inside one segment`);
    if (audioOnly) p.push(`popout[${i}]: needs a speaker — a voice-only input has none`);
    const j = (edl.cards ?? []).findIndex((c) => b.at < c.at + c.dur && b.at + b.dur > c.at);
    if (j >= 0) p.push(`popout[${i}] overlaps cards[${j}] — one effect at a time`);
    const k = (edl.behind ?? []).findIndex((x) => b.at < x.at + x.dur && b.at + b.dur > x.at);
    if (k >= 0) p.push(`popout[${i}] overlaps behind[${k}] — one effect at a time`);
  });
  // text behind the speaker is hidden by a full card on top of it
  for (const [i, b] of (edl.behind ?? []).entries()) {
    const j = (edl.cards ?? []).findIndex((c) => (c.layout ?? "full") === "full" && b.at < c.at + c.dur && b.at + b.dur > c.at);
    if (j >= 0) p.push(`behind[${i}] is under cards[${j}], a full card — nobody would see it`);
  }
  if (audioOnly) return p;
  const talk = segs.reduce((a, s) => a + (s.to - s.from), 0);
  const roll = (edl.broll ?? []).reduce((a, b) => a + (Number(b.dur) || 0), 0);
  // ghost-editor's measured ceiling for talking-head reels: past ~a third, it stops being one
  if (talk && roll / talk > 0.35) p.push(`B-roll is ${Math.round((roll / talk) * 100)}% of the runtime — keep it under ~35%, the speaker is the content`);
  // Cards in `pip` or `split` keep the speaker on screen, so they cost half: the face is still there.
  const away = roll + (edl.cards ?? []).reduce((a, c) => a + (Number(c.dur) || 0) * (c.layout === "pip" || c.layout === "split" ? 0.5 : 1), 0);
  if (talk && away / talk > 0.55) p.push(`B-roll + cards hide the speaker for ${Math.round((away / talk) * 100)}% of the runtime — keep it under ~55% (pip and split cards count half)`);
  return p;
}

/**
 * How a card sits over the speaker: `full` frame; `pip` — full frame with the speaker in a
 * corner box; `split` — the card on the top half, the speaker on the bottom half (the
 * whiteboard look: the face stays big, the card gets a real share of the screen).
 */
export const CARD_LAYOUTS = ["full", "pip", "split"];

/**
 * The sound a card makes when it appears, when its EDL entry names none. One soft paper flip
 * is the default: a card is a page turning, not an event. A few templates carry their own
 * meaning — a myth being wrong, a result landing — and get the sound that says so.
 * Names are under assets/sfx/ (scripts/video/sfx-cc0.mjs fetches them).
 */
export const AUTO_CARD_SFX = [
  [/(^|-)(myth|wrong|error|fail|warning|alert)(-|$)/, "fail/cc0-error-beep"],
  [/(^|-)(verdict|result|win|success|done)(-|$)/, "success/cc0-tada"],
];
export const DEFAULT_CARD_SFX = "transition/cc0-paper-flip";
export function autoCardSfx(templateId) {
  const id = String(templateId ?? "");
  return (AUTO_CARD_SFX.find(([re]) => re.test(id)) ?? [null, DEFAULT_CARD_SFX])[1];
}

/**
 * Which cards get an automatic sound: those that name none (`"sfx": false` opts out), and
 * only when the previous sound is at least `gap` seconds back — an automatic sound must never
 * be what trips the density warning. `cards` are on the final timeline ({start}).
 */
export function withAutoSfx(cards, { gap = 3 } = {}) {
  let last = -Infinity;
  return [...cards].sort((a, b) => a.start - b.start).map((c) => {
    if (c.sfx === false) return { ...c, sfx: null };
    if (c.sfx) { last = c.start; return c; }
    if (c.start - last < gap) return c;
    last = c.start;
    return { ...c, sfx: autoCardSfx(c.templateId), sfxAuto: true };
  });
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

/**
 * How a split card's band goes into the 1080×960 top half: cut out at full size when it fits
 * (centred on the band), else the band scaled down to fit. No band found → the middle.
 */
export function splitCardFit(band, { H = 1920, half = 960, pad = 40 } = {}) {
  if (!band || band.y2 - band.y1 >= H - 2 * pad) return { mode: "crop", y: (H - half) / 2 };
  const top = Math.max(0, band.y1 - pad), bottom = Math.min(H, band.y2 + pad);
  if (bottom - top <= half) return { mode: "crop", y: Math.round(Math.max(0, Math.min(H - half, (top + bottom) / 2 - half / 2))) };
  return { mode: "fit", y: top, h: bottom - top };
}

/**
 * Card inputs vs the slots each template actually reads. A wrong slot name does not fail a
 * render — the template quietly draws its own PREVIEW text instead ("Một agent vừa dựng xong
 * video" on a card about driving licences), which is worse than a crash. Keys starting with
 * "_" are notes (_said, _fill) and are ignored. `slotsOf(id)` → the template's slots, or null
 * when there is no such template; `nearest(k, slots)` → a suggestion or null.
 */
export function cardSlotProblems(cards, slotsOf, nearest = () => null) {
  const p = [];
  (cards ?? []).forEach((c, i) => {
    if (typeof c.templateId !== "string") return;
    const slots = slotsOf(c.templateId);
    if (slots === null) { p.push(`cards[${i}].templateId "${c.templateId}" is not a template in video-templates/`); return; }
    const passed = Object.keys(c.inputs ?? {}).filter((k) => !k.startsWith("_"));
    if (!slots.length || !passed.length) return;
    const unknown = passed.filter((k) => !slots.includes(k));
    for (const k of unknown) {
      const near = nearest(k, slots);
      p.push(`cards[${i}].inputs has no slot "${k}" on ${c.templateId}${near ? ` — did you mean "${near}"?` : ""} (slots: ${slots.join(", ")})`);
    }
    if (unknown.length === passed.length) p.push(`cards[${i}] fills none of ${c.templateId}'s slots — it would show the template's sample text`);
  });
  return p;
}
