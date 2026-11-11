// speech-edit.mjs — editing a talking-head take by what was SAID, not by how loud it was.
//
// autocut.mjs removes pauses: it hears silence, not words. A take also has the things a human
// editor cuts by ear — "ờ", "ừm", a word said twice, a sentence started, abandoned and said
// again. Those are not silent, so silencedetect keeps all of them. With a word-timed
// transcript they can be found by text:
//
//   filler   a hesitation sound on its own ("ờ", "ừm", "uh")
//   repeat   the same 1–6 words twice in a row → the FIRST is dropped (the second is the one
//            the speaker meant: people repeat to correct themselves)
//   retake   a sentence whose start is said again by the next sentence → the earlier one goes
//
// Every decision carries its reason and the word's index, so a human reads the review, then
// overrides with --remove-words / --keep-words. Idea from MRT Keyword (Phúc Anh MRT; no
// licence published, so nothing was copied — rules re-derived and written here from scratch).
//
// Also here, because they are the same "by the words" idea:
//   resolveAnchors  a card's (B-roll's, behind-text's) `at` may be a spoken word ("tăng") instead of seconds
//   sfxDensity      a sound on every card is noise: ≤ 2 in any 3 s, ≤ 0.7 per second
//   applyWordFixes  correct what speech-to-text misheard, in the captions only
//
// Pure functions; tests in tests/speech-edit.test.mjs.

/** Hesitation sounds, Vietnamese then English. Only ever dropped when they are a whole word. */
export const FILLERS = new Set([
  "ờ", "ơ", "ừ", "ừm", "ờm", "ưm", "hừm", "ầ", "ờờ", "ừa", "ậm", "hmm", "hm",
  "uh", "um", "uhm", "erm", "er", "ah",
]);

// Vietnamese says some single words twice on purpose — "từ từ", "dần dần", "rất rất" — so a
// single-word repeat of these is kept unless the speaker clearly paused between the two.
export const INTENDED_DOUBLES = new Set(["từ", "dần", "luôn", "nhiều", "rất", "mãi", "đi", "nhé", "nha", "thật", "cứ", "vừa", "lâu", "xa", "gần"]);

/** Lower-case, punctuation off, diacritics KEPT ("ma" and "mà" are different words). */
export const norm = (w) => String(w).toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, "");

/** Diacritics off too — for matching an anchor the agent typed without accents. */
export const fold = (w) => norm(w).replace(/đ/g, "d").normalize("NFD").replace(/\p{M}+/gu, "");

/**
 * Sentence id per word. Uses the transcript's own segment index when it has one (`seg`), and
 * otherwise closes a sentence at . ? ! … or a pause over 0.6 s.
 */
export function sentenceIds(words) {
  if (words.length && words.every((w) => Number.isInteger(w.seg))) return words.map((w) => w.seg);
  let id = 0;
  return words.map((w, i) => {
    const mine = id;
    const next = words[i + 1];
    if (/[.!?…]$/.test(w.w) || (next && next.start - w.end > 0.6)) id++;
    return mine;
  });
}

/** "12-18,40" → Set{12..18, 40}. */
export function parseRanges(s) {
  const out = new Set();
  for (const part of String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
    const [a, b] = part.split("-").map(Number);
    if (!Number.isInteger(a) || (b !== undefined && !Number.isInteger(b))) throw new Error(`bad word range "${part}" (want 12-18,40)`);
    for (let i = a; i <= (b ?? a); i++) out.add(i);
  }
  return out;
}

/**
 * Which words to drop, and why. → Map(index → "filler" | "repeat×n" | "retake" | "manual").
 * @param {{w:string,start:number,end:number,seg?:number}[]} words  sorted by start
 */
