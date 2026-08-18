# Attribution — frame-blueprint-draw

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

A site plan that builds itself in front of the viewer: perimeter wall first, then cell
blocks, then watchtowers — all via `stroke-dashoffset` on paths normalised with
`pathLength="1"`, so every stroke takes the same time regardless of its real length.
Last, and in the only accent colour on the page, a route draws itself and leaves the
perimeter.

The point of the frame is that order: the plan is finished and authoritative *before*
the accent line contradicts it. Paper palette, engineering grid, hard offset shadow —
it should read as a drawing someone pulled out of a drawer, not as a UI.

## Use

Slots: `kicker`, `title`, `plan_label`, `stat_1_label`, `stat_1_value`,
`stat_2_label`, `stat_2_value`, `route_label`, `note`.

- Leave `stat_2_label` **and** `stat_2_value` empty to drop the second stat box
  rather than render an empty one.
- Set `route` to `"off"` for a plain plan with no accent route.

Suits any location that is a built structure — a prison, a hospital, a bunker, a
factory — and any story where the official record and what actually happened differ.

## Changes in content-agent-kit

None — written here.
