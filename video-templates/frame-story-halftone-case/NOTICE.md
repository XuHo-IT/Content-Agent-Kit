# Attribution — frame-story-halftone-case

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

A retro print case file: cream archive paper with overprinted halftone dots, a heavy serif headline popping glyph by glyph with a misregistered pink shadow, an exhibit card whose thick navy outline boils at 10 fps, and a rubber stamp that slams with a page shake. Ported as a look from ghost-editor's halftone-dossier recipe, itself after LemoLab's MIT 'Halftone Dossier' (lemo-opuscar).

## Slots

- `case_id`
- `label`
- `headline`
- `exhibit_label`
- `exhibit_text`
- `stamp`
- `caption`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
