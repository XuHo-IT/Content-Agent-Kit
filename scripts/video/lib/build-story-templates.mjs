// build-story-templates.mjs — emit the storytelling scene templates (frame-story-*).
//
//   node scripts/video/lib/build-story-templates.mjs                 # write all
//   node scripts/video/lib/build-story-templates.mjs --only frame-story-letter
//   node scripts/video/lib/build-story-templates.mjs --catalog       # CATALOG.md section to stdout
//
// WHY A STORY SET. The trend set (build-trend-templates.mjs) is about how a scene LOOKS in a 2026
// feed. This set is about what a scene DOES in a narrative: a turn (page-turn), a descent
// (world-pan), evidence (halftone-case), a chapter (swiss-chapter, silent-film), a memory
// (sand, letter), a climax (kinetic-floor), a map of where the story is (rundown). A video built
// from it has a shape — setup, turn, proof, payoff — instead of a list of facts.
//
// SOURCES (ideas only, every line here is original):
//   · kurbaitaev/ghost-editor (MIT) — its 18 style recipes; the explainer-vector, tactile-paper,
//     halftone-dossier, swiss-grid, step-deck, telestrator, data-story and news-package devices.
//     Several of those recipes are themselves ports of LemoLab's lemo-opuscar styles (MIT).
//   · yihui-dev/awesome-opus5-5-videos (MIT) — the storytelling cluster of its 703 prompts:
//     one unbroken line, sand animation, a story painted around a vase, silent film, comic
//     panels, the love-note letter, kinetic spoken word.
//
// The HTML shell, base CSS and helpers (typeInto, has, seek) are shared with the trend builder,
// so both sets obey the same renderer contract. Fonts add three families that carry Vietnamese
// (checked by tests/vietnamese-fonts.test.mjs): Playfair Display, Patrick Hand, Anton.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderHtml, catalogEntry, HYPERFRAMES_JSON } from "./build-trend-templates.mjs";
import { STORY_TEMPLATES_A } from "./story-templates-a.mjs";
import { STORY_TEMPLATES_B } from "./story-templates-b.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const VT = path.join(KIT, "video-templates");

export const STORY_FONTS_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,500;0,600;0,700;0,800;0,900;1,800&family=Roboto+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Patrick+Hand&family=Anton&display=swap" rel="stylesheet">';

export const STORY_TEMPLATES = [...STORY_TEMPLATES_A, ...STORY_TEMPLATES_B].map((t) => ({ ...t, fonts: STORY_FONTS_LINK }));

function notice(t) {
  return `# Attribution — ${t.id}

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from \`kurbaitaev/ghost-editor\` (MIT — its style recipes, several
of them ports of LemoLab's MIT \`lemo-opuscar\` styles) and from the storytelling prompts surveyed in
\`yihui-dev/awesome-opus5-5-videos\` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

${t.why}

## Slots

${Object.keys(t.vars).map((k) => `- \`${k}\``).join("\n")}

Both compositions are emitted together by \`scripts/video/lib/build-story-templates.mjs\`
(definitions in \`story-templates-a.mjs\` / \`story-templates-b.mjs\`). Edit those, not the HTML.
`;
}

export function buildAll({ only = null } = {}) {
  for (const t of STORY_TEMPLATES) {
    if (only && t.id !== only) continue;
    const dir = path.join(VT, t.id);
    fs.mkdirSync(path.join(dir, "compositions"), { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderHtml({ t, w: 1920, h: 1080, compId: "main", portrait: false }), "utf8");
    fs.writeFileSync(path.join(dir, "compositions", "portrait.html"), renderHtml({ t, w: 1080, h: 1920, compId: "portrait", portrait: true }), "utf8");
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ id: t.id, name: t.name }, null, 2) + "\n", "utf8");
    fs.writeFileSync(path.join(dir, "hyperframes.json"), HYPERFRAMES_JSON, "utf8");
    fs.writeFileSync(path.join(dir, "NOTICE.md"), notice(t), "utf8");
    console.log(`[story] ✓ wrote ${t.id}`);
  }
}

export function catalogSection() {
  return STORY_TEMPLATES.map(catalogEntry).join("\n");
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf("--only");
  if (process.argv.includes("--catalog")) console.log(catalogSection());
  else buildAll({ only: i > -1 ? process.argv[i + 1] : null });
}
