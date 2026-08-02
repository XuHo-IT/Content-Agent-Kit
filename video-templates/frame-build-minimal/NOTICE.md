# Attribution — frame-build-minimal

Vendored and adapted from:

- **Source:** [nexu-io/html-video](https://github.com/nexu-io/html-video) — `templates/frame-build-minimal`
- **License:** Apache-2.0 (attribution required, commercial use allowed)
- **Design lineage (upstream):** huashu-design "Build Studio" philosophy, MIT © alchaincyf — luxury-minimal whitespace hero.

## Changes made in this repo

- Wrapped content in a HyperFrames 0.6 `#root` composition node.
- Replaced hardcoded sample copy with `data-composition-variables` slots (eyebrow, hero, desc, side_left, side_right); the hero word is split into per-character `.ch` spans at render time for the letter-by-letter reveal.
- Added a **9:16 portrait** composition at `compositions/portrait.html`.
- Font stack (Inter) is unchanged — it already covers Vietnamese.
- **Hero `line-height` raised** from `0.98` (9:16) / `0.96` (16:9) to `1.16` / `1.14` — a Vietnamese vowel can carry a horn AND a tone mark above it (Ỡ), which a sub-1 line box clips.
- **The hero auto-fit now keeps `white-space: nowrap`** instead of clearing it, and leaves a 3% margin. Each character is its own `inline-block`, so every character is a line-break opportunity: a floor()ed size one pixel too wide split "NGƯỠNG" into "NGƯỠ / G". Ordinary text cannot break inside a word; per-character spans can.
