# Attribution — frame-hud

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Games and tech both asked for it. Everything in this folder is a document laid out on
a page; a HUD is the opposite — furniture at the edges and one thing in the middle,
which is how a display looks when it belongs to a machine rather than to a designer.

`readouts` is "label:value", up to four, and they take the four corners in order.
The corner brackets and the sweep are CSS; nothing here is an image.

The sweep is slow on purpose. A fast radar sweep reads as a loading state, and a
loading state is the one thing a finished frame must not look like.

## Use

Slots: `label`, `readouts`, `center`, `caption` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
