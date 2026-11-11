// faces.mjs — where the speaker's head is, and where text may go so it does not cover it.
// Pure functions (tests in tests/faces.test.mjs); the detection itself is scripts/video/face-boxes.mjs.
//
// The idea is MRT Keyword's face_boxes.py (no licence — idea only, written fresh here): sample
// a dozen frames per segment, take the biggest face, grow the box UP over the hair and DOWN
// over the chin (a detector's box is eyes-to-mouth; a caption on someone's forehead still
// reads as "on their face"), and keep the union — the head moves while they talk.

/** Grow a detector box to the whole head. Ratios are of the face box. */
export const HEAD_PAD = { up: 0.45, down: 0.2, side: 0.18 };

/**
 * frames: [{ faces: [{x,y,w,h,score}] }] in pixel coordinates of a W×H frame.
 * → the head's union box {x,y,w,h,hits,frames}, or null when a face was found in fewer than
 *   `minHit` of the frames (a cut-away, a back turned — better no box than a wrong one).
 */
export function headBox(frames, { W, H, minScore = 0.6, minHit = 1 / 3, pad = HEAD_PAD } = {}) {
  const heads = [];
  for (const f of frames ?? []) {
    const best = (f.faces ?? []).filter((b) => b.score >= minScore).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    if (!best) continue;
    const x0 = best.x - best.w * pad.side, x1 = best.x + best.w * (1 + pad.side);
    const y0 = best.y - best.h * pad.up, y1 = best.y + best.h * (1 + pad.down);
    heads.push([Math.max(0, x0), Math.max(0, y0), Math.min(W, x1), Math.min(H, y1)]);
  }
  const n = (frames ?? []).length;
  if (!heads.length || heads.length < n * minHit) return null;
  const x0 = Math.min(...heads.map((h) => h[0])), y0 = Math.min(...heads.map((h) => h[1]));
  const x1 = Math.max(...heads.map((h) => h[2])), y1 = Math.max(...heads.map((h) => h[3]));
  return { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0), hits: heads.length, frames: n };
}

const overlapsY = (head, top, bottom) => head && head.y < bottom && head.y + head.h > top;

/**
 * Where a block of text `boxH` tall goes so it clears `head`. `pref` is where the style puts
 * it: {an: 2, marginV} (bottom-anchored) or {an: 8, marginV} (top-anchored).
 * → null if the preferred spot is already clear, else {an, marginV} of the new spot, or null
 *   when no spot fits (then the text stays where the style put it — never off-screen).
 * `safeTop` / `safeBottom` keep text off the platform's own UI (status bar, like/comment rail).
 */
export function textSlot(head, { H, boxH, pref, gap = 24, safeTop = 0.08, safeBottom = 0.12 }) {
  if (!head) return null;
  const top = pref.an === 8 ? pref.marginV : H - pref.marginV - boxH;
  if (!overlapsY(head, top - gap, top + boxH + gap)) return null;
  const minTop = Math.round(H * safeTop), maxBottom = Math.round(H * (1 - safeBottom));
  const below = head.y + head.h + gap;
  const above = head.y - gap - boxH;
  // keep the side the style chose when there is room on it; otherwise try the other
  const tryBelow = () => (below + boxH <= maxBottom ? { an: 2, marginV: Math.round(H - below - boxH) } : null);
  const tryAbove = () => (above >= minTop ? { an: 8, marginV: Math.round(above) } : null);
  return pref.an === 8 ? tryAbove() ?? tryBelow() : tryBelow() ?? tryAbove();
}

/** The `split` card's speaker half: which 960-px band of the 1920 frame to show. */
export function splitSpeakerY(head, { H = 1920, half = 960, fallback = 200 } = {}) {
  if (!head) return fallback;
  const cy = head.y + head.h / 2;
  // head a little above the band's middle: room under the chin for the captions
  return Math.round(Math.max(0, Math.min(H - half, cy - half * 0.38)));
}

const assSec = (s) => {
  const [h, m, x] = s.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(x);
};

/**
 * Move ASS events of one style per time window. `slots`: [{start, end, slot:{an, marginV}}]
 * on the video's timeline. An event moves when its midpoint is inside a window. Returns the
 * new ASS text and how many events moved.
 */
export function moveAssEvents(ass, slots, { style }) {
  let moved = 0;
  const out = ass.split("\n").map((line) => {
    if (!line.startsWith("Dialogue:")) return line;
    // Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text — text may hold commas
    const parts = line.slice(9).split(",");
    if (parts.length < 10 || parts[3].trim() !== style) return line;
    const mid = (assSec(parts[1].trim()) + assSec(parts[2].trim())) / 2;
    const hit = slots.find((s) => s.slot && mid >= s.start && mid < s.end);
    if (!hit) return line;
    moved++;
    parts[7] = String(hit.slot.marginV);
    const text = parts.slice(9).join(",");
    return `Dialogue:${parts.slice(0, 9).join(",")},{\\an${hit.slot.an}}${text}`;
  });
  return { ass: out.join("\n"), moved };
}
