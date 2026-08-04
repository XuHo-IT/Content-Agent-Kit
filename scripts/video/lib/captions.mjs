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
const escapeAss = (s) =>
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
