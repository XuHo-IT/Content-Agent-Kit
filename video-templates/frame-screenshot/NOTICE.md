# Attribution — frame-screenshot

**Original template** authored for content-agent-kit. Not vendored from anywhere.

## Design

A captured web page inside a browser chrome (traffic-light dots + URL pill), used as
*evidence*: the viewer sees the real announcement page instead of a paraphrase.

The screenshot is top-aligned inside the frame on purpose — a page has its headline at the
top, and centring would crop exactly the part worth showing. The URL is trimmed to
host + path; a full link with query strings overflows the bar and reads as noise.

## How the image gets in

`scripts/media/screenshot.mjs` captures the page with headless Chrome;
`scripts/video/lib/compose.mjs` copies it to `assets/media.png` in a throwaway copy of
this folder before rendering.

## Slots

`kicker`, `headline`, `url`, `caption`, `source` — see `../CATALOG.md`.
