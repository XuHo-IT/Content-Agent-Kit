# Attribution — frame-draw-on

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Education's remaining ask ("bảng trắng vẽ dần"). The advice circulating for this
is "SVG + GSAP"; `stroke-dasharray` and `stroke-dashoffset` do it in CSS with
nothing installed, which is the constraint this kit works under.

`paths` takes SVG path data — one per stroke, drawn in order. That is a real
demand on the caller and it is the honest one: the alternative is a fixed set of
shapes, which is a clip-art library rather than a template.

Three presets are built in for the common cases (`arrow`, `circle`, `check`,
`underline`) so a caller who only wants to ring a word does not have to author
a Bézier.

Each stroke's length is measured with getTotalLength() rather than estimated: a
dash pattern guessed too short leaves the tail undrawn, and guessed too long
delays the finish past the narration.

## Use

Slots: `kicker`, `title`, `paths`, `caption` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
