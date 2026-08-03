# Attribution — frame-review-verdict

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

The frame a review video is built around: a score ring that sweeps to the number, the
verdict in one line, then pros and cons. The score is the largest object on screen because
the question a review has to answer first is "so is it good?", and a viewer should get that
without reading.

## Use

`type: "body"`, usually the frame right before the outro. Slots: `subject` (≤40),
`score`, `maxScore`, `verdict` (≤80), `pros`, `cons` — see `../CATALOG.md`.

`pros` and `cons` are `"|"`-separated strings rather than arrays. Scene inputs come through
as flat values, and a caller writing JSON by hand gets one delimited string wrong far less
often than a nested array.

Two behaviours worth knowing:

- The **arc is computed from `score` / `maxScore`**, clamped to the ring. A frame whose
  drawn arc disagreed with its printed number would contradict itself on screen, and a
  caller passing 12/10 gets a full ring rather than one that wraps to look like 2/10.
- An **empty `pros` or `cons` removes that column** instead of leaving a heading with
  nothing under it, which reads as missing data rather than as a deliberate omission.

## Changes in content-agent-kit

None — written here.
