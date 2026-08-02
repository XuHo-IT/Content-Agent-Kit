# Attribution — frame-liquid-bg-hero

Vendored and adapted from:

- **Source:** [nexu-io/html-video](https://github.com/nexu-io/html-video) — `templates/frame-liquid-bg-hero`
- **License:** Apache-2.0 (attribution required, commercial use allowed)
- **Design:** "Aurora Violet" — a deep indigo (#1e1b4b) canvas with four large blurred, slowly floating colour blobs (screen blend) and a faint grid; a centred hero headline.

## Changes made in this repo

- Wrapped content in a HyperFrames 0.6 `#root` composition node with explicit canvas size (upstream relied on the viewport).
- Replaced the **Tailwind CDN runtime** with plain CSS (deterministic, no external script).
- Dropped **Noto Sans SC** (Chinese) and **Source Serif Pro**; kept Inter Tight (covers Vietnamese).
- Swapped the `mix-blend-mode: difference` headline for a **vivid gradient (gold→orange→pink→purple) clipped to text + drop-shadow** (caller-overridable via `headline_from`/`headline_to`) so the hook is eye-catching yet readable over the moving blobs; added a staggered text reveal.
- Moved copy to `data-composition-variables` slots: `kicker`, `headline`, `subheadline`, `cta`, `brand`.
- Added a **9:16 portrait** composition at `compositions/portrait.html`; `index.html` is the 16:9 canvas. The floating-blob CSS `@keyframes` (the "liquid" signature) are kept.
- **Removed the `brand-bar`** (a hardcoded `assets/logo.svg` plus a "Senior AI Engineer"
  label) from both compositions. It stamped the original author's branding onto every video
  rendered from this template; branding belongs in the caller's text slots.
- **Deleted `assets/logo.svg`** (899 KB) once nothing referenced it. Keeping another
  project's brand mark in this repo served no purpose and accounted for a third of its size.
