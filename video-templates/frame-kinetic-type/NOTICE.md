# Attribution — frame-kinetic-type

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Eighteen templates and every one of them presented text as a block that faded
or rose in one piece. That reads as a slide. Type becomes motion when the
words arrive in the order they are spoken, which is also the order a viewer
reads them — so the frame keeps pace with the narration instead of racing it.

The sentence is split on whitespace in JS rather than authored as separate
elements, because a caller writing script.json passes a string. `accent` names
one word to hold longer and colour differently; it is matched case- and
punctuation-insensitively so "kém." still matches "kém".

Wrapping is deliberate: words are inline-block inside a flex-wrap row, so a
long line reflows rather than overflowing the canvas. Nothing here measures
text, so nothing here can be defeated by a font that failed to load.

## Use

Slots: `kicker`, `line`, `accent`, `footnote` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
