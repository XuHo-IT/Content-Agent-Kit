# Attribution — frame-trend-line

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

`frame-chart-bars` compares categories and `frame-timeline` marks events. Neither
shows a value MOVING, which is what finance and environment both asked for.

THE Y AXIS STARTS AT ZERO. `INDUSTRIES.template.json` lists "a chart with the Y axis
cut so the rise looks steeper than it is" under what a finance post must avoid — so
this template enforces that rather than leaving it as advice a caller can ignore.
`baseline: "auto"` opts into a zoomed axis and makes the frame PRINT that it did,
because a zoomed axis is a legitimate choice and an invisible one is not.

The line draws with `stroke-dashoffset` — the same technique the whiteboard family
will use, and no animation library.

## Use

Slots: `kicker`, `title`, `unit`, `points`, `highlight`, `baseline` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
