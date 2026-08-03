# Changelog

Notable changes, newest first. Dates are the merge date. Versions follow
[semantic versioning](https://semver.org/lang/vi/); while the major is `0`, a minor
bump is where a breaking change is allowed to appear.

A **breaking change** here means one of: a `script.json` that used to validate no
longer does, a template slot name changes, or an environment variable is renamed or
required where it was not before. Each one is called out explicitly below.

## [Unreleased]

### Fixed

- **Templates no longer default to someone else's brand.** `data-composition-variables`
  are what render when a caller leaves a slot empty, and five templates defaulted to the
  upstream author's channel name and website — so a forgotten slot published their URL on
  your video. `frame-liquid-bg-hero`, `frame-logo-outro`, `frame-pentagram-stat` and
  `frame-statement-outro` now default to a neutral placeholder or to empty.
- **`frame-logo-outro` had two corner labels that no variable could reach.** They were
  fixed text in the markup — a channel name and a sign-off phrase — burned into every
  render regardless of what the caller passed. They are `corner_left` / `corner_right`
  slots now, empty by default in 16:9, and an empty corner is removed rather than left
  as a blank strip. An empty `primary_url` likewise drops the footer row instead of
  leaving a gap where a line used to be.
- **`add-template.mjs` claimed vendored templates "are picked up automatically".** They
  are not: `listTemplateIds()` counts only folders that have an `index.html`, and
  vendoring writes the upstream compositions but never one. The message now says what is
  actually missing and how to list the folders that are live.
- **The two vendored folders that cannot be used say so.** `caption-kinetic-slam` is an
  upstream *component* and `transitions-blur` an upstream *block*; neither is a scene
  template, so `validate.mjs` rejecting them is correct rather than a bug. Each `NOTICE.md`
  now explains that, and that deleting the folder is a reasonable call.
- **Template count corrected in `AGENTS.md`** — it said 11 where 14 are usable (16 folders,
  two without `index.html`). CI asserted `< 11`, which would not have caught three going
  missing; it asserts `< 14` now.
- **`.env.example` was missing every `R2_*` variable** while `getHost()` defaults to `r2`,
  and listed `MEDIA_HOST` as `cloudinary | catbox` with `r2` absent. Both fixed.
- **`apply-about.mjs` could not apply an empty `homepage`.** It never compared the field
  and only sent it when non-empty, so a deliberate `""` in `repo-about.json` was silently
  unenforceable.

### Changed

- README no longer calls the video templates "self-contained". Each is a single file with
  its own CSS and animation, but 29 of the 30 compositions `<link>` fonts from Google
  Fonts and two load GSAP from jsDelivr — on a bad connection that means a silent font
  fallback part-way through a five-minute render, which is worth knowing before you start.

## [0.2.0] — 2026-08-02

Theme engine: repaint every template from one line of `script.json`.

- `"theme": "paper-blue"` (or any entry in `video-templates/theme-map.json`) recolours a
  whole video without forking a template or touching a line of CSS (#11).
- A complete white / ocean-blue sample video, rendered end to end (#10, #11).
- Vietnamese became the primary README, with `README.en.md` alongside (#9).
- The repo About box and `main` branch protection moved into the repo as
  `.github/repo-about.json` + `apply-about.mjs` + `apply-protection.mjs`, so they are
  reviewable and reproducible instead of living only in the Settings UI (#8).
- Full Apache-2.0 licence text shipped at `LICENSES/Apache-2.0.txt`, which §4(a) requires
  when redistributing the 10 vendored templates, plus a CI check that it stays there (#12).
- The paper-blue sample stopped claiming it differed from the original by a single line;
  the two scripts differ by 446 lines. The defensible claim — no template was forked and
  no CSS edited — is the one made now (#12).

## [0.1.0] — 2026-08-02

First public release: the crawl → write → review-gate → publish agent kit, plus the 9:16
video pipeline.

- Video generation with voice-over, B-roll and web screenshots, rendered locally through
  Chrome + FFmpeg.
- Six TTS providers behind one interface; a `script.json` `voice` block overrides `.env`,
  so one environment serves many scripts.
- Stock footage and screenshot sourcing, with three media hosts (R2, Cloudinary, Catbox).
- Open-source scaffolding: licence, notices, contributing guide, security policy, code of
  conduct, issue and pull-request templates, CI.

[Unreleased]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.2.0
[0.1.0]: https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.1.0
