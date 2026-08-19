# Attribution — frame-vox-torchlight

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Why it exists

Thirteen document frames already existed and every one revealed its content by opacity, pin,
tear or redaction. None revealed by LIGHT. `mask-sweep` was also the thinnest motion row in the
library — 2 of 107 templates — so this fills a gap in what the kit can say and in how it moves.

## Slots

- `kicker`
- `doc_title`
- `body_text`
- `highlight`
- `stamp`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-vox-templates.mjs`. Edit that file, not the HTML.
