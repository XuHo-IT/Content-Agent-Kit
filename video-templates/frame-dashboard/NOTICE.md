# Attribution — frame-dashboard

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Finance and corporate both asked for it. `frame-pentagram-stat` carries ONE number
as the whole frame; a quarterly result is four numbers that only mean something beside
each other.

`cells` is "label:value:delta". The delta's colour comes from its sign, so a caller
cannot accidentally paint a fall green. A cell with no delta simply has no delta —
better than a "0%" that looks measured.

Deliberately no sparklines and no icons. Four numbers with their direction is what
this frame is for; anything more and it becomes a screenshot of a real dashboard,
which `frame-screenshot` already does better.

## Use

Slots: `kicker`, `title`, `cells`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
