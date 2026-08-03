# Attribution — frame-pentagram-stat

Vendored and adapted from:

- **Source:** [nexu-io/html-video](https://github.com/nexu-io/html-video) — `templates/frame-pentagram-stat`
- **License:** Apache-2.0 (attribution required, commercial use allowed)
- **Design lineage (upstream):** huashu-design "Pentagram" philosophy, MIT © alchaincyf — Swiss-grid data anchor.

## Changes made in this repo

- Wrapped content in a HyperFrames 0.6 `#root` composition node.
- Replaced hardcoded sample copy with `data-composition-variables` slots (label, headline, subtitle, anchor, footer_left, footer_right); simplified the bottom data bar to channel/source.
- Added a **9:16 portrait** composition at `compositions/portrait.html`.
- Font stack (Archivo) is unchanged — it already covers Vietnamese.
- **Cleared the branded default slot values.** `footer_left` and `footer_right`
  defaulted to the upstream author's channel name and site, which is what rendered
  whenever a caller left them empty. Both default to empty now.
