# Attribution — frame-3d-flip

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Question then answer, before then after, claim then correction — in ONE gesture
rather than two scenes. `frame-myth-fact` shows both at once and strikes one
out; this hides the second until the turn, which is the right shape when the
answer is the payoff rather than the contrast.

HyperFrames renders through headless Chrome, so `transform-style: preserve-3d`
works with nothing added. Thirty-six templates and not one used it — the whole
3D transform family was untouched.

This is 2.5D, and that is the honest description: perspective on flat layers, not
a scene with lights and meshes. Real 3D belongs on the `remotion` backend, which
already exists and already has `--template=three`. Vendoring three.js into the
html path — 600 KB, or a CDN fetch on every render — would buy geometry this kit
has no use for and lose the property it does: draws with the network unplugged.

The back face is written rotated 180° and `backface-visibility: hidden` keeps
each side to itself. Without it both faces paint at once and the card reads as a
smear rather than a turn.

## Use

Slots: `frontLabel`, `front`, `backLabel`, `back`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
