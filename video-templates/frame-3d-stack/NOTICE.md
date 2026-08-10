# Attribution — frame-3d-stack

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

`frame-step-list` shows ORDER. This shows DEPTH — how many there are and that
they sit on top of each other, which is the shape of a tech stack, a set of
options, or a pile of anything.

The front card is the readable one and the rest fall away behind it, dimmer and
further back. That is the point: a stack where every layer is equally legible is
a list drawn at an angle.

Each label sits at the BOTTOM of its card, because the part of a back card you can
see is the strip below the card in front of it. Centred labels — the first attempt
— put every one of them exactly on the edge that covers it, so three of four read
as text sliced in half.

Depth comes from `translateZ` alone. Multiplying it by a hand-written `scale()`
as well shrank the back card to three quarters and the pile stopped looking like
one object seen in perspective.

HyperFrames renders through headless Chrome, so `transform-style: preserve-3d`
works with nothing added. Thirty-six templates and not one used it — the whole
3D transform family was untouched.

This is 2.5D, and that is the honest description: perspective on flat layers, not
a scene with lights and meshes. Real 3D belongs on the `remotion` backend, which
already exists and already has `--template=three`. Vendoring three.js into the
html path — 600 KB, or a CDN fetch on every render — would buy geometry this kit
has no use for and lose the property it does: draws with the network unplugged.

## Use

Slots: `kicker`, `title`, `layers`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
