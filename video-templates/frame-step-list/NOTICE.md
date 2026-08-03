# Attribution — frame-step-list

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Numbered steps for a tutorial or a listicle. They arrive one at a time, tied to the order
they are narrated in — that stagger is the reason this is a template rather than a bullet
list on a slide, because a viewer who reads all five at once has stopped listening by
step two.

## Use

`type: "body"`. Slots: `kicker` (≤24), `title` (≤60), `steps` — see `../CATALOG.md`.

`steps` is `"|"`-separated, capped at **five**. A sixth either overflows the frame or
forces type too small to read on a phone; split into two scenes instead, which paces
better anyway.

Type steps down as the list grows. 16:9 drops further than 9:16 does, because a
1920px-tall frame holds five steps at a size a 1080px-tall one cannot.

## Changes in content-agent-kit

None — written here.
