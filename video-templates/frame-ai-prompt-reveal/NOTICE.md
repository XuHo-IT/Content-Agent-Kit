# Attribution — frame-ai-prompt-reveal

**Original template** authored for content-agent-kit (MIT, same as this repo).

The idea — not the code — comes from the HyperFrames registry block(s) `typed-prompt`, `chatgpt-exchange`, `ai-chat-reveal`
in [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0, © HeyGen and
contributors; read at commit `ffb13c3`). No markup, script, CSS, image, font or audio from those
blocks is included: this template was written from scratch in this kit's own shell
(`scripts/video/lib/build-trend-templates.mjs` → `renderHtml`), with its own layout, timing,
colours and slots. Platform identity, where shown, is drawn with plain shapes and colours — no
trademark or logo artwork is reproduced.

## Why it exists

A chat card: the user's prompt types in character by character with a caret, it is sent, the assistant thinks for a beat, then its answer streams in word by word, one line per point. A prompt tip is an exchange, and nothing in the library could type a prompt or stream a reply.

## Slots

- `tag`
- `prompt`
- `answer`
- `model`
- `note`

Both compositions are emitted together by `scripts/video/lib/build-social-templates.mjs`.
Edit that file, not the HTML.
