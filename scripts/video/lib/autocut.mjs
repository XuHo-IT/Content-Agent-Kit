// autocut.mjs — the pure half of scripts/video/autocut.mjs: silence → cut list → filtergraph.
//
// The method is the one kurbaitaev/ghost-editor (MIT) uses for talking-head takes, ported to
// Node with ffmpeg only — no Python, no Whisper, no model download:
//
//   1. ffmpeg `silencedetect` finds every pause quieter than `noise` lasting ≥ `minSilence`.
//      ghost-editor's defaults (-35 dB, 0.28 s) are kept: shorter than ~0.28 s is a breath
//      between words, and cutting those makes speech sound spliced.
//   2. Each pause is shrunk, not deleted: `pad` seconds of it stay on both sides (0.10 s), so
//      a word's tail and the next word's attack survive the cut.
//   3. Speech runs shorter than `minKeep` are folded into their neighbours — a 60 ms island
//      between two pauses is a click or a lip smack, and keeping it reads as a glitch.
//   4. Optional punch-in: alternate cuts between 100% and ~112% scale. A jump cut on an
//      unchanged frame looks like a mistake; on a re-framed one it looks like editing.
//
// Everything here is pure and unit-tested (tests/autocut.test.mjs); the CLI only runs ffmpeg.

/** Parse ffmpeg's silencedetect stderr into [{start, end}] pauses. */
export function parseSilences(stderr) {
  const out = [];
  let start = null;
  for (const line of String(stderr).split(/\r?\n/)) {
    const s = line.match(/silence_start:\s*(-?[\d.]+)/);
    if (s) {
      start = Math.max(0, Number(s[1]));
      continue;
    }
    const e = line.match(/silence_end:\s*([\d.]+)/);
    if (e && start !== null) {
      out.push({ start, end: Number(e[1]) });
      start = null;
    }
  }
  // A take that ends in silence reports a start with no end; the caller closes it at duration.
  if (start !== null) out.push({ start, end: Infinity });
  return out;
}

/**
 * Turn pauses into the segments to KEEP.
 * @param {{start:number,end:number}[]} silences
 * @param {number} duration  media length in seconds
 * @param {{pad?:number, minKeep?:number, minSilence?:number}} opts
 */
export function keepSegments(silences, duration, { pad = 0.1, minKeep = 0.2, minSilence = 0.28 } = {}) {
  const cuts = silences
    .map((s) => ({ start: Math.max(0, s.start), end: Math.min(duration, s.end) }))
    .filter((s) => s.end - s.start >= minSilence)
    // Shrink each pause by `pad` on both ends. At the very start and end of the media there is
    // no word to protect on the outer side, so the pad only applies inward.
    .map((s) => ({
      start: s.start <= 0.001 ? 0 : s.start + pad,
      end: s.end >= duration - 0.001 ? duration : s.end - pad,
    }))
    .filter((s) => s.end - s.start > 0.02)
    .sort((a, b) => a.start - b.start);

  const keep = [];
  let t = 0;
  for (const c of cuts) {
    if (c.start > t) keep.push({ start: t, end: c.start });
    t = Math.max(t, c.end);
  }
  if (t < duration) keep.push({ start: t, end: duration });

  // Fold islands shorter than minKeep into the previous segment's gap (i.e. drop them),
  // unless dropping would leave nothing at all.
  const solid = keep.filter((k) => k.end - k.start >= minKeep);
  const result = (solid.length ? solid : keep).map((k) => ({ start: round(k.start), end: round(k.end) }));
  return result;
}

const round = (x) => Math.round(x * 1000) / 1000;

/** Totals for the report: how much was cut, how many cuts. */
export function summary(keep, duration) {
  const kept = keep.reduce((a, k) => a + (k.end - k.start), 0);
  return {
    duration: round(duration),
    kept: round(kept),
    removed: round(duration - kept),
    cuts: Math.max(0, keep.length - 1),
    ratio: duration > 0 ? round(kept / duration) : 1,
  };
}

/**
 * Build the -filter_complex string.
 *
 * Each kept segment is trimmed out of video and audio, PTS reset, then concatenated. Audio
 * gets a 12 ms fade at each edge — without it every cut clicks, because the waveform is cut
 * mid-cycle. With `punch`, every other segment is scaled up and centre-cropped back.
 * With `crop` ("w:h:x:y"), that source region is cut out before anything else.
 * With `vertical`, the result is cropped/scaled to 1080×1920 first; otherwise pass the source
 * `width`/`height` so a punch-in can crop back to exactly that size.
 * With `loudnorm`, the concatenated audio is levelled to -16 LUFS / -1.5 dBTP (platform norm).
 *
 * @param {{start:number,end:number}[]} keep
 * @param {{hasVideo?:boolean, punch?:number, vertical?:boolean, loudnorm?:boolean, width?:number, height?:number}} o
 */
export function buildFilter(keep, { hasVideo = true, punch = 0, vertical = false, loudnorm = true, width = 1080, height = 1920, crop = null } = {}) {
  const parts = [];
  const pairs = [];
  keep.forEach((k, i) => {
    const d = (k.end - k.start).toFixed(3);
    const fadeOut = Math.max(0, k.end - k.start - 0.012).toFixed(3);
    if (hasVideo) {
      let v = `[0:v]trim=start=${k.start}:end=${k.end},setpts=PTS-STARTPTS`;
      // `crop` (w:h:x:y in source pixels) runs first — it is how a broadcast lower-third or a
      // burned-in logo is kept out of a vertical re-frame.
      if (crop) v += `,crop=${crop}`;
      if (vertical) v += `,scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
      if (punch > 0 && i % 2 === 1) {
        // scale up, then crop the centre back to the frame size: a punch-in, no letterbox.
        // Crop back to the EXACT frame size: concat refuses segments whose sizes differ by a
        // pixel, and iw/1.12 is rarely an integer.
        const zw = 2 * Math.round((width * (1 + punch)) / 2);
        const zh = 2 * Math.round((height * (1 + punch)) / 2);
        v += `,scale=${zw}:${zh},crop=${width}:${height}`;
      }
      v += `,setsar=1[v${i}]`;
      parts.push(v);
    }
    parts.push(
      `[0:a]atrim=start=${k.start}:end=${k.end},asetpts=PTS-STARTPTS,` +
        `afade=t=in:st=0:d=0.012,afade=t=out:st=${fadeOut}:d=0.012[a${i}]`,
    );
    pairs.push(hasVideo ? `[v${i}][a${i}]` : `[a${i}]`);
    void d;
  });
  const n = keep.length;
  const aOut = loudnorm ? "[acat]" : "[aout]";
  parts.push(`${pairs.join("")}concat=n=${n}:v=${hasVideo ? 1 : 0}:a=1${hasVideo ? "[vout]" : ""}${aOut}`);
  if (loudnorm) parts.push(`[acat]loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);
  return parts.join(";");
}

/** Remap a timestamp in the source onto the cut timeline (for captions / markers). */
export function remapTime(t, keep) {
  let acc = 0;
  for (const k of keep) {
    if (t < k.start) return round(acc);
    if (t <= k.end) return round(acc + (t - k.start));
    acc += k.end - k.start;
  }
  return round(acc);
}
