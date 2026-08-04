# Attribution — frame-product-reveal

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

The kit had a hook, bodies and an outro, but nothing for the beat where the
subject is finally shown. A launch video without that beat is a list of
features attached to nothing.

A shutter covers the name, then wipes away. The name scales in behind it, so
the movement of the shutter and the arrival of the name are one gesture rather
than two animations that happen to overlap.

`badge` is optional and disappears entirely when empty — a pill with no text
is worse than no pill. `tagline` sits under the name because a viewer who has
just read a product name is looking down, not up.

## Use

Slots: `teaser`, `name`, `tagline`, `badge` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
