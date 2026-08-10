# Attribution — frame-3d-device

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

`frame-screenshot` puts a captured page in flat browser chrome. This tilts it in
space, which is what every product page in the world does with its own app, and
it costs nothing extra: it reuses the SAME `media.kind = "screenshot"` plumbing
that already resolves and caches captures.

HyperFrames renders through headless Chrome, so `transform-style: preserve-3d`
works with nothing added. Thirty-six templates and not one used it — the whole
3D transform family was untouched.

This is 2.5D, and that is the honest description: perspective on flat layers, not
a scene with lights and meshes. Real 3D belongs on the `remotion` backend, which
already exists and already has `--template=three`. Vendoring three.js into the
html path — 600 KB, or a CDN fetch on every render — would buy geometry this kit
has no use for and lose the property it does: draws with the network unplugged.

The device rotates slowly and continuously rather than settling. A mockup that
stops moving is a still with extra steps; one that keeps turning reads as a
render, which is what it is.

The screen carries a CSS-only skeleton BEHIND the image. A broken `<img>` with an
empty alt paints nothing at all in Chrome, so a device with no capture yet was a
black rectangle — the same blank-default fault fixed in `frame-broll` and friends,
arriving by a different route. The skeleton is chrome and bars, no text, so it
never says anything the caller did not.

## Use

Slots: `kicker`, `headline`, `caption` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
