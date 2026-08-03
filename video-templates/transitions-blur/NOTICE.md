# Attribution — transitions-blur

**Source:** [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) — `registry/blocks/transitions-blur`
**License:** Apache-2.0 (attribution required, commercial use allowed)
**Type:** hyperframes:block
**Native size:** 1920x1080 · 20s

## Description

Showcase of blur-based transitions between scenes

**Tags:** transition, showcase

## Not usable as a scene template

This folder has no `index.html`, and `listTemplateIds()` counts only folders that
have one — so `validate.mjs` rejects it as an unknown `templateId` and `compose.mjs`
throws if a script names it. That is correct, not a bug: upstream ships this as a *block* demonstrating
transitions between scenes, at 1920x1080 landscape. This kit renders 9:16 and
stitches scenes itself, so it would need both a portrait composition and a way to
sit between two frames.

It is kept as reference material for whoever writes that composition. Until then it
contributes nothing to a render while still carrying an Apache-2.0 obligation, so
deleting the folder is a perfectly reasonable call.

## Changes in content-agent-kit

Vendored unmodified by `scripts/video/add-template.mjs`; only `meta.json` and
`hyperframes.json` were generated to match this kit's layout.

> ⚠️ Native size is LANDSCAPE. This kit renders 9:16, so a portrait composition
> at `compositions/portrait.html` has to be written before this is usable there.

Do not delete this file — see the root `NOTICE.md`.
