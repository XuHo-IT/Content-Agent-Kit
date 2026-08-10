# Attribution — frame-3d-spotlight

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

The one skill in vibe-motion's 3D set that ported: `light-spotlight-render` is
described as a "swinging spotlight text-reveal HTML animation" — HTML, not
three.js and not a Remotion component. Everything else in that set either clones
a separate three.js repository or is a React component for the Remotion backend.

Read for the technique, rebuilt here from scratch: a cone rotating about its apex
in perspective, with the text revealed by a mask that tracks it. No code was
copied — that repository publishes no licence, and this kit does not carry
unlicensed work even when it may fetch it.

Two things the first render showed. The beam's gradient faded out by 72% of its
length, which is above where the headline sits — a spotlight that stops short of
the thing it is lighting. And the sweep ended mid-gradient, leaving the second
line permanently darker than the first, which reads as a broken font rather than
as light. The gradient now holds its lit colour to the end, so the finished state
is evenly lit and only the ARRIVAL is a sweep.

HyperFrames renders through headless Chrome, so `transform-style: preserve-3d`
works with nothing added. Thirty-six templates and not one used it — the whole
3D transform family was untouched.

This is 2.5D, and that is the honest description: perspective on flat layers, not
a scene with lights and meshes. Real 3D belongs on the `remotion` backend, which
already exists and already has `--template=three`. Vendoring three.js into the
html path — 600 KB, or a CDN fetch on every render — would buy geometry this kit
has no use for and lose the property it does: draws with the network unplugged.

## Use

Slots: `kicker`, `headline`, `caption` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
