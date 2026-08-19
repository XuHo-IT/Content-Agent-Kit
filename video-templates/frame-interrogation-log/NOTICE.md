# Attribution — frame-interrogation-log

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Thirteen document frames existed and none of them held a CONVERSATION. `frame-chat-bubbles`
is the nearest, and it is a phone screen — timestamps, read receipts, a UI. This is a typed
transcript: two named speakers, no audio, no device. Deliberately paired against
`frame-dispatch-waveform`, which is the same material presented as something you are hearing.

## Slots

- `room_label`
- `officer_label`
- `suspect_label`
- `q_1`
- `a_1`
- `q_2`
- `a_2`
- `pause_note`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
