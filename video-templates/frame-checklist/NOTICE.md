# Attribution — frame-checklist

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Pros and cons existed only inside `frame-review-verdict`, welded to a score
ring. Plenty of advice has two columns and no score, and reaching for the review
frame to get them meant inventing a number to put in the ring.

Either column disappears when empty, so the same template does "five things to
do" and "five things to stop" without a heading left hanging over nothing.

The ticks and crosses are CSS `content`, not markup — same as the oversized
quote mark in `frame-quote-testimonial`. They are punctuation for the layout
rather than words, so no slot needs to reach them.

## Use

Slots: `kicker`, `title`, `doLabel`, `dos`, `dontLabel`, `donts` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
