# Attribution — frame-redacted-dossier

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

`frame-document-redacted` already blacks out a line of text. It has no way to show the PHOTOGRAPH the file was built around, or redaction lifting one bar at a time on separate beats. Both are the reason this is its own frame rather than more slots on that one.

## Slots

- `case_no`
- `classification`
- `stamp`
- `photo_caption`
- `field_1_label`
- `field_1_value`
- `field_2_label`
- `field_2_value`
- `body_text`
- `revealed`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
