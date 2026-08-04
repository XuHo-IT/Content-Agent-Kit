# Attribution — frame-split-compare

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Before/after and A/B are the commonest thing a technical post has to show, and
nothing in the kit did it. frame-chart-bars compares magnitudes; this compares
states, which is a different claim.

The divider is a real clip-path sweep rather than two panels fading in: the
right side is revealed BY the line travelling across it, so the eye follows
the movement to the result instead of choosing where to look.

`delta` is the one number a comparison exists to produce. It is optional, and
when present it sits on the divider — the only place on the frame that belongs
to neither side.

## Use

Slots: `leftLabel`, `leftValue`, `leftNote`, `rightLabel`, `rightValue`, `rightNote`, `delta`, `caption` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
