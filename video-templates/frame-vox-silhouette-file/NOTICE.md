# Attribution — frame-vox-silhouette-file

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Why it exists

Nothing in the library could present a PERSON without a face. The horror and true-crime rules
forbid showing the face of anyone a court has not convicted, so a portrait is frequently
unusable — this cost two real images in production before the frame existed. The bust is drawn
rather than photographed, so there is no face to redact.

## Slots

- `kicker`
- `band_text`
- `subject_label`
- `fact_1`
- `fact_2`
- `fact_3`
- `status`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-vox-templates.mjs`. Edit that file, not the HTML.
