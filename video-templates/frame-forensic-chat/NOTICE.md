# Attribution — frame-forensic-chat

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

`frame-chat-bubbles` already shows a conversation. What it cannot show is a RECOVERED message —
one the sender deleted — or a reply still being typed when the record ends. Those two states are
the entire reason this frame exists.

## Slots

- `time_label`
- `sender_label`
- `msg_1`
- `msg_2`
- `msg_deleted`
- `msg_3`
- `typing_note`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
