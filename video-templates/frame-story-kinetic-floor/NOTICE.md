# Attribution — frame-story-kinetic-floor

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

Each line drops in as a slab and becomes a floor; the stack squashes as it lands; the final word falls last and stands on everything said before it. After the 'BUILD THE FLOOR' kinetic spoken-word prompts in the 2026 Opus 5.5 survey (awesome-opus5-5-videos: 'the final declaration must stand on something the earlier lines built').

## Slots

- `line_1`
- `line_2`
- `line_3`
- `line_4`
- `final`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
