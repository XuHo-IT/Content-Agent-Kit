#!/usr/bin/env node
// cover.mjs — a cover image for a short: one frame where the face is clear + the title, big.
//
//   node scripts/video/cover.mjs short.mp4 --title "Đổi bằng lái không cần xếp hàng" --out cover.jpg
//   node scripts/video/cover.mjs short.mp4 --title "…" --faces --style pop --theme clinic-sage
//   node scripts/video/cover.mjs short.mp4 --title "…" --at 4.2
//
// The platforms show this before anyone presses play, so it is the first frame that has to
// sell the video: a face (people stop for faces), a title ≤ 60 characters (longer ones are cut
// off in the grid), set in the same hook look as the video so cover and video are one thing.
// Hand it to make-post.mjs --thumbnail.
//
// For a talking-head short, prefer `talking-head.mjs --cover`: it takes the frame from BEFORE
// the captions were burned in. Run on a finished video, this picks up whatever caption was on
// screen at that moment.
//
// --faces picks the frame with the biggest steady face in the first 40% of the video and keeps
// the title off it (Python + mediapipe, see lib/vision.mjs). Without it: --at, else 1.0 s.
// ENV: none. Needs ffmpeg.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "./lib/proc.mjs";
import { escapeAss, escapeSubtitlePath } from "./lib/captions.mjs";
import { resolveStyle, hookStyle, STYLE_IDS } from "./lib/edit-styles.mjs";
import { resolveTheme, hslToRgb } from "./lib/theme.mjs";
import { headBox, textSlot } from "./lib/faces.mjs";

export const TITLE_MAX = 60;

/** Problems with a cover title ([] = fine). */
export function titleProblems(title) {
  const t = String(title ?? "").trim();
  if (!t) return ["--title is required — the cover is the title on a face"];
  const n = [...t].length;
  return n > TITLE_MAX ? [`title is ${n} characters — keep it ≤ ${TITLE_MAX}, the platform grid cuts the rest`] : [];
}

/**
 * Of face windows [{t, head}], the one to use for the cover: the biggest head, preferring the
 * first 40% of the video (where the hook is). → t, or null.
 */
export function pickCoverTime(windows, { duration, early = 0.4, avoid = [] } = {}) {
  const ok = (w) => w.head && !avoid.some((a) => w.t >= a.start && w.t < a.end);
  const pool = windows.filter((w) => ok(w) && w.t <= duration * early);
  const best = (pool.length ? pool : windows.filter(ok)).sort((a, b) => b.head.w * b.head.h - a.head.w * a.head.h)[0];
  return best ? best.t : null;
}

/**
 * Write `out` (jpg/png): `video` at second `at`, through `vf` (e.g. the short's grade), framed
 * 9:16, with `title` in the style's hook look (bigger), moved off `head` when given.
 */
export async function makeCover({ video, at, title, style, accent, head = null, vf = null, out, W = 1080, H = 1920 }) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "cak-cover-"));
  try {
    const hook = hookStyle(style, { width: W, height: H, accent });
    // the cover is seen as a grid thumbnail: 30% bigger than the in-video hook
    const st = hook.style.split(",");
    st[2] = String(Math.round(Number(st[2]) * 1.3));
    const size = Number(st[2]);
    // a cover title sits at the top unless that is where the face is
    st[18] = "8";
    st[21] = String(Math.round(H * 0.1));
    const lines = Math.max(1, Math.ceil(([...title].length * size * 0.55) / (W - 140)));
    const slot = textSlot(head, { H, boxH: Math.round(lines * size * 1.2), pref: { an: 8, marginV: Math.round(H * 0.1) } });
    const tag = hook.tag.replace(/\\fad\([^)]*\)/, "");
    const ev = `Dialogue: 0,0:00:00.00,0:00:10.00,Hook,,0,0,${slot ? slot.marginV : 0},,${slot ? `{\\an${slot.an}}` : ""}${tag}${escapeAss(hook.text(title))}`;
    const ass = [
      "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`, "WrapStyle: 0", "ScaledBorderAndShadow: yes", "",
      "[V4+ Styles]",
      "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
      st.join(","), "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text", ev, "",
    ].join("\n");
    const assFile = path.join(work, "cover.ass");
    fs.writeFileSync(assFile, ass);
    const chain = [`scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1`, vf, `subtitles='${escapeSubtitlePath(assFile)}'`].filter(Boolean).join(",");
    await run("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-ss", String(at), "-i", video, "-frames:v", "1", "-vf", chain, "-q:v", "2", out]);
    return { at, moved: Boolean(slot) };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `cover.mjs — cover image: a clear face + the title\n` +
        `  <video>             the short (or its source)\n` +
        `  --title "<text>"    ≤ ${TITLE_MAX} characters\n` +
        `  --at <s>            the frame to use (default: --faces' pick, else 1.0)\n` +
        `  --faces             pick the clearest face, keep the title off it (Python + mediapipe)\n` +
        `  --style <id>        ${STYLE_IDS.join(" | ")} (default clean) — use the short's own\n` +
        `  --theme <preset>    accent colour from an industry palette\n` +
        `  --out <file>        default <video>.cover.jpg`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const VALUE = new Set(["--title", "--at", "--style", "--theme", "--out"]);
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const input = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
  const die = (m) => { console.error(`[cover] ✗ ${m}`); process.exit(1); };
  if (!input || !fs.existsSync(input)) die(`input not found: ${input}`);
  const title = String(flag("--title", "")).trim();
  const tp = titleProblems(title);
  if (tp.length) die(tp.join("; "));
  let style;
  try { style = resolveStyle(flag("--style", "clean")); } catch (e) { die(e.message); }
  const theme = flag("--theme") ? resolveTheme(flag("--theme")) : null;
  const toHex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
  const accent = theme ? toHex(hslToRgb(theme.hue, 0.9, 0.58)) : style.accent;
  const out = flag("--out", input.replace(/\.[^.]+$/, "") + ".cover.jpg");
  try {
    let at = flag("--at") !== null ? Number(flag("--at")) : 1.0, head = null;
    if (argv.includes("--faces")) {
      const { detectFaces, sampleTimes } = await import("./face-boxes.mjs");
      const dur = Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", input])).trim());
      const det = await detectFaces(input, sampleTimes(0, dur, 16));
      const wins = det.frames.map((f) => ({ t: f.t, head: headBox([f], { W: det.W, H: det.H, minHit: 1 }) }));
      const t = flag("--at") !== null ? at : pickCoverTime(wins, { duration: dur });
      if (t !== null) at = t;
      // the head at the chosen frame, mapped through the same scale+crop that frames the cover
      const w = wins.find((x) => x.t === at) ?? [...wins].sort((a, b) => Math.abs(a.t - at) - Math.abs(b.t - at))[0];
      if (w?.head) {
        const k = Math.max(1080 / det.W, 1920 / det.H);
        const ox = (det.W * k - 1080) / 2, oy = (det.H * k - 1920) / 2;
        head = { x: w.head.x * k - ox, y: w.head.y * k - oy, w: w.head.w * k, h: w.head.h * k };
      }
    }
    const r = await makeCover({ video: input, at, title, style, accent, head, out });
    console.log(`[cover] ✓ ${out}  (frame ${r.at.toFixed(2)}s${r.moved ? ", title moved off the face" : ""})`);
  } catch (e) {
    die(e.message);
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
