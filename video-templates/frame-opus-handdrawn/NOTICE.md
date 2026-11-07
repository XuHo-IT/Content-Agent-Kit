# Attribution — frame-opus-handdrawn

**Original template** authored for content-agent-kit (MIT, same as this repo).
Distilled from the Claude Opus 5.5 code-video style recipes (`yihui-dev/awesome-opus5-5-videos` and `HiAPIAI/awesome-opus-5-5-video-styles`); no third-party code, markup, fonts or imagery is vendored here.

## Why it exists

Implements the Opus 5.5 handdrawn explainer recipe: warm drafting paper, self-drawing SVG ink strokes (stroke-dashoffset), sketched callout arrows, and a 12fps steps(3, end) cel line-boil.

## Slots

- `kicker`
- `headline`
- `sketch_left`
- `sketch_right`
- `callout_note`
- `verdict`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-opus-templates.mjs`. Edit that file, not the HTML.
