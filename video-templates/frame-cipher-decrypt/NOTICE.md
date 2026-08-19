# Attribution — frame-cipher-decrypt

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

`frame-terminal` shows a machine's OUTPUT. Nothing showed a machine still working on
something. The ciphertext is derived from the translation's own code points at render time, so
the noise on screen is genuinely the message — change the sentence and the hex changes with it.

## Slots

- `kicker`
- `out_label`
- `translation`
- `solved_1`
- `solved_2`
- `solved_3`
- `note`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
