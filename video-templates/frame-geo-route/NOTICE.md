# Attribution — frame-geo-route

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

The other half of what six verticals asked for: travel wants a route, logistics
wants a delivery line, marketing wants "we expanded to N markets". Same map, but
the ORDER is the content — so the stops are numbered and the arcs draw one after
another rather than all at once.

Arcs bulge perpendicular to the straight line, by a fraction of its length. A
straight line between two dots reads as a ruler; the curve is what makes it read
as a journey. It is a quadratic Bézier, not a great circle — at the span a single
video covers, the difference is smaller than the stroke.

The coastlines are Natural Earth 1:110m — PUBLIC DOMAIN — redistributed as
TopoJSON by topojson/world-atlas (ISC), converted once by
`scripts/video/build-map-path.mjs` and committed as ~59 KB of path data.

NOTHING IS FETCHED AT RENDER TIME. The upstream HyperFrames `world-map` block
loads d3, topojson-client, gsap and the atlas itself from a CDN on every render,
which turns "offline means missing fonts" into "offline means a blank map". This
draws with the network unplugged.

The view FITS ITSELF to the markers: their bounding box, padded, with a floor on
the span so two cities in one province do not produce a map of one province. No
zoom slot to get wrong, and no world map with three dots huddled in one corner.

## Use

Slots: `kicker`, `title`, `stops`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
