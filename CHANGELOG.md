# Changelog

Notable changes, newest first. Dates are the merge date. Versions follow
[semantic versioning](https://semver.org/lang/vi/); while the major is `0`, a minor
bump is where a breaking change is allowed to appear.

A **breaking change** here means one of: a `script.json` that used to validate no
longer does, a template slot name changes, or an environment variable is renamed or
required where it was not before. Each one is called out explicitly below.

## [Unreleased]

### Added

- **Ad performance can now feed back into what gets written.** `.mcp.json` declares five
  hosted Pipeboard servers (Meta, Google, TikTok, Snap, Reddit) and `skills/ads-report/`
  turns what they report into queue items rather than a dashboard — a report ending at
  "CTR was 1.4%" leaves the reader where they started.

  It writes a "not enough data" section and a "do not repeat" section, which matter more
  than the metrics: the first stops a losing angle being blindly re-tested next week, the
  second stops it being re-run at all. It proposes `queue.json` entries and then stops and
  asks, because a skill that can see an account spending real money does not get to set
  the content plan by itself.

  No credentials in the repo — OAuth in your client. Two things stated rather than implied:
  Pipeboard's own code is BSL 1.1, not open source like the rest of the tree; and the
  servers are read **and write**, so the connection that reads spend can pause a campaign.

- **Six marketing skills** in the registry, selected from ai-business-skills (MIT, 63 of
  them) — the ones that plug into this kit's loop: context, content calendar, video script,
  ad copy, ads audit, campaign design. Its default branch is `master`, which is exactly why
  `ref` is per-entry.

- **Skills from other projects, fetched on demand rather than vendored.**
  `skills/registry.json` catalogues them; `node scripts/install-skills.mjs --list` shows
  what is available and what is already installed. The first four are an SEO auditor and
  three design skills — taste, image generation and brand kit — all MIT, all markdown, none
  needing an API key.

  Vendoring them would have meant carrying four projects' licence obligations in this tree
  and re-merging by hand on every upstream fix, in a repo whose whole point is that it
  installs nothing. Fetching keeps that true. The honest cost: installing needs network.

  Every install pins the commit sha, copies the upstream licence in beside the skill, and
  writes a NOTICE.md recording where it came from — the same discipline `video-templates/`
  already applies. No licence file upstream means no install, because a skill with no
  licence is a skill nobody may legally reuse.

### Fixed

- **Post text is checked for leftover markup before it goes out.** No caption on Facebook,
  Instagram, TikTok or YouTube renders Markdown, so a heading arrived as the literal
  `### Heading`, `**bold**` kept its asterisks, and a CMS metadata block a writer left at
  the top of a draft became the opening two lines a reader saw:

  ```
  Meta: Claude Fable 5 đạt điểm cao nhất ở gần như mọi bài kiểm tra…
  Slug: claude-fable-5-ra-mat-roi-bi-go-sau-ba-ngay
  ```

  That is quoted from this repo's own reference sample, which shipped that way — so every
  agent scaffolded from the kit learned the habit from the example it was told to copy.
  `make-post.mjs` now refuses to send it, `validate-post.mjs --fix` repairs a copy without
  touching the original, and `audit-quality.mjs` gained a `markup-leak` rule for what has
  already been published. `Meta` and `Slug` were useful — they are `metaDescription` and
  `slug` fields on the sample now, out of the body.

  Ambiguous cases are warnings rather than errors on purpose: a line starting `- ` is a
  bullet in Markdown and a dialogue dash in Vietnamese prose, and a gate that fails on
  dialogue is a gate people switch off.

- **The repo has tests.** 22 of them, on `node:test` so nothing was added to install.
  Half assert what must *not* be flagged — `#AI` hashtags at the end of a caption, `2 * 3`,
  a sentence about Meta the company — because a checker that cries wolf protects nothing.

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
