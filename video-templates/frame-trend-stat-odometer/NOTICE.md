# Attribution — frame-trend-stat-odometer

**Original template** authored for content-agent-kit (MIT, same as this repo).
Style direction from the 2026 code-video trend survey (`yihui-dev/awesome-opus5-5-videos`) and the
caption/punch-in grammar of `kurbaitaev/ghost-editor` (MIT); no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Every digit rolls on its own wheel to its value, then a sparkline draws itself under it. A single big number is the most-used data beat in short video, and none of the remaining templates make the number itself move.

## Slots

- `kicker`
- `value`
- `unit`
- `label`
- `delta`
- `source`

Both compositions are emitted together by `scripts/video/lib/build-trend-templates.mjs`.
Edit that file, not the HTML.
