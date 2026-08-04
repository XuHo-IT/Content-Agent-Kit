# Attribution — frame-terminal

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

The largest hole in a kit aimed at technical content: twenty-two templates and
not one could show a command. Upstream ships thirty-three `code-*` items and
this kit vendors none of them, because they are blocks rather than scene
templates and every one would still need a 9:16 composition written by hand.

The command types itself with a `clip-path` sweep rather than a per-character
timer: one animation instead of forty, and it cannot drift out of step with the
narration the way a JS interval can.

`output` is "|"-separated. A line beginning with "!" is drawn in the error
colour — the whole reason to show a terminal is often that something failed,
and a red line is the difference between "here is a command" and "here is what
went wrong".

The window chrome carries no text, so the frame reads as a terminal in any
language.

## Use

Slots: `label`, `prompt`, `command`, `output`, `caption` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
