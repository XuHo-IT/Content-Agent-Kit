# Attribution — frame-dispatch-waveform

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

The deliberate twin of `frame-interrogation-log`, and its opposite: this one is about what you
are HEARING. Bar heights are derived from the transcript's own characters, so every episode's
waveform is its own rather than the same hand-typed picture reused.

## Slots

- `rec_label`
- `timecode`
- `speaker_label`
- `transcript`
- `note`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
