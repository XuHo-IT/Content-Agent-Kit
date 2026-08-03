# Attribution — frame-chart-bars

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

A comparison a viewer can read in two seconds. Horizontal bars, each carrying its own
value, with one optionally highlighted in the accent colour — which is how a chart in a
video makes its point without narration.

## Use

`type: "body"`. Slots: `title` (≤60), `unit` (≤40), `bars`, `highlight`, `source` (≤60) —
see `../CATALOG.md`.

`bars` is `"label:value|label:value|…"`, up to five. Parsed on the **last** colon, so a
label may contain one: `"Q1: doanh thu:120"` reads the way it looks.

Three behaviours worth knowing:

- **Bar widths are computed from the numbers**, scaled to the largest value, and every bar
  prints its own value. A chart whose bars disagree with its labels is worse than no
  chart, and that is the easiest mistake to make when widths are typed by hand.
- **Unparseable data removes the chart** rather than drawing five zero-width bars, which
  would imply every value is nothing.
- **9:16 puts the label above the bar, not beside it.** A 380px label column on a 1080px
  frame leaves under 500px of track, so a 20% bar becomes 100px and stops being readable.

## Changes in content-agent-kit

None — written here.
