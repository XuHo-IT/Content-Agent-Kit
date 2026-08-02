# Attribution — frame-broll

**Original template** authored for content-agent-kit. Not vendored from anywhere.

## Design

Full-bleed stock footage with narration text over it. A fixed top/bottom scrim keeps the
text readable regardless of how bright the clip is — the pipeline picks clips nobody has
previewed, so an adaptive treatment would be unreliable.

## How the footage gets in

`scripts/video/lib/compose.mjs` copies the resolved clip to `assets/media.mp4` in a
throwaway copy of this folder, then renders. Set `media_kind: "image"` to use a still at
`assets/media.png` instead.

## Why 9:16 and 16:9 are different designs

Not a style choice. `hyperframes@0.6.94` passes a composition whose `<video>` covers the whole
frame straight through as the output, discarding the page around it — so a full-bleed
landscape layout renders a bare clip with no text, silently. Portrait is unaffected because
the clip and the frame share an aspect ratio there.

`compositions/portrait.html` is therefore full-bleed; `index.html` puts the footage in a panel
beside the text. Both are verified rendered. Do not "unify" them.

## Slots

`chip`, `kicker`, `headline`, `subheadline`, `media_kind` — see `../CATALOG.md`.
Every text slot is optional; empty ones are hidden rather than left as blank space.
