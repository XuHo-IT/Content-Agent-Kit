# Attribution — frame-opus-kinetic-reel

**Original template** authored for content-agent-kit (MIT, same as this repo).
Distilled from the Claude Opus 5.5 code-video style recipes (`yihui-dev/awesome-opus5-5-videos` and `HiAPIAI/awesome-opus-5-5-video-styles`); no third-party code, markup, fonts or imagery is vendored here.

## Why it exists

Implements the tuzhechen2005/opus-video-skills kinetic typography reel style: high-impact stacked shutter lines revealed by mask-image + clip-path sweeps with a live gradient punchline.

## Slots

- `top_tag`
- `line_1`
- `line_2`
- `line_3`
- `punchline`
- `counter_badge`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-opus-templates.mjs`. Edit that file, not the HTML.
