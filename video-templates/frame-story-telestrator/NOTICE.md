# Attribution — frame-story-telestrator

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

A TV sports-analysis segment: a yellow slanted wipe onto a dark tactics board, the bug flips from LIVE to ANALYSIS on a white freeze flash, a marker ring draws around the key words, an arrow pulls in a label card, and a matchup bar names the two sides. From ghost-editor's telestrator recipe, after LemoLab's MIT 'Sports Telestrator' (lemo-opuscar). The bug's words are slots — set them in your language.

## Slots

- `bug`
- `bug_2`
- `side_a`
- `side_b`
- `clock`
- `statement`
- `key`
- `label`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
