# Attribution — frame-opus-shader-orb

**Original template** authored for content-agent-kit (MIT, same as this repo).
Distilled from the Claude Opus 5.5 code-video style recipes (`yihui-dev/awesome-opus5-5-videos` and `HiAPIAI/awesome-opus-5-5-video-styles`); no third-party code, markup, fonts or imagery is vendored here.

## Why it exists

Implements the Opus 5.5 generative shader style recipe in pure seek-safe CSS: coprime conic-gradient plasma rings, a mask-image light sweep across the hero statement, and a live gradient-text fill.

## Slots

- `kicker`
- `hero_stat`
- `headline`
- `subtext`
- `pill_left`
- `pill_right`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-opus-templates.mjs`. Edit that file, not the HTML.
