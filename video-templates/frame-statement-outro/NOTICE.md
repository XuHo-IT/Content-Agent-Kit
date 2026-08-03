# Attribution — frame-statement-outro

**Original template** authored for AI-auto-generate-video (MIT © 2026 AI Coding,
© 2026 Ho Quang Hai). Not vendored from nexu-io/html-video.

## Design

An alternative outro / closing CTA: a paper card with a red rule, an uppercase
call-to-action, the channel name set giant in red, a muted source line and a
closing ink rule.

## Use

The alternative to `frame-logo-outro` for the final `type: "outro"` scene.
Slots: `cta` (≤60), `channel` (≤24), `source` (≤40) — see `../CATALOG.md`.

## Changes in content-agent-kit

The design, markup and CSS are untouched; the containing folder was renamed from
`templates/` to `video-templates/`. See the root `NOTICE.md`.

- **Cleared the branded default slot values.** `channel` defaulted to the original
  author's channel name and `source` to their site. Defaults render whenever a caller
  leaves a slot empty, so a forgotten slot published someone else's brand on your
  video. `channel` is a placeholder now and `source` is empty.
