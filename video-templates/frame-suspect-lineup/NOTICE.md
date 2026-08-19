# Attribution — frame-suspect-lineup

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Companion to `frame-vox-silhouette-file` and deliberately not a duplicate of it: that frame is
a FILE about a person, this is the moment of being looked at. The height marker is positioned
from `height_pct`, so the drawn line and the printed number cannot disagree.

## Slots

- `kicker`
- `subject_label`
- `height_label`
- `height_pct`
- `detail_1`
- `detail_2`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
