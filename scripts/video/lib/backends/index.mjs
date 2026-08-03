// backends/index.mjs — which renderer turns a script.json into video.
//
// Three, and they are not interchangeable. Picking one is a decision about cost and about
// what you can run, so the table below is the whole point of this file:
//
//   html      Chrome + FFmpeg on your machine. Free per video, deterministic, offline once
//             the fonts are cached. This is the kit's pipeline and the default; nothing
//             about it changed when the other two arrived.
//
//   api       Google's hosted models. Veo 3.1 generates footage, Imagen 4 / Nano Banana
//             generates stills. Photoreal output an HTML template cannot produce — and a
//             per-second bill: at $0.40/s a 60-second video is $24.
//
//   remotion  React components rendered to MP4. Motion design beyond what CSS keyframes
//             reach. Needs its own npm project; this kit stays dependency-free and
//             scaffolds one beside your script rather than pulling React in here.
//
// `script.json` does not change shape between them. A scene is a scene; the backend
// decides how the pixels get made.
//
// ENV: VIDEO_BACKEND (html | api | remotion). Unset means html.

export const BACKENDS = {
  html: {
    id: "html",
    label: "HTML templates (Chrome + FFmpeg)",
    costPerVideo: "free",
    needs: "ffmpeg, ffprobe, Chrome",
    builtIn: true, // handled inline by render.mjs — see the note there
    summary: "The kit's own pipeline. Deterministic, no per-video cost.",
  },
  api: {
    id: "api",
    label: "Google generative APIs (Veo, Imagen)",
    costPerVideo: "$0.03–$0.60 per second of video",
    needs: "GEMINI_API_KEY",
    module: "./api.mjs",
    summary: "Photoreal footage and stills a template cannot draw. Bills per second.",
  },
  remotion: {
    id: "remotion",
    label: "Remotion (React → MP4)",
    costPerVideo: "free",
    needs: "a separate npm project (the kit scaffolds it)",
    module: "./remotion.mjs",
    summary: "Motion design past what CSS keyframes reach. Renders on your machine.",
  },
};

export const BACKEND_IDS = Object.keys(BACKENDS);

/** Human-readable table for `--list-backends`. */
export function describeBackends() {
  const rows = BACKEND_IDS.map((id) => {
    const b = BACKENDS[id];
    return `  ${id.padEnd(9)} ${String(b.costPerVideo).padEnd(30)} needs: ${b.needs}\n` +
      `  ${" ".repeat(9)} ${b.summary}`;
  });
  return rows.join("\n\n");
}

/**
 * Validate a backend id, with a message that says what to do rather than what went wrong.
 * Called before any work starts, so a typo costs no render time.
 */
export function assertBackend(id) {
  if (!BACKENDS[id]) {
    throw new Error(
      `Unknown VIDEO_BACKEND "${id}". Known: ${BACKEND_IDS.join(" | ")}.\n` +
        `See docs/20-video-backends.md, or run: node scripts/video/render.mjs --list-backends`,
    );
  }
  return BACKENDS[id];
}

/**
 * Load a non-default backend. `html` returns null on purpose: it is not a module, it is
 * render.mjs's own body. Extracting those 300 lines into a module would be a large,
 * unverifiable move of the one path that definitely works today, for no behaviour change.
 */
export async function loadBackend(id) {
  const b = assertBackend(id);
  if (b.builtIn) return null;
  return import(b.module);
}
