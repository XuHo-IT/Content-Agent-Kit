# Attribution — frame-opus-pixel-arcade

**Original template** authored for content-agent-kit (MIT, same as this repo).
Distilled from the Claude Opus 5.5 code-video style recipes (`yihui-dev/awesome-opus5-5-videos` and `HiAPIAI/awesome-opus-5-5-video-styles`); no third-party code, markup, fonts or imagery is vendored here.

## Why it exists

Implements the Opus 5.5 pixel style recipe: crisp 8-bit grid scanlines, stepped progress bars with steps(8, end), retro arcade brackets, and a mechanical score readout.

## Slots

- `stage_label`
- `headline`
- `player_1_name`
- `player_1_score`
- `player_2_name`
- `player_2_score`
- `arcade_prompt`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-opus-templates.mjs`. Edit that file, not the HTML.
