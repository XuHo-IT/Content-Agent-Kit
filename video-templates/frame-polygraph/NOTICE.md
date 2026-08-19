# Attribution — frame-polygraph

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

The mock-up this replaces drew a stress bar pinned at 88% whose keyframes ran 45%-94%, under a
label that said something else again. Here `stress_pct` sets the bar width AND prints the number,
so the picture and the caption cannot disagree. Nothing else in the library reads a body.

## Slots

- `kicker`
- `subject_label`
- `vitals`
- `trace_label`
- `stress_pct`
- `verdict`
- `note`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
