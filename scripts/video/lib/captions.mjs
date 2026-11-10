// captions.mjs — turn the narration into on-screen captions.
//
// Most short-form video is watched with the sound off. The kit wrote `script.txt` for CapCut
// to auto-caption, which means opening CapCut — the exact step this pipeline exists to avoid.
//
// WHAT THE TIMING IS, precisely, because a caption that drifts is worse than none:
//
//   · Scene BOUNDARIES are exact. render.mjs already knows when each scene's narration
//     starts, to the millisecond, because it built the audio track itself.
//   · WITHIN a scene, cues are apportioned by character count. That is an estimate — there
//     is no forced alignment here and no model that would give one without a dependency.
//
// So error accumulates inside a scene and resets to zero at every scene boundary. On the
// 6–12 second scenes this kit produces, that is a caption landing within a syllable or two.
// It is not good enough for a two-minute unbroken take, and this file does not pretend to be.

/** ASS has no escape for braces — they open an override block. Replace, do not strip. */
export const escapeAss = (s) =>
  String(s).replace(/\{/g, "(").replace(/\}/g, ")").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

const dense = (s) => s.replace(/\s+/g, "").length; // speaking time tracks syllables, not spaces

/**
 * Break one scene's narration into caption-sized pieces.
 *
 * Greedy fill to `max`, preferring to break where the speaker would: after a full stop, then
 * after a comma. A chunk shorter than `min` is merged backwards rather than shown, because a
 * two-word cue on screen for a third of a second reads as a flicker, not as a caption.
 */
export function chunkText(text, { min = 16, max = 46 } = {}) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const out = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      out.push(cur);
      cur = w;
      continue;
    }
    cur = next;
    // A sentence ended and we have enough to be worth reading — break here rather than
    // running the next sentence's opening words onto the same card.
    if (/[.!?…]$/.test(w) && cur.length >= min) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);

  // Merge a runt tail backwards.
  if (out.length > 1 && out[out.length - 1].length < min) {
    const tail = out.pop();
    out[out.length - 1] += ` ${tail}`;
  }
  return out;
}

/**
 * Cues for a whole video.
 * @param {Array<{text: string, startSec: number, durSec: number}>} scenes
 *        `durSec` is the SPOKEN length, not the visual one — a caption must not hang over
 *        the inter-scene silence or the three-second outro hold.
 */
export function buildCues(scenes, opts = {}) {
  const cues = [];
  for (const s of scenes) {
    const chunks = chunkText(s.text, opts);
    if (!chunks.length) continue;
    const total = chunks.reduce((a, c) => a + dense(c), 0) || 1;
    let t = s.startSec;
    chunks.forEach((c, i) => {
      // The last chunk takes the remainder, so rounding never leaves a gap or an overrun
      // at the scene's end — the one place the timing is known exactly.
      const d = i === chunks.length - 1 ? s.startSec + s.durSec - t : (s.durSec * dense(c)) / total;
      cues.push({ startSec: t, endSec: t + d, text: c });
      t += d;
    });
  }
  return cues;
}

/** h:mm:ss.cc — ASS wants centiseconds and a single-digit hour. */
export function assTime(sec) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${rest.toFixed(2).padStart(5, "0")}`;
}

/** #rrggbb → ASS's &HaabbggrrK. Note the byte order is reversed AND alpha is inverted. */
export function assColour(hex, alpha = 0) {
  const h = String(hex).replace("#", "");
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return `&H${a.toString(16).padStart(2, "0")}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase();
}

/**
 * Render cues as an ASS subtitle file.
 *
 * Styled off the theme when one is set, so captions do not fight the frame they sit on.
 * Without a theme: white on a translucent black box, which survives any footage underneath.
 */
