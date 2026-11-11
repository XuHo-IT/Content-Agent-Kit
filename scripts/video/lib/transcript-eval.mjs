// transcript-eval.mjs — how close is a machine transcript to a checked one? Pure; tests in
// tests/creator-pack.test.mjs. CLI: scripts/video/transcript-diff.mjs.
//
// Two numbers decide whether a speech model is good enough for word-by-word captions:
//   WER   — word error rate after aligning the two word lists (substitutions + insertions +
//           deletions, over the reference length). Diacritics COUNT: "ma" for "mà" is an
//           error in Vietnamese, a different word on screen. `werFolded` ignores them, to
//           tell "heard the word, lost its tone marks" apart from "heard something else".
//   timing — for words both transcripts agree on, how far apart their start times are. A
//           caption that lights the word 0.3 s late reads as out of sync.

import { norm, fold } from "./speech-edit.mjs";

/** Levenshtein alignment of two token lists → [{op: "=", "S", "I", "D", r, h}] with indices. */
export function alignWords(ref, hyp) {
  const n = ref.length, m = hyp.length;
  const d = Array.from({ length: n + 1 }, (_, i) => Uint32Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
  const ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1)) {
      ops.push({ op: ref[i - 1] === hyp[j - 1] ? "=" : "S", r: i - 1, h: j - 1 });
      i--; j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { ops.push({ op: "D", r: i - 1, h: null }); i--; }
    else { ops.push({ op: "I", r: null, h: j - 1 }); j--; }
  }
  return ops.reverse();
}

/**
 * ref, hyp: [{w, start, end}] (wordsFromTranscript). Optionally limited to [from, to] seconds
 * of the reference. → { wer, werFolded, ref, hyp, subs, ins, dels, timing: {matched, meanAbs,
 * p90Abs, within150ms}, worst: [{ref, hyp}] }
 */
export function compareTranscripts(ref, hyp, { from = -Infinity, to = Infinity } = {}) {
  const R = ref.filter((w) => w.start >= from && w.end <= to);
  const H = hyp.filter((w) => w.start >= from - 1 && w.end <= to + 1);
  const rt = R.map((w) => norm(w.w)).filter(Boolean), ht = H.map((w) => norm(w.w)).filter(Boolean);
  const Rk = R.filter((w) => norm(w.w)), Hk = H.filter((w) => norm(w.w));
  const ops = alignWords(rt, ht);
  const count = (o) => ops.filter((x) => x.op === o).length;
  const subs = count("S"), ins = count("I"), dels = count("D");
  const folded = alignWords(rt.map(fold), ht.map(fold));
  const fErr = folded.filter((x) => x.op !== "=").length;
  const deltas = ops.filter((x) => x.op === "=").map((x) => Math.abs(Rk[x.r].start - Hk[x.h].start)).sort((a, b) => a - b);
  const pct = (p) => (deltas.length ? deltas[Math.min(deltas.length - 1, Math.floor(p * deltas.length))] : null);
  return {
    ref: rt.length, hyp: ht.length, subs, ins, dels,
    wer: rt.length ? +((subs + ins + dels) / rt.length).toFixed(4) : null,
    werFolded: rt.length ? +(fErr / rt.length).toFixed(4) : null,
    timing: {
      matched: deltas.length,
      meanAbs: deltas.length ? +(deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(3) : null,
      p90Abs: pct(0.9) === null ? null : +pct(0.9).toFixed(3),
      within150ms: deltas.length ? +(deltas.filter((x) => x <= 0.15).length / deltas.length).toFixed(3) : null,
    },
    worst: ops.filter((x) => x.op === "S").slice(0, 12).map((x) => ({ ref: Rk[x.r].w, hyp: Hk[x.h].w, at: +Rk[x.r].start.toFixed(2) })),
  };
}