export function findSpeechCuts(words, { removeWords = "", keepWords = "" } = {}) {
  const drop = new Map();
  const n = words.length;
  const t = words.map((w) => norm(w.w));

  const sid = sentenceIds(words);
  t.forEach((x, i) => { if (FILLERS.has(x)) drop.set(i, "filler"); });

  // Repeated runs, longest first so "ở trong ở trong" is one repeat×2, not two repeat×1.
  // A copy that ends one sentence and starts the next is a retake, and is labelled so.
  for (let size = 6; size >= 1; size--) {
    for (let i = 0; i + 2 * size <= n; ) {
      const a = t.slice(i, i + size), b = t.slice(i + size, i + 2 * size);
      const same = a.every((x, k) => x && x === b[k]);
      const pause = words[i + size].start - words[i + size - 1].end;
      if (same && (size > 1 || !INTENDED_DOUBLES.has(a[0]) || pause > 0.3) && !a.some((_, k) => drop.has(i + k))) {
        const why = sid[i] !== sid[i + size] ? "retake" : `repeat×${size}`;
        for (let k = i; k < i + size; k++) drop.set(k, why);
        i += size;
      } else i++;
    }
  }

  // Retakes: sentence X, then sentence Y that starts by saying X again (or nearly).
  const bySent = new Map();
  sid.forEach((s, i) => bySent.set(s, [...(bySent.get(s) ?? []), i]));
  const order = [...bySent.keys()].sort((a, b) => a - b);
  for (let k = 0; k + 1 < order.length; k++) {
    const xs = bySent.get(order[k]).filter((i) => !drop.has(i));
    const ys = bySent.get(order[k + 1]).filter((i) => !drop.has(i));
    if (xs.length < 2 || ys.length < xs.length) continue;
    const tx = xs.map((i) => t[i]), ty = ys.slice(0, xs.length + 2).map((i) => t[i]);
    if (overlapRatio(tx, ty) >= 0.75) for (const i of bySent.get(order[k])) if (!drop.has(i)) drop.set(i, "retake");
  }

  for (const i of parseRanges(removeWords)) if (i < n) drop.set(i, "manual");
  for (const i of parseRanges(keepWords)) drop.delete(i);
  return drop;
}

/** How much of `a` appears, in order, at the start of `b` (longest common subsequence / |a|). */
function overlapRatio(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length] / a.length;
}

/**
 * Source-time spans to remove for the dropped words. A run of dropped words is removed from
 * the end of the kept word before it to the start of the kept word after it, minus `pad` on
 * each side — the same breath autocut leaves, so a cut here and a pause cut sound alike.
 */
export function dropSpans(words, drop, { pad = 0.06 } = {}) {
  const spans = [];
  for (let i = 0; i < words.length; ) {
    if (!drop.has(i)) { i++; continue; }
    let j = i;
    while (j + 1 < words.length && drop.has(j + 1)) j++;
    const before = words[i - 1], after = words[j + 1];
    const start = before ? Math.max(before.end + pad, words[i].start - pad) : words[i].start - pad;
    const end = after ? Math.min(after.start - pad, words[j].end + pad) : words[j].end + pad;
    if (end - start > 0.04) spans.push({ start: r3(Math.max(0, start)), end: r3(end) });
    i = j + 1;
  }
  return spans;
}

/** keep ranges minus spans; pieces shorter than `minKeep` disappear (a 60 ms sliver is a click). */
export function subtractSpans(keep, spans, { minKeep = 0.12 } = {}) {
  let out = keep.map((k) => ({ ...k }));
  for (const s of spans) {
    out = out.flatMap((k) => {
      if (s.end <= k.start || s.start >= k.end) return [k];
      const parts = [];
      if (s.start > k.start) parts.push({ start: k.start, end: s.start });
      if (s.end < k.end) parts.push({ start: s.end, end: k.end });
      return parts;
    });
  }
  return out.filter((k) => k.end - k.start >= minKeep).map((k) => ({ start: r3(k.start), end: r3(k.end) }));
}

