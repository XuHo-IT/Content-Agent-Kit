# Attribution — frame-story-swiss-chapter

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

International Typographic Style in motion: a six-column grid builds itself, a giant numeral wipes up, the chapter title rises word by word out of clip rects flush left, and one red square — the story's protagonist, the only inexact thing allowed — breaks out of the grid. One precise ease, no fades. From ghost-editor's swiss-grid recipe, after LemoLab's MIT 'Swiss Motion Graphics' (lemo-opuscar).

## Slots

- `section`
- `counter`
- `numeral`
- `title`
- `note`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
