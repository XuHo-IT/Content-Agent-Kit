// edit-styles.mjs — named looks for a talking-head edit (talking-head.mjs --style <id>).
//
// The idea is ghost-editor's (kurbaitaev/ghost-editor, MIT): one recording, several finished
// looks, each a coherent bundle of caption treatment + grade + punch-in rhythm + hook card +
// how B-roll sits next to the speaker. Ideas only — every value below is ours, expressed in
// ffmpeg filters and ASS override tags so the kit stays dependency-free.
//
// RULES THAT HOLD FOR EVERY STYLE (docs/26-auto-edit.md):
//   - the speaker's face is graded gently or not at all — a heavy look goes on B-roll
//   - captions sit in the lower third, clear of the platform's like/comment rail
//   - one accent colour, taken from the industry palette when --theme is given
//   - fonts must carry Vietnamese diacritics (Impact does not — node scripts/video/font-check.mjs)

/**
 * caption: options for captions.mjs toAssActive (ASS override tags; {hot} = accent colour)
 * grade:   ffmpeg filter chain for the whole frame, applied BEFORE captions so text stays clean
 * broll:   extra filter for B-roll cut-aways only
 * hook:    ASS style fields for the opening title card
 */
export const EDIT_STYLES = {
  clean: {
    label: "Clean — chữ trắng, một từ nhấn màu, zoom gọn",
    accent: "#ffd23f",
    punch: 0.08,
    progress: false,
    grade: null,
    broll: null,
    caption: { font: "Arial", sizeRatio: 0.058, maxWords: 3 },
    hook: { font: "Arial", sizeRatio: 0.05, upper: false, box: true, align: 8 },
  },
  pop: {
    label: "Pop — chữ HOA, từ đang nói nằm trong ô màu, zoom mạnh",
    accent: "#ff5a36",
    punch: 0.14,
    progress: true,
    grade: "eq=saturation=1.16:contrast=1.05",
    broll: null,
    caption: {
      font: "Arial", sizeRatio: 0.064, maxWords: 2, upper: true,
      // the whole card sits on an opaque accent plate; the spoken word flips to white
      boxed: true, boxColour: "accent", ink: "#141414",
      activeTag: "{\\c&H00FFFFFF&}",
      popTag: "{\\fscx80\\fscy80\\t(0,90,\\fscx100\\fscy100)}",
    },
    hook: { font: "Arial", sizeRatio: 0.058, upper: true, box: true, accentBox: true, align: 8 },
  },
  editorial: {
    label: "Editorial — chữ thường mờ dần vào, câu đang nói sáng, màu dịu",
    accent: "#f2c14e",
    punch: 0.06,
    progress: true,
    grade: "eq=saturation=0.9:contrast=1.04,noise=alls=4:allf=t",
    broll: null,
    caption: {
      font: "Segoe UI", sizeRatio: 0.05, maxWords: 4, lower: true, marginVRatio: 0.2,
      restTag: "{\\alpha&H6E&}",
      activeTag: "{\\c{hot}&}",
      popTag: "{\\fad(140,0)\\blur4\\t(0,160,\\blur0)}",
    },
    hook: { font: "Segoe UI", sizeRatio: 0.046, upper: false, lower: true, box: false, align: 8 },
  },
  cinematic: {
    label: "Cinematic — chỉnh màu phim, hạt, viền tối, B-roll đen trắng, chữ có chân",
    accent: "#e8b86a",
    punch: 0.05,
    progress: false,
    grade: "eq=contrast=1.08:saturation=0.82,colorbalance=rs=0.04:bs=-0.05:rh=0.03:bh=-0.04,vignette=angle=PI/4.6,noise=alls=10:allf=t+u",
    broll: "hue=s=0",
    caption: {
      font: "Georgia", sizeRatio: 0.048, maxWords: 4, ink: "#f3ecdc", marginVRatio: 0.18,
      activeTag: "{\\c{hot}&\\i1}",
      popTag: "{\\fad(180,0)}",
    },
    hook: { font: "Georgia", sizeRatio: 0.05, upper: false, box: false, align: 8 },
  },
  "kinetic-doc": {
    label: "Kinetic doc — đen trắng tư liệu, một từ to giữa khung, một màu đỏ",
    accent: "#e63b2e",
    punch: 0.1,
    progress: true,
    grade: "hue=s=0,eq=contrast=1.14:brightness=-0.02,noise=alls=7:allf=t",
    broll: null,
    caption: {
      font: "Arial", sizeRatio: 0.1, maxWords: 1, upper: true, align: 5, marginVRatio: 0,
      activeTag: "{\\c{hot}&\\fscx122\\fscy122\\t(0,80,\\fscx100\\fscy100)}",
      popTag: "",
    },
    hook: { font: "Arial", sizeRatio: 0.06, upper: true, box: true, accentBox: true, align: 8 },
  },
};

export const STYLE_IDS = Object.keys(EDIT_STYLES);

export function resolveStyle(id = "clean") {
  const s = EDIT_STYLES[id];
  if (!s) throw new Error(`unknown --style "${id}" — one of: ${STYLE_IDS.join(", ")}`);
  return s;
}

/** "#rrggbb" → ASS "&H00BBGGRR" (no trailing &, the way captions.mjs writes colours). */
export function hexToAss(hex) {
  const h = String(hex).replace("#", "");
  return `&H00${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase();
}

/** The opening title card as one ASS Style line + the override for its Dialogue. */
export function hookStyle(style, { width, height, accent }) {
  const h = style.hook;
  const size = Math.round(height * h.sizeRatio);
  const ink = h.accentBox ? "&H00141414" : "&H00FFFFFF";
  const back = h.accentBox ? hexToAss(accent) : "&H66000000";
  const border = h.box ? 3 : 1;
  const outline = h.box ? Math.round(height * 0.012) : Math.max(2, Math.round(size * 0.06));
  const marginV = h.align === 8 ? Math.round(height * 0.1) : 0;
  return {
    style:
      `Style: Hook,${h.font},${size},${ink},${ink},${h.box ? back : "&H00000000"},${back},-1,0,0,0,100,100,0,0,` +
      `${border},${outline},0,${h.align},70,70,${marginV},1`,
    // the hook's accent word colour only when it is not already sitting on an accent box
    tag: h.accentBox ? "{\\fad(100,200)}" : `{\\fad(120,200)\\c${hexToAss(accent)}&}`,
    text: (t) => (h.upper ? t.toLocaleUpperCase("vi") : h.lower ? t.toLocaleLowerCase("vi") : t),
  };
}
