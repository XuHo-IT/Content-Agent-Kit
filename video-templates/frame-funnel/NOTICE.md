# Attribution — frame-funnel

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Marketing's remaining ask. `frame-chart-bars` compares five separate things;
a funnel is ONE population shrinking, and the drop between two stages is the
whole point.

WIDTH COMES FROM THE NUMBER, not from position in the list. A funnel drawn as
evenly-narrowing trapezoids is a decoration that happens to have numbers on it —
and it lies whenever the real drop is uneven, which is most of the time.

The conversion rate between stages is COMPUTED, never typed. A funnel whose
printed percentage disagrees with its own widths is worse than one with no
percentages, and hand-entered rates disagree the first time a number changes.

The steepest drop is marked, because that is the stage anyone reading a funnel
is actually looking for.

## Use

Slots: `kicker`, `title`, `stages`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
