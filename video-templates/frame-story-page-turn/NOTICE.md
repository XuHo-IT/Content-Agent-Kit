# Attribution — frame-story-page-turn

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

Printed paper on maroon, a zoom-blur push in, and a page that turns on stepped 8 fps motion like stop-motion to reveal the payoff behind it. The page fold, stepped timing and 1–3-word black pill caption come from ghost-editor's tactile-paper recipe (MIT, after @chrismoran__'s After Effects page-turn) — rebuilt here as CSS.

## Slots

- `kicker`
- `before`
- `after`
- `note`
- `pill`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
