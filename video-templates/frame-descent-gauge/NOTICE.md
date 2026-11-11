# Attribution — frame-descent-gauge

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

One layer of a descent, held on the page while a gauge in the margin says where in the
descent it sits. The companion to `frame-strata-section`: that one shows every layer at
once, this one shows a SINGLE layer big enough to read. A `countdown` spine wants both —
the map, then each stop on it — and the kit had only `frame-iceberg-levels`, which is one
fixed picture of three.

THE GAUGE IS COMPUTED, NOT DRAWN BY HAND. `steps` says how many layers exist and `step`
says which one this is; the marker's position is that ratio down the rail. A step out of
range clamps rather than sliding off the page — a marker floating past the end of its own
rail is worse than a marker at the end.

Rail height is measured after layout rather than typed, so it matches the box the CSS
actually gave it instead of a number that any padding change would falsify.

PAPER, NOT SCREEN — the same ground, tooth and red as `frame-strata-section`, so the two
cut together without a flash.

DRAW-ON: the rail counts its `stroke-dashoffset` to zero and each tick lands in sequence,
so the gauge fills the way a descent goes — one level at a time, downward. Ticks above the
current step are ink; the current one is red and longer, so the eye finds the position
without needing a legend.

## Use

Slots: `step`, `steps`, `kicker`, `title`, `body`, `note`.

`step` is 1-based and clamps into `1..steps`. Pair with `frame-strata-section`: show the
section once to establish the layers, then one gauge frame per layer.

## Changes in content-agent-kit

None — written here.
