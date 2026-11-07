# Attribution — frame-opus-collage-stopmo

**Original template** authored for content-agent-kit (MIT, same as this repo).
Distilled from the Claude Opus 5.5 code-video style recipes (`yihui-dev/awesome-opus5-5-videos` and `HiAPIAI/awesome-opus-5-5-video-styles`); no third-party code, markup, fonts or imagery is vendored here.

## Why it exists

Brings the Opus 5.5 mixed-media collage & stop-motion style recipe into the kit: halftone newsprint texture, jagged polygon paper cutouts, tilted zine typography, and 12fps steps(4, end) frame snaps.

## Slots

- `sticker_tag`
- `headline`
- `cutout_stat`
- `cutout_label`
- `tape_quote`
- `stamp_text`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-opus-templates.mjs`. Edit that file, not the HTML.
