# Attribution — frame-ai-answer-rank

**Original template** authored for content-agent-kit (MIT, same as this repo).

The idea — not the code — comes from the HyperFrames registry block(s) `ai-answer-rank`
in [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0, © HeyGen and
contributors; read at commit `ffb13c3`). No markup, script, CSS, image, font or audio from those
blocks is included: this template was written from scratch in this kit's own shell
(`scripts/video/lib/build-trend-templates.mjs` → `renderHtml`), with its own layout, timing,
colours and slots. Platform identity, where shown, is drawn with plain shapes and colours — no
trademark or logo artwork is reproduced.

## Why it exists

A question types into an ask bar, the assistant's answer streams in with citation markers, then the cited sources stack up as a ranked list and the user's brand row lights up and keeps pulsing. frame-geo-faq-direct shows the query; nothing showed the citations, which is the part a brand is actually measured on.

## Slots

- `question`
- `answer`
- `sources_label`
- `sources`
- `highlight`
- `note`

Both compositions are emitted together by `scripts/video/lib/build-social-templates.mjs`.
Edit that file, not the HTML.
