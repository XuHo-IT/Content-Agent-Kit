# Attribution — frame-story-silent-film

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

An iris opens onto an ornate intertitle card: sepia, flicker, gate weave on the border, film scratches running down. The silent short where 'sound tells half the story' is a recurring storytelling prompt in the 2026 Opus 5.5 survey (awesome-opus5-5-videos), and the intertitle is its most reusable device — pair it with a sting SFX.

## Slots

- `chapter`
- `title`
- `sub`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
