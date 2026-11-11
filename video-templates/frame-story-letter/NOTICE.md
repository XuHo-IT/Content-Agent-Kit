# Attribution — frame-story-letter

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

An envelope opens, a ruled letter slides out and writes itself in a hand, signed, with a postage stamp and a wax seal. The love-note story is one of the most-remixed narrative prompts in the 2026 Opus 5.5 survey (awesome-opus5-5-videos) because a letter is the one format everyone reads to the end.

## Slots

- `date`
- `greeting`
- `body`
- `signoff`
- `stamp_label`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
