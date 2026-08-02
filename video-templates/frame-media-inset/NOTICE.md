# Attribution — frame-media-inset

**Original template** authored for content-agent-kit. Not vendored from anywhere.

## Design

A poster layout that keeps its own visual language, with the footage framed inside it
rather than behind everything. A soft tint over the clip ties it into the palette so it
reads as part of the design instead of a pasted box.

## When to use which

- `frame-media-inset` — the clip ILLUSTRATES a point; the words still carry the scene.
- `frame-broll` — the footage IS the scene and one line sits over it.

## How the media gets in

`scripts/video/lib/compose.mjs` copies the resolved file to `assets/media.mp4` (or
`assets/media.png` when `media_kind: "image"`) in a throwaway copy of this folder.

## Slots

`kicker`, `headline`, `caption`, `footer_left`, `footer_right`, `media_kind` — see `../CATALOG.md`.
