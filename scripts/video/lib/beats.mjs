// beats.mjs — where the beats are in a music track, with no dependencies.
// Pure functions over PCM samples; tests in tests/delivery.test.mjs. CLI: beat-grid.mjs.
//
// The classic three steps, kept small:
//   1. onset envelope — log energy per 512-sample hop, positive changes only (a drum hit is a
//      sudden rise; a fade is not), with the slow trend removed
//   2. tempo — autocorrelation of the envelope over 70–180 BPM, weighted toward ~110 BPM
//      (octave errors — 60 vs 120 — are the usual failure; the weight breaks the tie)
//   3. phase — the offset whose beat grid lands on the most onset energy
// Good on music with a pulse (pop, EDM, lo-fi, hip-hop); honest about the rest: `confidence`
// is low for ambient or rubato tracks, and then cutting "on the beat" is the wrong idea anyway.

export const HOP = 512;

/** Mono float samples → onset strength per hop. */
export function onsetEnvelope(samples, { hop = HOP } = {}) {
  const n = Math.floor(samples.length / hop);
  const e = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * hop; j < (i + 1) * hop; j++) s += samples[j] * samples[j];
    e[i] = Math.log(1e-10 + s / hop);
  }
  const env = new Float64Array(n);
  for (let i = 1; i < n; i++) env[i] = Math.max(0, e[i] - e[i - 1]);
  // remove the slow trend (a moving average over ~0.5 s) so loud sections do not dominate
  const w = 16;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let m = 0, c = 0;
    for (let k = Math.max(0, i - w); k <= Math.min(n - 1, i + w); k++) { m += env[k]; c++; }
    out[i] = Math.max(0, env[i] - m / c);
  }
  return out;
}

/** → { bpm, confidence 0..1 } from an onset envelope at `fps` hops per second. */
export function estimateTempo(env, fps, { min = 70, max = 180, prefer = 110 } = {}) {
  const n = env.length;
  let best = { bpm: 0, score: -Infinity }, total = 0;
  const scores = [];
  for (let bpm = min; bpm <= max; bpm += 0.5) {
    const lag = (60 / bpm) * fps;
    const l0 = Math.floor(lag), fr = lag - l0;
    let s = 0;
    for (let i = 0; i + l0 + 1 < n; i++) s += env[i] * (env[i + l0] * (1 - fr) + env[i + l0 + 1] * fr);
    s /= Math.max(1, n - l0);
    // log-Gaussian prior around `prefer`: halves the octave-error rate on a pulse track
    const w = Math.exp(-0.5 * (Math.log2(bpm / prefer) / 0.9) ** 2);
    const sc = s * w;
    scores.push(sc);
    total += sc;
    if (sc > best.score) best = { bpm, score: sc };
  }
  const mean = total / scores.length;
  return { bpm: best.bpm, confidence: best.score > 0 ? Math.max(0, Math.min(1, 1 - mean / best.score)) : 0 };
}

/**
 * Beat times (s) for a tempo. Period and phase are fitted together: a tempo 1% off drifts a
 * fifth of a second in 20 s, so the coarse BPM is refined (±2%, 0.02 BPM steps) to the grid
 * that lands on the most onset energy. → { beats, bpm } (the refined tempo).
 */
export function beatTimes(env, fps, bpm, { duration = env.length / fps } = {}) {
  // peak-picked view: each hop takes the max of its neighbours, so a grid point one hop off
  // a hit still counts
  const v = env.map((x, i) => Math.max(x, env[i - 1] ?? 0, env[i + 1] ?? 0));
  let best = { score: -1, period: (60 / bpm) * fps, phase: 0 };
  for (let b = bpm * 0.98; b <= bpm * 1.02; b += 0.02) {
    const period = (60 / b) * fps;
    for (let ph = 0; ph < period; ph += 0.5) {
      let s = 0;
      for (let t = ph; t < v.length; t += period) s += v[Math.round(t)] ?? 0;
      if (s > best.score) best = { score: s, period, phase: ph };
    }
  }
  const beats = [];
  for (let t = best.phase; t / fps <= duration; t += best.period) beats.push(+(t / fps).toFixed(3));
  return { beats, bpm: +((60 * fps) / best.period).toFixed(1) };
}

/** The beat nearest to `t` when it is within `tol` seconds, else t itself. */
export function snapToBeat(t, beats, tol = 0.12) {
  let best = t, d = tol;
  for (const b of beats) { const x = Math.abs(b - t); if (x <= d) { d = x; best = b; } }
  return best;
}
