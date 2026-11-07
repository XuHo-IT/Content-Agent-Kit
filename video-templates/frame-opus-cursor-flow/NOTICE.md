# Attribution — frame-opus-cursor-flow

**Original template** authored for content-agent-kit (MIT, same as this repo).
Distilled from the Claude Opus 5.5 code-video style recipes (`yihui-dev/awesome-opus5-5-videos` and `HiAPIAI/awesome-opus-5-5-video-styles`); no third-party code, markup, fonts or imagery is vendored here.

## Why it exists

No template in the library choreographs a SaaS product UI interaction — a 3D perspective window where an animated cursor glides in, clicks an action CTA with a ripple ring, and reveals the live result drawer.

## Slots

- `kicker`
- `window_title`
- `headline`
- `subtext`
- `action_label`
- `status_badge`
- `result_metric`
- `result_caption`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-opus-templates.mjs`. Edit that file, not the HTML.
