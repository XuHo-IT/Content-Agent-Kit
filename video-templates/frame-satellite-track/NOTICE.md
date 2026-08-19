# Attribution — frame-satellite-track

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

STILL BEING FOLLOWED. The reticle travels between two slot-given points and locks, leaving the path behind it. The two source mock-ups drew this and the scene map as the same picture; separating pursuit from location is what makes both worth having.

## Slots

- `sat_label`
- `status_line`
- `from_xy`
- `to_xy`
- `last_seen`
- `place_label`
- `note`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
