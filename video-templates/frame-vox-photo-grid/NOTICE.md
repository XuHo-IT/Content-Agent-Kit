# Attribution — frame-vox-photo-grid

**Original template** authored for content-agent-kit. Not vendored from anywhere.

## The gap it closes

Before this, the kit could show exactly **one** picture per scene: `compose.mjs` copied a
single file to `assets/media.*` and the five media templates each drew that one file. Vox-style
visual journalism is built on several images at once — that whole register was undrawable.

This frame takes up to four, each with its own caption, plus a headline and a takeaway.

## How the pictures get in

A scene's `media` may now be an **array**. `scripts/media/lib/resolve.mjs` resolves each entry
to `assets/media-1.*` … `media-4.*` (and still writes the first to `assets/media.*`, so every
template built before multi-media existed keeps working). `media_count` and `media_kinds` are
set by the pipeline.

`media_kinds` matters because a grid routinely mixes a satellite **clip** with three **stills**,
and each cell has to know which element to draw. Guessing — trying an `<img>` and falling back
to `<video>` on error — would swap the element mid-render, and hyperframes seeks frame by
frame, so the swapped frame would come out blank.

## An empty cell is removed, not left blank

Three pictures in a 2×2 should read as three, not as three and a hole.

## Ambient motion

Each cell drifts on its own period (13–19s, alternating direction) and one slow sheen crosses
the grid. The scale delta is 0.04: at that size it reads as depth rather than movement, and it
does not compete with the captions. The **content** layer still settles by ~2s so everything
stays readable — see `skills/motion-craft/SKILL.md`, "Two layers".

The sheen loop is `linear`. An eased loop stutters visibly at the seam.

## Why 9:16 and 16:9 are different designs

Same reason as `frame-broll`, and not a style choice: `hyperframes@0.6.94` passes a composition
whose `<video>` covers the whole frame straight through as the output, discarding the page
around it. Portrait stacks headline / grid / takeaway; landscape puts the grid on the right and
the text on the left. Do not "unify" them.

## Slots

`kicker`, `headline`, `cap_1`…`cap_4`, `takeaway`, `source` — plus `media_count` and
`media_kinds`, which the pipeline sets. See `../CATALOG.md`.
