# Attribution — frame-vhs-nosignal

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Nothing in the library could say THERE IS NO FOOTAGE. `frame-analog-grain` and
`frame-glitch-title` degrade an image that exists; this frame's subject is the absence of one —
the tape that ran out, the camera already off, the recording that was taken.

## Slots

- `play_state`
- `timecode`
- `big_text`
- `cam_label`
- `note`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
