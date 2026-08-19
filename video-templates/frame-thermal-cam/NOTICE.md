# Attribution — frame-thermal-cam

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

The only GREEN frame in the library. That is its job: cutting to it after six near-black frames
reads as switching instrument rather than switching scene. The heat source is drawn at an
intensity taken from `heat_pct`, so the readouts describe something the frame actually renders.

## Slots

- `system_label`
- `gain_label`
- `heat_pct`
- `target_line`
- `range_line`
- `caption`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
