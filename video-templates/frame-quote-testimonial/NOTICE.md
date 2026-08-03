# Attribution — frame-quote-testimonial

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Someone else's words, credited. The quote is the only large thing on screen; attribution
is small and below it, because a testimonial that leads with the logo reads as an advert
and gets scrolled past.

## Use

`type: "body"`. Slots: `quote` (≤200), `name` (≤40), `role` (≤60) — see `../CATALOG.md`.

Two behaviours worth knowing:

- **Quote type steps down in three sizes** as the text gets longer, in code rather than
  CSS. One size that fits 200 characters looks timid at 60; one that suits 60 overflows at
  200, and an overflowing quote is a broken frame rather than a small flaw. The 9:16
  thresholds are lower because a narrower frame wraps the same text to more lines.
- **The avatar is the first letter of `name`**, so a quote pulled from a review works with
  no photo. With no `name` and no `role` the whole attribution row is removed rather than
  showing an empty circle — an unattributed quote is worse than no quote.

## Changes in content-agent-kit

None — written here.
