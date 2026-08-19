# Attribution — frame-fingerprint-match

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

A comparison being MADE rather than reported. The scan crosses the sample once, and `match_pct` both prints the figure and draws the bar, so the frame cannot claim a match its own picture does not show. The note slot exists to keep the claim honest.

## Slots

- `lab_label`
- `sample_label`
- `match_pct`
- `verdict`
- `note`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
