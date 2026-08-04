# Attribution — frame-analog-grain

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Every other template in this kit is clean, and so is everything else generated
by a machine. That is exactly why the worn look reads: it is the one surface a
viewer does not assume was produced in a second.

Three effects, all CSS and SVG, no assets:

  · grain      — an SVG feTurbulence tile, animated by shifting its background
                 position. A PNG would have been an asset to ship and license.
  · scan lines — a repeating-linear-gradient that drifts down one period, so
                 the roll is continuous and never seams.
  · aberration — the title is drawn three times, the red and cyan copies
                 offset a pixel or two. That is what chromatic aberration is;
                 a filter would only approximate it.

`timecode` and `tape` are the furniture that makes the rest read as tape
rather than as a mistake, and both are slots — an empty one is removed.

## Use

Slots: `tape`, `timecode`, `title`, `subtitle` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
