# Attribution — frame-story-sand

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

Sand on a lit glass table: a finger sweep brushes the sand away to reveal the words as light, a landscape draws itself in the glow, grains drift. Sand animation telling a long history is a standout storytelling prompt in the 2026 Opus 5.5 survey (awesome-opus5-5-videos: '250 years of history in sand').

## Slots

- `era`
- `line`
- `sub`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
