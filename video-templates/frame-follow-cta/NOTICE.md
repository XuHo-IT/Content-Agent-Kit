# Attribution — frame-follow-cta

**Original template** authored for content-agent-kit (MIT, same as this repo).

The idea — not the code — comes from the HyperFrames registry block(s) `tiktok-follow`, `x-follow-card`
in [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0, © HeyGen and
contributors; read at commit `ffb13c3`). No markup, script, CSS, image, font or audio from those
blocks is included: this template was written from scratch in this kit's own shell
(`scripts/video/lib/build-trend-templates.mjs` → `renderHtml`), with its own layout, timing,
colours and slots. Platform identity, where shown, is drawn with plain shapes and colours — no
trademark or logo artwork is reproduced.

## Why it exists

A channel card builds — avatar ring, name, handle, a stat line, the ask — then a fingertip comes in and taps the follow button: it presses, ripples, bursts and flips to its followed state. Every outro in the library was a logo or a sentence; none showed the button being pressed.

## Slots

- `platform`
- `handle`
- `name`
- `stat`
- `cta`
- `button`
- `button_done`

Both compositions are emitted together by `scripts/video/lib/build-social-templates.mjs`.
Edit that file, not the HTML.
