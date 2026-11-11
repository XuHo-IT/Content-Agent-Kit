# Attribution — frame-story-rundown

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

A one-story news segment's rundown: a split-flap title flips into place, the points are listed, the ones already covered strike through and tick, and the current one lights up with a lemon bar. From ghost-editor's news-package recipe, after LemoLab's MIT 'Broadcast News Package' (lemo-opuscar). Reuse it twice in a video — once to promise, once to show progress.

## Slots

- `tag`
- `title`
- `item_1`
- `item_2`
- `item_3`
- `item_4`
- `current`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