export function toAss(cues, { width, height, theme = null, font = "Arial", sizeRatio = 0.045 } = {}) {
  const size = Math.round(height * sizeRatio);
  const marginV = Math.round(height * 0.12); // clear of the platform's own UI chrome
  const marginH = Math.round(width * 0.08);

  // BorderStyle 3 = opaque box behind the text. On stock footage an outline alone is not
  // enough: light text over a light frame disappears exactly where it matters.
  const primary = assColour(theme?.ink ?? "#ffffff");
  const back = theme ? assColour(theme.bg, 0.12) : assColour("#000000", 0.35);

  const head = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour," +
      " Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline," +
      " Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Cap,${font},${size},${primary},${primary},${back},${back},` +
      `-1,0,0,0,100,100,0,0,3,${Math.max(2, Math.round(size * 0.14))},0,2,${marginH},${marginH},${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const body = cues.map(
    (c) => `Dialogue: 0,${assTime(c.startSec)},${assTime(c.endSec)},Cap,,0,0,0,,${escapeAss(c.text)}`,
  );

  return `${[...head, ...body].join("\n")}\n`;
}

// ── active-word captions ─────────────────────────────────────────────────────
//
// The 2026 short-form caption: two or three words on screen at a time, big, no box, with the
// word being SPOKEN lit in an accent colour and nudged up in size. It is how talking-head
// editors like kurbaitaev/ghost-editor (MIT) caption, and it is what viewers now read as
// "edited" rather than "auto-captioned". Same timing model as above: scene boundaries exact,
// word times apportioned by syllable density inside each cue.

/** Split cues into small groups with per-word timing. */
export function activeWordGroups(cues, { maxWords = 3, maxChars = 20 } = {}) {
  const groups = [];
  for (const c of cues) {
    const words = String(c.text).trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const total = words.reduce((a, w) => a + Math.max(1, dense(w)), 0);
    let t = c.startSec;
    const timed = words.map((w, i) => {
      const d = i === words.length - 1 ? c.endSec - t : ((c.endSec - c.startSec) * Math.max(1, dense(w))) / total;
      const out = { w, start: t, end: t + d };
      t += d;
      return out;
    });
    let cur = [];
    const flush = () => {
      if (cur.length) groups.push({ start: cur[0].start, end: cur[cur.length - 1].end, words: cur });
      cur = [];
    };
    for (const tw of timed) {
      const len = cur.map((x) => x.w).join(" ").length + tw.w.length + 1;
      if (cur.length >= maxWords || (cur.length && len > maxChars)) flush();
      cur.push(tw);
      // A sentence end closes the group even if it is short — never run two sentences together.
      if (/[.!?…]$/.test(tw.w)) flush();
    }
    flush();
  }
  return groups;
}

/**
 * ASS for active-word captions: one Dialogue per WORD, each showing its whole group with that
 * word recoloured and scaled. Placed in the lower-middle third — under a speaker's chin on a
 * talking head, clear of the platform's caption/like rail at the very bottom.
 */
export function toAssActive(
  cues,
  {
    width, height, theme = null, font = "Arial", accent = null, sizeRatio = 0.062, upper = false, lower = false,
    maxWords = 3, boxed = false, _groups: opts_groups = null,
    // Look knobs for the talking-head edit styles (lib/edit-styles.mjs). Defaults = the original look.
    align = 2, // ASS numpad alignment: 2 bottom-centre, 5 middle-centre
    marginVRatio = 0.26, // distance from the bottom edge — 0.26 keeps clear of the like/comment rail
    activeTag = null, // override for the spoken word; {hot} is replaced by the accent colour
    restTag = "", // override for the other words on the card (e.g. dimmed for line-focus)
    popTag = "{\\fad(60,0)}", // how a new card enters
    ink: inkOverride = null,
    boxColour = null, // with boxed: an opaque plate in this colour instead of the dark translucent one
  } = {},
) {
  const size = Math.round(height * sizeRatio);
  const marginV = Math.round(height * marginVRatio);
  const marginH = Math.round(width * 0.07);
  const ink = assColour(inkOverride ?? (theme?.ink && theme?.bg && relDark(theme.bg) ? theme.ink : "#ffffff"));
  const hot = assColour(accent ?? "#ffe14d");
  const outline = assColour("#000000");
  const head = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour," +
      " Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline," +
      " Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // BorderStyle 1 = outline + shadow, no box: the box is what reads as auto-captions — over
    // footage. Over a designed frame the accent word can land on a panel of the SAME colour
    // (an orange word on frame-trend-compare-wipe's orange pane), so `boxed` puts a dark
    // translucent plate behind the line (BorderStyle 3) and the accent always reads.
    boxed
      ? `Style: Word,${font},${size},${ink},${ink},${boxColour ? assColour(boxColour) : assColour("#000000", 0.35)},${boxColour ? assColour(boxColour) : assColour("#000000", 0.35)},` +
        `-1,0,0,0,100,100,0,0,3,${Math.max(8, Math.round(size * 0.22))},0,${align},${marginH},${marginH},${marginV},1`
      : `Style: Word,${font},${size},${ink},${ink},${outline},${assColour("#000000", 0.4)},` +
        `-1,0,0,0,100,100,0,0,1,${Math.max(3, Math.round(size * 0.09))},${Math.max(2, Math.round(size * 0.05))},${align},${marginH},${marginH},${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const fmt = (w) => escapeAss(upper ? w.toLocaleUpperCase("vi") : lower ? w.toLocaleLowerCase("vi") : w);
  const on = activeTag ? activeTag.replaceAll("{hot}", hot) : `{\\c${hot}&\\fscx112\\fscy112}`;
  const body = [];
  for (const g of opts_groups ?? activeWordGroups(cues, { maxWords })) {
    g.words.forEach((cur, i) => {
      const text = g.words
        .map((x, j) => (j === i ? `${on}${fmt(x.w)}{\\r}` : restTag ? `${restTag}${fmt(x.w)}{\\r}` : fmt(x.w)))
        .join(" ");
      // The first word of a group pops in; the rest of the group swaps instantly.
      const pop = i === 0 ? popTag : "";
      body.push(`Dialogue: 0,${assTime(cur.start)},${assTime(cur.end)},Word,,0,0,0,,${pop}${text}`);
    });
  }
  return `${[...head, ...body].join("\n")}\n`;
}

// ── real word timings (talking-head footage) ─────────────────────────────────
//
// For narration this kit synthesised, word times are estimated (see above). For someone
// actually speaking on camera they come from a speech-to-text pass — faster-whisper,
// whisperX or whisper.cpp — and are exact. These read the common JSON shapes those tools
// write, so the kit stays dependency-free and the transcript step stays the user's choice.

/** Flatten a transcript into [{w, start, end}]. Accepts {segments:[{words:[…]}]}, a bare word array, or whisper.cpp's {transcription:[…]}. */
export function wordsFromTranscript(t) {
  const out = [];
  const push = (w) => {
    const text = String(w.w ?? w.word ?? w.text ?? "").trim();
    const start = Number(w.start ?? w.offsets?.from / 1000);
    const end = Number(w.end ?? w.offsets?.to / 1000);
    if (text && Number.isFinite(start) && Number.isFinite(end) && end >= start) out.push({ w: text, start, end });
  };
  if (Array.isArray(t)) t.forEach(push);
  else if (Array.isArray(t?.segments)) for (const s of t.segments) (s.words ?? []).forEach(push);
  else if (Array.isArray(t?.transcription)) t.transcription.forEach(push);
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Group timed words into 2–3-word cards. A card closes at a sentence end, at maxWords /
 * maxChars, or at a gap longer than `maxGap` — a caption should not hang across a pause.
 * Each word is extended to the next word's start so the active highlight never blinks off.
 */
export function groupTimedWords(words, { maxWords = 3, maxChars = 20, maxGap = 0.6 } = {}) {
  const groups = [];
  let cur = [];
  const flush = () => {
    if (cur.length) groups.push({ start: cur[0].start, end: cur[cur.length - 1].end, words: cur });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = cur[cur.length - 1];
    const len = cur.map((x) => x.w).join(" ").length + w.w.length + 1;
    if (cur.length && (cur.length >= maxWords || len > maxChars || w.start - prev.end > maxGap)) flush();
    const next = words[i + 1];
    const end = next && next.start - w.end <= maxGap ? next.start : w.end;
    cur.push({ ...w, end });
    if (/[.!?…]$/.test(w.w)) flush();
  });
  flush();
  return groups;
}

/** Active-word ASS from real word timings. Same look as toAssActive. */
export function toAssActiveWords(words, opts = {}) {
  const groups = groupTimedWords(words, opts);
  // Re-use toAssActive's header and line format by handing it pre-timed groups.
  return toAssActive([], { ...opts, _groups: groups });
}

/** Is a #rrggbb colour dark? (Light-canvas themes keep white captions with a black outline.) */
function relDark(hex) {
  const h = String(hex).replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
}

/**
 * Escape a path for ffmpeg's `subtitles=` filter.
 *
 * This is the step that breaks on Windows and nowhere else: the filtergraph parser treats
 * `:` as an option separator, so `C:\x\y.ass` is read as a filter option named `C`.
 * Backslashes become forward slashes, then the drive colon is escaped.
 */
export function escapeSubtitlePath(p) {
  return String(p).replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}
