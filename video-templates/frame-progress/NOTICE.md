# Attribution — frame-progress

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Games asked for it ("thanh tiến độ / cột mốc"), and it is the frame every build
log, roadmap and fundraiser needs. `frame-chart-bars` compares things;
`frame-timeline` marks dates. Neither says HOW FAR THROUGH ONE THING you are.

The bar fills to the real ratio and the percentage is computed from it, so the
number and the picture cannot disagree. Milestones sit at their own proportion
along the track — one at 80% is drawn at 80%, not at "the fourth of five".

Over 100% draws a full bar rather than one that overflows its own track, and
still prints the true figure. A campaign at 143% should look finished and say
143, not look broken.

## Use

Slots: `kicker`, `title`, `value`, `total`, `milestones`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
