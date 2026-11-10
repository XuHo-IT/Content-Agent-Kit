# Attribution — frame-trend-exploded-layers

**Original template** authored for content-agent-kit (MIT, same as this repo).
Style direction from the 2026 code-video trend survey (`yihui-dev/awesome-opus5-5-videos`) and the
caption/punch-in grammar of `kurbaitaev/ghost-editor` (MIT); no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Four isometric slabs sit stacked as one object, then pull apart into an exploded view with a label on each layer — the 2026 'cut it open so I can see inside' explainer, done in CSS 3D instead of WebGL so it renders offline.

## Slots

- `title`
- `layer_1`
- `layer_2`
- `layer_3`
- `layer_4`
- `caption`

Both compositions are emitted together by `scripts/video/lib/build-trend-templates.mjs`.
Edit that file, not the HTML.
