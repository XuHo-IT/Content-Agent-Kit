# Attribution — frame-story-step-numeral

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

A giant italic numeral fills the frame, then shrinks into its corner while the step lands word by word — each word sized by its weight, the key words bigger and electric blue. From ghost-editor's step-deck recipe (MIT, after a reel by @ant.lon), rebuilt for a narrated scene.

## Slots

- `label`
- `number`
- `title`
- `accent`
- `detail`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
