# Attribution — frame-ballistics-path

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Nothing could show a RECONSTRUCTED path — where something came from and where it ended. The
angle is a single slot that both rotates the trajectory and prints the label; the source mock-up
drew 28 degrees under a label reading 28.4.

## Slots

- `kicker`
- `angle_deg`
- `angle_prefix`
- `origin_label`
- `impact_label`
- `distance_label`
- `note`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
