# Attribution — frame-story-one-line

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

One pen line never leaves the paper: it loops into a seed, climbs a mountain and ends in a heart, and each station is named as the pen reaches it. The 'one unbroken line draws the whole story' device is one of the most-shared storytelling prompts in the 2026 Opus 5.5 video survey (awesome-opus5-5-videos) — the continuity IS the narrative.

## Slots

- `kicker`
- `headline`
- `label_1`
- `label_2`
- `label_3`
- `sub`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
