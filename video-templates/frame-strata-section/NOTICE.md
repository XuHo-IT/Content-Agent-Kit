# Attribution — frame-strata-section

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

A cut through the ground, one band per layer, drawn top down. Built for stories that go
DOWN: vaults under a bridge, levels of a mine, floors of a building nobody uses any more.
The `countdown` spine asks for exactly this shape and the kit had nothing for it —
`frame-iceberg-levels` is the nearest, and it is a fixed three-part illustration rather
than a section drawn from data.

NO HEIGHTS ARE TYPED. Each band's thickness comes from its `depth` number: the gap between
one layer's depth and the next. Type the depths a source actually states and the drawing is
to scale by construction. A section whose bands are hand-sized is a picture of strata, not
a section of them.

PAPER, NOT SCREEN. Warm off-white ground, ink lines, a single red for the layer being
pointed at — the `paper-dominant` half of the palette axis. The ground has to be genuinely
light; a "light" band floating on a dark page reads as a screenshot.

DRAW-ON, NOT FADE-IN. Every rule and hatch is a dashed path counting its `stroke-dashoffset`
to zero, so the section is drawn the way a hand would draw it: surface first, then down.

Only the focus band is hatched. Hatching every band turns a section into a texture and
hides the one layer that matters. The last band is left open at the bottom — no closing
rule — because the vaults do not end, they stop being surveyed.

## Use

Slots: `kicker`, `title`, `layers`, `focus`, `note`.

`layers` is `depth:name:sub` rows joined by `|`; `sub` is optional. `depth` is a number in
metres and drives the geometry, so a row whose depth will not parse is dropped rather than
guessed at — a made-up depth would silently mis-scale every band below it. `focus` is the
0-based index of the band to hatch and mark in red.

Needs at least 2 layers; below that the section is removed rather than drawn.

## Changes in content-agent-kit

None — written here.
