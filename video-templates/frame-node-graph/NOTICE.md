# Attribution — frame-node-graph

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

The single most-wanted missing frame in `INDUSTRIES.template.json`: logistics wants a
supply chain, tech wants a workflow, legal wants a document flow, marketing wants a
funnel. Four verticals asking for the same geometry.

NO COORDINATES ARE TYPED. `nodes` gives labels and `edges` gives connections; the
layout is computed — depth by breadth-first search from whatever has no incoming edge,
then evenly spread within each depth. That is the same rule the rest of this folder
follows: a diagram whose positions are hand-placed disagrees with its own data the
first time an edge changes.

Columns at 16:9, rows at 9:16. A left-to-right flow on a phone gives every box about
90 pixels of width, which is not a diagram, it is a suggestion of one.

A cycle would make the depth search loop forever, so nodes still unplaced after the
search are pushed to a final layer rather than hanging the render. A graph that
disagrees with itself still draws; it just draws honestly.

## Use

Slots: `kicker`, `title`, `nodes`, `edges`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
