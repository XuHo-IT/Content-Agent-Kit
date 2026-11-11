# Attribution — frame-story-comic-panels

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

Three panels slam in one at a time, each with a caption box and a speech balloon, and the last one breaks with an onomatopoeia burst over speed lines. Comic and manga panels are a recurring storytelling ask in the 2026 Opus 5.5 survey (awesome-opus5-5-videos: 'comic book style', 'trace manga'); this is the version a narrator can fill with words alone.

## Slots

- `caption_1`
- `bubble_1`
- `caption_2`
- `bubble_2`
- `caption_3`
- `bubble_3`
- `sfx`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
