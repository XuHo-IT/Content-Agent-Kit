# Attribution — frame-geo-markers

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Six verticals asked for a map under six different names — property ("bản đồ có
điểm đánh dấu"), travel, history, logistics, news and environment. It was the
largest gap left in `INDUSTRIES.template.json` and the least obvious, because
each vertical spelled it differently.

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

Slots: `kicker`, `title`, `markers`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