/** Plain-text review: every word with its index, dropped ones as ~~word~~(i,reason). */
export function reviewText(words, drop) {
  const sid = sentenceIds(words);
  const lines = [];
  let cur = null, buf = [];
  const flush = () => { if (buf.length) lines.push(`[${String(cur).padStart(3, "0")}] ${buf.join(" ")}`); buf = []; };
  words.forEach((w, i) => {
    if (sid[i] !== cur) { flush(); cur = sid[i]; buf.push(`${w.start.toFixed(2)}s #${i}:`); }
    buf.push(drop.has(i) ? `~~${w.w}~~(${i},${drop.get(i)})` : w.w);
  });
  flush();
  const said = words.reduce((a, w) => a + (w.end - w.start), 0);
  const cut = [...drop.keys()].reduce((a, i) => a + (words[i].end - words[i].start), 0);
  lines.push("", `${drop.size} of ${words.length} words dropped (${cut.toFixed(1)}s of ${said.toFixed(1)}s spoken).`);
  lines.push(`Override: --remove-words 12-18 · --keep-words 40-41  (indices are the #numbers above)`);
  return lines.join("\n");
}

/**
 * Find a spoken word or phrase. → the first word's start, or null.
 * Matches with diacritics first, then without (agents often type "tang" for "tăng").
 * `near` (seconds) looks from 1 s before it, for a word said more than once.
 */
export function findPhrase(words, phrase, { near = null } = {}) {
  const want = String(phrase).split(/\s+/).filter(Boolean);
  if (!want.length) return null;
  const from = near === null ? -Infinity : near - 1;
  for (const key of [norm, fold]) {
    const w = want.map(key);
    for (let i = 0; i + w.length <= words.length; i++) {
      if (words[i].start < from) continue;
      if (w.every((x, k) => key(words[i + k].w) === x)) return words[i].start;
    }
  }
  return null;
}

/**
 * Turn string `at`s on cards and B-roll into seconds, in place on a copy.
 * `"at": "tăng"` → when "tăng" is first said; `"at": "tăng", "near": 70` → the one near 70 s;
 * `"lead": 0.2` → that many seconds BEFORE the word (a card should be up as the word lands).
 * → { edl, problems[] }
 */
export function resolveAnchors(edl, words) {
  const problems = [];
  const fix = (list, kind) =>
    (list ?? []).map((c, i) => {
      if (typeof c.at !== "string") return c;
      const t = findPhrase(words, c.at, { near: Number.isFinite(c.near) ? c.near : null });
      if (t === null) {
        problems.push(`${kind}[${i}].at "${c.at}" is not a word in the transcript${Number.isFinite(c.near) ? ` near ${c.near}s` : ""} — use the transcript's spelling, or seconds`);
        return c;
      }
      return { ...c, word: c.at, at: r3(Math.max(0, t - (Number(c.lead) || 0.15))) };
    });
  return { edl: { ...edl, cards: fix(edl.cards, "cards"), broll: fix(edl.broll, "broll"), ...(edl.behind ? { behind: fix(edl.behind, "behind") } : {}) }, problems };
}

/**
 * Sound-effect density. Each event: {t, label}. One sound per card is the most a viewer
 * takes before the sounds stop meaning anything.
 */
export function sfxDensity(events, { duration = null, maxIn3s = 2, maxPerSec = 0.7 } = {}) {
  const ev = [...events].sort((a, b) => a.t - b.t);
  const warn = [];
  ev.forEach((e, i) => {
    const n = ev.slice(i).filter((x) => x.t < e.t + 3).length;
    if (n > maxIn3s) warn.push(`${e.t.toFixed(2)}s: ${n} sounds within 3 s (max ${maxIn3s}) — drop one`);
  });
  const span = duration ?? (ev.length ? ev[ev.length - 1].t - ev[0].t : 0);
  if (ev.length > 2 && span > 0 && ev.length / span > maxPerSec)
    warn.push(`${ev.length} sounds in ${span.toFixed(0)}s = ${(ev.length / span).toFixed(2)}/s (max ${maxPerSec}/s)`);
  return warn;
}

/** Caption corrections: [[pattern, replacement], …], each regex applied to every word's text. */
export function applyWordFixes(words, fixes = []) {
  const rx = fixes.map(([p, r]) => [new RegExp(p, "giu"), r]);
  return words.map((w) => ({ ...w, w: rx.reduce((s, [p, r]) => s.replace(p, r), w.w) })).filter((w) => w.w.trim());
}

const r3 = (x) => Math.round(x * 1000) / 1000;
