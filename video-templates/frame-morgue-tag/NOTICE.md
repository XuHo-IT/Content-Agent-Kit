# Attribution — frame-morgue-tag

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Every document frame in the library is a dark panel with light text. This is the inverse — a
physical light-coloured card falling into a dark room and settling crooked. It is also the only
frame built to carry a short fielded record (label/value rows) rather than prose.

## Slots

- `kicker`
- `tag_title`
- `row_1_label`
- `row_1_value`
- `row_2_label`
- `row_2_value`
- `row_3_label`
- `row_3_value`
- `stamp`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
