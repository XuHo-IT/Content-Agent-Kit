# Attribution — frame-aicoding-list

**Original template** authored for AI-auto-generate-video (MIT © 2026 AI Coding,
© 2026 Ho Quang Hai). Not vendored from nexu-io/html-video.

This is third-party work, not content-agent-kit's own. The wording here used to name the
owner only as `this repo`, which a reader holding just this file would take to mean the
opposite of what is true.
This notice is what travels with the folder if someone copies the template, so it has to
name the copyright holder without needing the root NOTICE.md beside it.

## Design

A dark, glossy "impact / comparison list":

- Near-black canvas (#08080f) with a warm orange→red radial glow (top-left), a
  cool violet counter-glow, and a faint masked grid — built with layered CSS
  `radial-gradient`s (no images).
- A big title with a gradient accent word (orange→red) + a muted subtitle.
- A stack of rounded item cards, each: a coloured icon chip (emoji icon), a
  title + description, and a coloured right-hand tag. Colour is driven per item
  by `level` (`danger` red / `warn` amber / `good` green / `info` blue), with a
  glowing left accent bar.

Pure CSS `@keyframes` (header fades down, cards stagger up). Be Vietnam Pro
(Vietnamese-native). 16:9 = `index.html`, 9:16 = `compositions/portrait.html`.
