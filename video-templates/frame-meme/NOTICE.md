# Attribution — frame-meme

**Original template** authored for content-agent-kit. Not vendored from anywhere.

## Design

A meme as the whole scene: the image centred in the kit's palette, with a chip, a kicker and
one caption line. It exists to break the rhythm — a run of text frames and stock B-roll is
one tone for ninety seconds, and a meme is a change of energy that costs one scene.

## The meme is never filtered, tinted or blended

This is the reason the template exists next to `frame-media-inset`, which tints its media
into the palette **on purpose**. A meme recoloured to match a dark brand palette is no longer
the meme: its colour is part of how the joke lands, and the whole point of adding memes was
more colour, not less.

If a later tidy-up "unifies" `.meme` with the theme system, it has removed the feature. The
frame around the image is themed; the image is not.

## `contain`, not `cover`

A meme's text runs to its own edges. Cover-cropping one into 9:16 cuts the punchline off —
which is invisible to every test, because the render succeeds and the frame is full.

## How the image gets in

`scripts/video/lib/compose.mjs` copies the resolved file to `assets/media.png` in a throwaway
copy of this folder, then renders. An **animated** meme arrives as `assets/media.mp4` — the
`meme` source requests a `.gif` when the scene says `"kind": "video"`, and the media pipeline
converts it. Set `media_kind` accordingly; the pipeline does that for you.

## Why 9:16 and 16:9 are different designs

Same reason as `frame-broll`, and not a style choice: `hyperframes@0.6.94` passes a
composition whose `<video>` covers the whole frame straight through as the output, discarding
the page around it — so a full-bleed landscape layout renders bare media with no text,
silently. Portrait centres the meme with text above and below; landscape puts it in a panel
on the right. Do not "unify" them.

## Regenerating

Both compositions are emitted from one source so their slots cannot drift apart and a fix
cannot land in only one aspect. The generator lives with the change that introduced it; to
edit, change the shared markup/JS and the per-aspect CSS block together, then re-run
`node scripts/video/theme-probe.mjs --template frame-meme`.

## Slots

`chip`, `kicker`, `caption`, `media_kind` — see `../CATALOG.md`.
Every text slot is optional; an empty one is hidden rather than left as blank space.
