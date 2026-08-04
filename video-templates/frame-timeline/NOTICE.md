# Attribution — frame-timeline

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

`frame-step-list` looks like this and is not this: it is procedural — do one,
then two. A timeline is chronological, and the gap between two dates is part of
the claim. "Three years" and "three weeks" are different stories told with the
same steps.

The axis draws first and the markers arrive along it, so the eye reads the span
before it reads the entries. Horizontal at 16:9, vertical at 9:16 — a horizontal
timeline on a phone leaves the labels unreadable at any type size that fits.

`events` is "when:what", "|"-separated. The two halves are styled differently
because the date is scanned and the label is read.

## Use

Slots: `kicker`, `title`, `events`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
