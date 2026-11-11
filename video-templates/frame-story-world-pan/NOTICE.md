# Attribution — frame-story-world-pan

**Original template** authored for content-agent-kit (MIT, same as this repo).
Storytelling device taken as an idea from `kurbaitaev/ghost-editor` (MIT — its style recipes, several
of them ports of LemoLab's MIT `lemo-opuscar` styles) and from the storytelling prompts surveyed in
`yihui-dev/awesome-opus5-5-videos` (MIT). No third-party code, markup, fonts, audio or imagery is
vendored here.

## Why it exists

Not a sequence of slides but one tall world — sky over soil — with a camera that dives through it: the headline in the sky, the turning point on the horizon, the truth in the roots, which draw themselves as the camera arrives. Ported as an idea from ghost-editor's explainer-vector recipe ('one world, one camera', MIT).

## Slots

- `kicker`
- `line_top`
- `line_mid`
- `line_bottom`

Both compositions are emitted together by `scripts/video/lib/build-story-templates.mjs`
(definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
