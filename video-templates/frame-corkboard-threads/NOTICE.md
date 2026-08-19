# Attribution — frame-corkboard-threads

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

`frame-vox-investigation-board` presents a FINISHED board. This one makes it: cards go up, then threads are drawn between them one at a time, and the endpoints are measured from where the cards actually landed. The source mock-up hard-coded SVG pixel coordinates into a 360x640 preview, so it could not have drawn a correct line at any real canvas.

## Slots

- `board_label`
- `card_1_label`
- `card_2_label`
- `card_3_label`
- `conclusion`
- `stamp`
- `media_count`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
