# Attribution — frame-trend-compare-wipe

**Original template** authored for content-agent-kit (MIT, same as this repo).
Style direction from the 2026 code-video trend survey (`yihui-dev/awesome-opus5-5-videos`) and the
caption/punch-in grammar of `kurbaitaev/ghost-editor` (MIT); no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

The 'before' side fills the frame, then a glowing divider sweeps across and wipes the 'after' side in over it — the comparison is the motion, instead of two boxes sitting side by side.

## Slots

- `title`
- `left_label`
- `left_1`
- `left_2`
- `left_3`
- `right_label`
- `right_1`
- `right_2`
- `right_3`
- `verdict`

Both compositions are emitted together by `scripts/video/lib/build-trend-templates.mjs`.
Edit that file, not the HTML.
