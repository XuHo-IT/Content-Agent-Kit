# Attribution — frame-logo-outro

Vendored and adapted from:

- **Source:** [nexu-io/html-video](https://github.com/nexu-io/html-video) — `templates/frame-logo-outro`
- **License:** Apache-2.0 (attribution required, commercial use allowed)
- **Design:** segmented logo assembly + glow bloom + tagline reveal on a deep violet radial canvas (accent #7c5cff).

## Changes made in this repo

- Wrapped content in a HyperFrames 0.6 `#root` composition node with explicit canvas size (upstream relied on the viewport).
- Replaced the **Tailwind CDN runtime** with plain CSS so the render is deterministic and needs no external script.
- Dropped the **Noto Sans SC** (Chinese) font; kept Inter Tight + Inter, which cover Vietnamese.
- Moved copy to `data-composition-variables` slots: `brand_name`, `tagline`, `primary_url`.
- Added a **9:16 portrait** composition at `compositions/portrait.html`; `index.html` is the 16:9 canvas. The glow/shimmer animation is kept from upstream.
- Replaced the upstream "H" monogram mark with a **`</>` code glyph** (purple brackets + white slash) to suit the "AI Coding" brand, keeping the same assembling-pieces + glow motion.
- **Removed the `brand-bar`** (hardcoded `assets/logo.svg` + "Senior AI Engineer" label)
  from both compositions, for the same reason as `frame-liquid-bg-hero`, and **deleted
  `assets/logo.svg`** (899 KB) once nothing referenced it. The assembling `</>` glyph — the
  template's actual design, drawn inline as SVG — is untouched. For a fully mark-free
  ending, use `frame-statement-outro` instead.
- **Made the two bottom corners real slots, and cleared the branded defaults.** The
  corners were fixed text in the markup — the upstream author's channel name and
  sign-off phrase — with no variable behind them, so every render burned them in no
  matter what the caller passed. They are `corner_left`/`corner_right` now, empty by
  default in 16:9, and an empty corner is removed rather than left as a blank strip.
  `brand_name`, `tagline` and `primary_url` lost their branded defaults for the same
  reason; an empty `primary_url` now drops the footer line instead of showing nothing
  in a row that still takes up space.
