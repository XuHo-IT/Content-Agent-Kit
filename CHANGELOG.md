# Changelog

Notable changes, newest first. Dates are the merge date. Versions follow
[semantic versioning](https://semver.org/lang/vi/); while the major is `0`, a minor
bump is where a breaking change is allowed to appear.

A **breaking change** here means one of: a `script.json` that used to validate no
longer does, a template slot name changes, or an environment variable is renamed or
required where it was not before. Each one is called out explicitly below.

## [Unreleased]

### Fixed

- **Two per-template notices named the wrong owner by implication.**
  `frame-aicoding-comparison` and `frame-aicoding-list` read "Original template authored for
  this repo (AI Coding)" while three templates genuinely owned by this kit read "authored for
  content-agent-kit". A reader holding only the folder would take "this repo" to mean this
  one. They are MIT © AI Coding / Ho Quang Hai, exactly as the root NOTICE has always said.

  Nothing in the licence chain was broken — the root file was always right — but the notice
  that actually *travels* when someone copies a folder is the per-template one, which is
  precisely what Apache-2.0 §4 asks to be kept.

- **The root NOTICE accounted for 14 of 20 template folders.** Missing: the four added in
  0.3.0, and `caption-kinetic-slam` / `transitions-blur` — both **vendored Apache-2.0**. The
  obligation does not depend on whether the code can use them, and it cannot: upstream ships
  them as a component and a block.

- **SECURITY.md predated three new attack surfaces.** MCP connections that write to live ad
  accounts, a video backend that spends money per second, and a skill installer that writes
  third-party code into the folder your agent reads and obeys. All three are now written
  down, including the one that only bites unattended runs: the api backend's confirmation
  prompt protects a person at a keyboard, not a cron job — set a ceiling.

### Added

- **Six attribution tests.** Every template folder has a NOTICE; every NOTICE names an owner
  without needing the root file beside it; third-party ones name a licence; the Apache-2.0
  text ships and is pointed at; the root NOTICE accounts for every folder; and LICENSE stays
  plain MIT with nothing appended — appending prose is what makes GitHub report NOASSERTION
  and drop the licence badge.


## [0.3.0] — 2026-08-03

Thirteen changes across the output the kit produces, the tooling around it, and the checks
that keep both honest. The theme running through them: **most of these were found by running
the thing, not by reading it.**

The kit went from **no tests to 108**. Six of the fixes below were invisible to a passing
build — a render that succeeded, a validator that passed, a documented setup that could not
work, a meta-skill that had stopped mentioning half the repo.

### Highlights

| | |
|---|---|
| **Posts are plain text** | `Meta:` / `Slug:` blocks and Markdown reached readers verbatim, including in the repo's own reference sample. `make-post.mjs` now refuses to send it. |
| **Skills, fetched not vendored** | An SEO auditor, three design skills and six marketing skills, on demand, each with its licence and a NOTICE recording the commit. |
| **Ads feed back into content** | Five Pipeboard MCP servers plus an `ads-report` skill that produces queue items rather than a dashboard. |
| **Campaign visuals via Canva** | Hands back a file, not a design link, because everything downstream takes a path. |
| **Three video backends** | `html` (free, default, unchanged), `api` (Veo/Imagen — bills per second, three gates before spending), `remotion` (scaffolds, does not install). |
| **18 templates, 5 genres** | Four new frames that draw from their data, and sequences answering "which frames, in what order". |


### Added

- **The video validator is tested in the direction that matters.** CI already proved it
  accepts the reference script; nothing proved it catches a bad one. 24 tests now cover the
  rejections — wrong version, unrenderable aspect, duplicate scene ids (which silently
  overwrite each other's audio and clips), an emoji or URL or bare digits in narration,
  media with no way to find it, a screenshot with a `file://` url — plus the boundary that
  keeps `--strict` meaningful: craft problems warn, schema problems block.

- **A gallery in the README**, so the output is visible without cloning: the sample article's
  cover image, and a labelled strip of the four newest templates linking into `CATALOG.md`.

  The cover ships as PNG because that is what was asked for. Worth knowing before copying the
  choice: the source was a 241 KB JPEG, so the PNG is 1.6 MB for pixel-identical output — the
  compression damage is already baked into the pixels, and re-encoding only freezes it in a
  larger file. PNG earns its size when an image is generated straight to PNG; converting a
  JPEG to it does not.

- **Four new scene templates, and genre presets that say which frames to use in what order.**
  `frame-review-verdict` (score ring + verdict + pros/cons), `frame-quote-testimonial`,
  `frame-chart-bars` and `frame-step-list` — 14 templates to 18, two dark canvases and two
  light, so a themed video has both to work with.

  All four draw from their data rather than from hand-set values. The review arc is computed
  from `score`/`maxScore`, and the chart bars from the numbers, scaled to the largest: a
  frame whose drawing disagrees with its printed number contradicts itself on screen, and
  that is the easiest mistake to make when widths are typed by hand.

  Each one removes what it cannot fill instead of leaving a placeholder — an empty pros
  column, an unattributed quote, a chart with no parseable data. A heading with nothing
  under it reads as missing data rather than as a deliberate omission.

  `templates/VIDEO_GENRES.template.json` answers the question the catalogue does not: not
  "what shape is a script" but "I want to make a review — which frames, in what order?".
  Five genres, each beat carrying the reason it is there. Without it, every video ends up
  using the first three templates in the list.

  11 new tests cross-check the library against what is on disk: both compositions present,
  both exposing the same slots, every canvas measured, every genre naming a template that
  exists, and no default anywhere pointing at a real URL — the regression that shipped
  someone else's brand on other people's videos stays checked rather than remembered.

- **Two more video backends, and profiles to choose between them.**
  `VIDEO_BACKEND=html | api | remotion`, defaulting to `html`. `script.json` does not change
  shape between them — a scene is a scene; the backend decides how the pixels get made.

  `html` is verifiably unchanged, not just intended to be: the branch was added *above* the
  existing pipeline and the ~250 lines below it were not moved, so `--estimate` output is
  byte-identical before and after. Extracting that pipeline into a module for symmetry would
  have meant moving the one path that definitely works, for no behaviour change.

  `api` calls Veo and Imagen, and bills **per second**: $0.40/s means a 60-second video is
  $24. Three gates run before any money moves — the estimate always prints first with the
  rate it used, a ceiling refuses outright, and over $1 with no ceiling set it stops and
  asks. `profiles/personal.json` sets that ceiling to `0`. Generated clips are kept and
  reused because each one was paid for.

  Its wire format has **not** been run against a live account and says so, in the module
  header and in the docs, the same way `media-hosts/r2.mjs` does about its S3 wiring.
  `--dry-run` prints every request without sending one.

  `remotion` scaffolds an npm project beside your script and prints two commands rather than
  running `npm install` for you — installing hundreds of packages is a decision the person at
  the keyboard makes, not a side effect of asking for a render. Nothing is added to this kit.

  Profiles hold what you would otherwise retype into every script. Precedence is
  `script.json > flags > profile > .env > default`: a profile never overrides what a script
  states explicitly, because the script is about one video and knows more.

  One bug found by testing rather than reading: `pick()` drops a trailing `null`, so an unset
  ceiling resolved to `undefined` and the "would bill $X and no ceiling is set" guard compared
  against `null` and never fired — a render could have started spending with no confirmation
  at all. Fixed, and pinned by a regression test.

- **Campaign visuals through Canva's own MCP server**, plus `skills/design-campaign/`. The
  kit could put an image on a post and inside a video frame but could not make one — stock
  search finds photographs and screenshots capture a page; neither is a branded visual.

  The skill hands back a file on disk, not a Canva link, because everything downstream takes
  a path or a URL and a design link is neither — it fails at the webhook rather than where
  the mistake was made. Brand comes from `PLAYBOOK.md`, then `theme-map.json`, then the
  brandkit skill, stopping at the first that answers: if the video side already has a theme,
  an image that disagrees turns one post into two visual identities.

  Written for the **free** Canva plan. Resize needs Pro and autofill needs Enterprise, so
  autofill is an accelerator and never a required step — a workflow depending on Enterprise
  is one most readers of this repo cannot run. That also means deciding the canvas before
  opening Canva, since producing the wrong size costs a redo.

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

- **A theme now reaches `scene.inputs`, not just the template's HTML.** `applyTheme`
  rewrites the template file; inputs never passed through it. They travel out through
  `variables.json` and hyperframes injects them at render time, *after* theming has run — so
  a caller who wrote `"accent": "#f59e0b"` got amber on a paper-blue video.

  The evidence had been in the repo the whole time: the paper-blue sample hand-edited that
  exact hex to teal, because there was no other way. And the self-test looked like it covered
  this — it checks hex inside `data-composition-variables`, which *are* themed because they
  live in the HTML. The one place that was not themed is the one place it never looked.

  Both halves now take the same `invert` flag, computed once, and a test asserts that wiring
  directly. Only whole-string hex values are mapped: `#AI` in a caption stays a hashtag, and
  `"Mã màu là #f59e0b nhé"` stays a sentence. Each recolour is logged with its path, so a
  surprising colour is traceable rather than mysterious.

- **`.env.example` named a variable the code does not read, and omitted the one it does.**
  vbee needs `VBEE_TOKEN`; the file declared `VBEE_API_KEY`. Anyone following the documented
  setup for the Vietnamese TTS provider, in a Vietnamese-first kit, could not make it work —
  and the error message sent them back to the file that had given them the wrong name.

  Also dead: `AUDIT_ID_FIELD`, and `COVERR_API_KEY` / `UNSPLASH_ACCESS_KEY`, which no source
  module has ever read. Also missing: `GITHUB_TOKEN`, `VBEE_BITRATE`, `VBEE_WEBHOOK_URL`,
  `AUDIT_KIND_FIELD` and the `PEXELS_API` / `PIXABAY_API` aliases.

  Five tests now hold `.env.example` and the code to each other in both directions, including
  a direct cross-check against the provider key lists in `tts.mjs` and the `needs` arrays in
  the media hosts. This is env-only software: `.env.example` is not documentation about the
  setup, it **is** the setup.

- **The meta-skill did not know about anything added recently.**
  `bootstrap-content-agent` scaffolds every new agent, and it mentioned none of
  `validate-post`, `install-skills`, the skill registry, `ads-report`, `design-campaign`,
  `VIDEO_BACKEND`, `profiles/`, `VIDEO_GENRES` or `.mcp.json` — so no generated agent would
  have had any of it. It also never copied `research-and-capture`, leaving generated video
  agents without the skill that resolves B-roll and takes screenshots.

  Its Phase 1 said to skim `docs/02,05,06,07,10,11`, which names no file and links nowhere;
  three of those documents were reachable from nothing else in the repo.

  `ads-report` and `design-campaign` shipped without appearing in either README, and
  `review-gate` — the pre-publish review — never mentioned the caption gate.

  Seven tests now check that things which exist are reachable from where people look.

- **Three more templates still defaulted to "AI Coding".** `frame-build-minimal`,
  `frame-creative-voltage` and `frame-vignelli` carried the upstream author's channel name
  in a slot value. The earlier sweep removed the URLs and the test that guards it checks for
  links — a bare channel name leaks just as effectively, and reads as deliberate rather than
  as a leftover. The test checks for the name now too.

- **Two new templates rendered landscape inside a 9:16 video.** `frame-chart-bars` and
  `frame-step-list` shipped in the previous change with correct CSS, a correct viewport meta
  and stale `data-width="1920" data-height="1080"` on `#root` — and `data-*` is what the
  renderer actually sizes the canvas from. Caught by rendering a real video and looking at
  the contact sheet, which failed to build because two tiles came out 16:9.

  Nothing else could have caught it: the render succeeded, and a screenshot harness that
  forces the window size shows the layout the CSS intends. Two tests now pin the canvas
  attributes per aspect and check the viewport meta agrees with them.

- **`frame-liquid-bg-hero` burned an aspect-ratio label and "Bản tin" into every render.**
  Both were fixed text in the markup with no slot behind them, so the finished video said
  "9:16" in the corner. Same class of bug as the two `frame-logo-outro` corners fixed
  earlier, missed because the search then was for brand strings rather than for literal
  text. They are `chip_top` and `chip_bot` slots now, empty by default, and a chip with
  nothing in either half is removed rather than left as a floating separator.

  A test now asserts that no template contains literal caller-facing text at all.
  `frame-glitch-title` is exempt by name — its broadcast furniture is the design — and
  naming the exception is the point: the next one has to be argued for, not added quietly.

- **`frame-review-verdict` had untranslatable column headings.** "Điểm cộng" and "Điểm trừ"
  were fixed markup. The kit is Vietnamese-first so they stay the defaults, but a heading no
  slot can reach means the template cannot be used in another language at all.

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

- **README trimmed from 215 lines to 180, in both languages.** The Video section was 54 lines
  of prose restating what `docs/14` and `docs/20` already say; it is 25 now, as a table. The
  eight core ideas were eight paragraphs; they are eight table rows.

  Two things the trim surfaced rather than caused: the heading said "Bảy ý tưởng cốt lõi"
  above a list of **eight**, and the sample-article line still described meta and slug as
  living *in* the article — which stopped being true when they moved to their own fields. The
  word count moved with them, 990 to 951, verified against the file rather than adjusted by
  eye.

  The "Zero dependencies" badge pointed at a `### Zero-dependency là cố ý` heading that the
  trim folded into Requirements. A badge that scrolls nowhere is worse than one that links
  out, so both language versions now point at Requirements — checked by slugifying every
  heading and every in-page link.

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

[Unreleased]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.2.0
[0.1.0]: https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.1.0
