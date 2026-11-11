# Attribution — frame-story-pencil-chart

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

A chart draws itself on cream paper under a red-blue pencil: axes first, then each bar outlined and hatched, then a handwritten note pinned to the tallest mark, with a figure caption that names the source. Bar heights are computed from the numbers. From ghost-editor's data-story recipe, after LemoLab's MIT 'Data Storytelling' (lemo-opuscar) — including its rule that a chart with no verified number says so.

## Slots

- `title`
- `label_1`
- `value_1`
- `label_2`
- `value_2`
- `label_3`
- `value_3`
- `label_4`
- `value_4`
- `unit`
- `note`
- `figure`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
