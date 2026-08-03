# Attribution — caption-kinetic-slam

**Source:** [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) — `registry/components/caption-kinetic-slam`
**License:** Apache-2.0 (attribution required, commercial use allowed)
**Type:** hyperframes:component
**Native size:** unspecified

## Description

Full-screen single-word display with alternating entrance directions

**Tags:** captions, caption-style, kinetic, typography, slam

## Not usable as a scene template

This folder has no `index.html`, and `listTemplateIds()` counts only folders that
have one — so `validate.mjs` rejects it as an unknown `templateId` and `compose.mjs`
throws if a script names it. That is correct, not a bug: upstream ships this as a *component*
(`compositions/components/`), a caption style meant to be composed into a frame
rather than rendered as one.

It is kept as reference material for whoever writes that composition. Until then it
contributes nothing to a render while still carrying an Apache-2.0 obligation, so
deleting the folder is a perfectly reasonable call.

## Changes in content-agent-kit

Vendored unmodified by `scripts/video/add-template.mjs`; only `meta.json` and
`hyperframes.json` were generated to match this kit's layout.

Do not delete this file — see the root `NOTICE.md`.
