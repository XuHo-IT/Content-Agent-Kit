# Attribution — frame-story-frieze

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

The story is painted around a terracotta vase that turns: four panels pass across the front one at a time, each holding still long enough to read, between meander borders, with cylinder shading selling the turn. From the 2026 Opus 5.5 survey (awesome-opus5-5-videos: 'tell the Trojan Horse story painted around an ancient Greek vase') — a frame that makes any four-beat story feel like a legend.

## Slots

- `title`
- `chapter_1`
- `chapter_2`
- `chapter_3`
- `chapter_4`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
