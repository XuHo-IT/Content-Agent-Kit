# Attribution — frame-crime-scene-map

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

WHERE IT HAPPENED, at rest: the pin lands and stays, one ring goes out and is gone. Its position comes from `pin_x`/`pin_y`, so every episode marks its own place rather than the same spot on a different map. Deliberately split from `frame-satellite-track`.

## Slots

- `kicker`
- `coords`
- `time_label`
- `pin_x`
- `pin_y`
- `place_label`
- `panel_text`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
