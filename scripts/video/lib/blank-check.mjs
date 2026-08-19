// blank-check.mjs — refuse to call a clip rendered when nothing was drawn on it.
//
// WHY THIS EXISTS. Two published episodes shipped with five blank scenes each. The cause that
// time was slot names the template does not read, and validate.mjs now catches that before a
// render starts. This is the layer under it: whatever the reason a frame comes out empty, the
// pipeline should say so rather than report success.
//
// Nothing upstream can. ffprobe sees a valid H.264 file of the right length; the composer sees
// a page that loaded; the concat step sees N clips. An empty frame is a perfectly good video of
// nothing, and the only reader who noticed was a human opening the contact sheet.
//
// HOW. Luma range on one sampled frame — YMAX-YMIN from ffmpeg's signalstats. Measured on the
// two broken episodes against their own working scenes:
//
//     scene-hook     (good)          range 171
//     scene-radar    (good)          range 175
//     scene-history  (blank black)   range   0
//     scene-close    (blank black)   range   0
//     scene-fact     (blank white)   range   4
//
// A threshold of 20 sits an order of magnitude clear of both groups. It is deliberately not
// cleverer than that: a frame carrying any text at all has bright pixels against dark ones, and
// anything subtler than "the frame is one flat colour" risks failing legitimate design.
//
// KNOWN LIMIT. It does not catch a frame that is empty but decorated — the same episodes had a
// blank `frame-bold-poster` whose bokeh circles gave it range 123. That one is validate.mjs's
// job, and it does catch it. Two layers, different failure modes.
import { run } from "./proc.mjs";

/** Below this the frame is one flat colour. See the measurements above. */
export const FLAT_RANGE = 20;

/**
 * Luma range of one frame, or null when it cannot be measured.
 *
 * Samples at 2s rather than 0 — entrance animations mean frame 0 is legitimately empty on a
 * great many templates, and flagging those would make this warn on every healthy render.
 */
export async function lumaRange(clipPath, atSec = 2) {
  try {
    // `file=-` sends the metadata to STDOUT. Without it signalstats writes to stderr, which
    // run() only surfaces on a non-zero exit — so a successful probe would come back empty.
    const out = await run("ffmpeg", [
      "-v", "error", "-ss", String(atSec), "-i", clipPath, "-frames:v", "1",
      "-vf", "signalstats,metadata=print:file=-", "-f", "null", "-",
    ]);
    const min = out.match(/signalstats\.YMIN=(\d+(?:\.\d+)?)/);
    const max = out.match(/signalstats\.YMAX=(\d+(?:\.\d+)?)/);
    if (!min || !max) return null;
    return Number(max[1]) - Number(min[1]);
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<{flat: boolean, range: number|null}>}
 */
export async function checkClipDrawn(clipPath, atSec = 2) {
  const range = await lumaRange(clipPath, atSec);
  return { flat: range != null && range < FLAT_RANGE, range };
}
