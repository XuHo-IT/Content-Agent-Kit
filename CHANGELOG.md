# Changelog

Notable changes, newest first. Dates are the merge date. Versions follow
[semantic versioning](https://semver.org/lang/vi/); while the major is `0`, a minor
bump is where a breaking change is allowed to appear.

A **breaking change** here means one of: a `script.json` that used to validate no
longer does, a template slot name changes, or an environment variable is renamed or
required where it was not before. Each one is called out explicitly below.

## [Unreleased]

### Added — five templates, each filling a gap that could be named first

22 → 27. Picked by asking what the kit **could not draw**, not by adding another way to show
a headline.

| | |
|---|---|
| `frame-terminal` | Twenty-two templates and not one could show a command. Upstream ships 33 `code-*` items and this kit vendors none, because they are *blocks* — no `index.html`, so no `script.json` can name them. The command types itself with a `clip-path` sweep rather than a per-character timer, and a line starting with `!` is drawn in the error colour: showing the failure is usually the point. |
| `frame-timeline` | `frame-step-list` is procedural — do one, then two. A timeline is chronological, and the gap between two dates is part of the claim: "three years" and "three weeks" are different stories told with the same steps. Horizontal at 16:9, **vertical at 9:16**. |
| `frame-myth-fact` | Neither existing comparison frame can strike a claim down. `frame-aicoding-comparison` puts two products side by side; `frame-split-compare` puts two states of one thing. |
| `frame-checklist` | Pros and cons existed only *inside* `frame-review-verdict`, welded to a score ring — so getting two columns meant inventing a number to put in it. |
| `frame-chat-bubbles` | `frame-quote-testimonial` is a formal pull-quote. A chat reads as overheard rather than as supplied, which is a different kind of credibility. |

Wired into five genres: `tutorial` shows the hardest step as the actual command, `news` traces
how it got here, `review` opens on the belief it overturns, `listicle` closes on advice,
`testimonial` shows how it was actually said.

**Three bugs found by rendering and looking**, none of them catchable by a test:

- **The strike-through crossed only the first line.** It was a bar at `top: 52%` — correct on
  a one-line myth, and on a two-line one it lands *between* the lines and reads as an
  underline of the first. Now a repeating gradient whose period is the line height, with
  `box-decoration-break: clone` so the rule hugs each line instead of running past a short
  last line into empty space.
- Terminal type too small to read on a phone (30px → 33px).
- Timeline markers arriving 0.22s apart, on a frame whose whole point is the distance between
  them.

### Added — `new-template` skill

Say *"template mới cho hôm nay"* and it surveys what exists, cross-checks
`VIDEO_GENRES.template.json` for a beat with no good frame, and **names the gap before writing
any CSS**. Asked for "new templates" plural, it brings back two or three candidates with the
gap each fills rather than building five nobody needed.

It also says when **pulling from upstream is the cheaper answer**, and warns about the trap
that costs an hour: a vendored block is building material, not a scene template.

It carries the two traps that pass every test and still look wrong — a delayed animation with
no declared start state showing its ending first, and an animation travelling against the
thing it reveals — plus one I hit myself: `data-composition-variables` does **not** reach the
renderer. Those are the editor's preview defaults, and `composeTemplate({ inputs: {} })` comes
back blank. Confirmed against `frame-review-verdict`, which predates all of this.

### Fixed — two checks that were not checking

- **The kit's own template count was hand-written in seven places** — the same failure just
  fixed for the upstream count, in the same repo, unnoticed. It needs no network, so it is now
  a test that fails in CI rather than a job that notices tomorrow.
- **"Every skill is named in a README" passed for the wrong reason.** It matched substrings,
  and `new-templates.jpg` contains `new-template` — so the new skill was reported as
  documented when the only match in either README was an image filename. Word boundaries now;
  it went red immediately, which is what it should have done.

### Added — a daily watch on the upstream template registry

```bash
node scripts/video/registry-watch.mjs           # report; exit 1 if anything drifted
node scripts/video/registry-watch.mjs --write   # update the snapshot and the counts
```

**Nine numbers in the docs were wrong when this was written.** The registry holds **176**
items; six files said 146. The per-type table said 113 blocks and 25 components against an
actual **132** and **36**. Thirty items had arrived — including one 29-item commit — and
nothing in the repo could notice, because every number was typed by hand and derived from
nothing.

It compares upstream against `video-templates/registry-snapshot.json`, so it can tell *"this
appeared"* from *"this was always there"*, and it checks that every name in
`add-template.mjs`'s `PRESETS` still exists upstream — a rename there currently fails halfway
through a fetch, after files are already written.

`.github/workflows/registry-watch.yml` runs it daily and opens **one** pull request when
something moved, force-pushing the same `chore/registry-sync` branch rather than leaving a
graveyard of superseded PRs.

**It does not add templates**, which is a decision rather than a limitation. A scene template
needs its canvas measured in Chrome (the runner has none), a `CATALOG.md` entry written by
someone who looked at the frame, and both aspects — seven of the eight upstream examples ship
16:9 only. Blocks and components *would* pass CI, since the template tests skip anything with
no `index.html`, but vendoring them wholesale contradicts the reason `add-template.mjs`
exists. The robot reports; a person chooses.

### Added — `Author gate`: a PR from outside does not become mergeable on its own

A pull request opened by anyone other than the repository owner, `github-actions[bot]` or
`dependabot[bot]` fails the new required check until a maintainer adds the `reviewed` label.

It gates **merging, not contributing** — `CONTRIBUTING.md` invites small PRs outright and that
stays true, so the check's own output says so rather than showing a bare red X.

Stated plainly in `docs/13`: this is **not a security boundary**. `enforce_admins` is `false`
and the required review count is `0`, so the owner can merge straight past it. Raising the
review count to 1 is deliberately not the fix — GitHub forbids approving your own pull
request, so on a solo-maintained repo it would lock the maintainer out of their own main
branch, Dependabot's security bumps included.

The Actions setting the daily workflow needs — *"Allow GitHub Actions to create and approve
pull requests"*, off by default and checked before any workflow-level `permissions:` block —
is now recorded in `.github/repo-about.json` and applied by `apply-about.mjs`, rather than
clicked once and forgotten.

### Changed — the README's gallery images are strips, not walls

`templates-2026.jpg` was **1080×1920**. GitHub scales an image to the column width, so a 9:16
grid renders as something the reader scrolls past — and nothing on it said which template was
which, so you had to count against the prose underneath.

Now a labelled 1×4 strip at **960×452**, matching the sample video's contact sheet.

| | before | after |
|---|---|---|
| `templates-2026.jpg` | 1080×1920, 115 KB | 960×452, **44 KB** |
| `new-templates.jpg` | 1200×744, 82 KB | 960×452, **54 KB** |

They are also **reproducible** now. The old images came from an ad-hoc ffmpeg command that
existed only in a terminal:

```bash
node scripts/video/template-sheet.mjs --preset 2026 \
  --inputs examples/gallery/gallery-inputs.json --out examples/gallery/templates-2026.jpg
```

`scripts/video/lib/sheet.mjs` is extracted from `contact-sheet.mjs` so both use one
implementation of the three ffmpeg traps that each fail the *whole* chain: `drawtext` erroring
rather than falling back when no font is found, the single backslash a Windows drive colon
needs, and `drawtext`'s own expression vocabulary where `ih` is undefined. `contact-sheet.mjs`
is 68 lines shorter and behaves identically.

### Fixed — a .jpg that was really a PNG

`grid()` copied its single intermediate PNG row straight to the output path, so a `.jpg`
output was a PNG wearing a JPEG's name — three times the bytes it needed. Browsers sniff the
content and render it anyway, which is exactly why it survived: nothing looked wrong. It came
from `contact-sheet.mjs`, where the default output is `.png` and it never showed.

A test now checks every committed image's magic bytes against its extension.

### Fixed — an image nobody could reach

`examples/gallery/burned-captions.jpg` shipped in a release referenced by **nothing** — it was
made for a pull-request description, which lives on GitHub rather than in the tree. Now in
`docs/14`'s captions section, and a test fails on any committed image that no file links to.

### Fixed — the backend table called Remotion "free", with no qualification

It is free for individuals and small companies. **For-profit organisations above a size
threshold need a paid company licence** — Remotion is source-available, not open source, which
is why GitHub reports it as `NOASSERTION` rather than an SPDX id.

True for most people reading it and not true for everyone, which is the worst way for a cost
line to be wrong. Corrected in both languages, and said by the backend itself at the point of
use — someone picking it at a company should learn the condition before building a workflow on
it, not after. `tests/wiring.test.mjs` now fails if the unqualified claim comes back.

Nothing in this kit is affected: no Remotion code is vendored, and `npm install` runs in the
generated project.

### Added — Remotion's own skills, and why they are not in the registry

The backend scaffolds a project and stops. Nothing here knows how to write *good* Remotion —
interpolation curves, audio trimming, composition structure — which is where an agent guesses
wrong most often. Remotion maintains 11 first-party skills for it; the generated README and
the console output now point at both official install commands.

They are **not** in `skills/registry.json` because `remotion-dev/skills` ships no licence file
(`license: null`, `"private": true`). The plugin mirror's `plugin.json` declares
`"license": "MIT"`, but a string in a manifest is not a licence grant over the files beside it.
The PR #15 rule stands. `docs/17` now names Remotion as the concrete thing that rule has
excluded, so the absence reads as a decision rather than an oversight.

### Added — captions the pipeline actually produces

Most short-form video is watched with the sound off. The kit wrote `script.txt` for CapCut to
auto-caption from — which means opening CapCut, the step this pipeline exists to avoid.

```bash
node scripts/video/render.mjs <script> --captions burn
```

`file` (default, writes `captions.ass` and changes nothing else) · `burn` · `off`. Styled from
the `theme` when one is set, with an **opaque box** rather than an outline: over stock footage
light text on a light frame disappears exactly where it matters.

**What the timing is, precisely.** Scene boundaries are exact — `render.mjs` built the audio
track. Within a scene, cues are apportioned by character count, which is an estimate. Error
accumulates inside a scene and resets to zero at every boundary; on 6–12 second scenes that
lands within a syllable or two. It is not forced alignment and does not claim to be. Captions
also stop when a scene's *narration* stops, not when its *picture* does, so nothing hangs over
the inter-scene silence or the outro hold.

`--captions bogus` now fails **before** step 1 rather than at step 8, where the typo would
already have cost a full TTS run.

16 tests in `tests/captions.test.mjs`, including the escaping that only breaks on Windows:
ffmpeg's filtergraph parser reads `:` as an option separator, so `C:\out\captions.ass` becomes
a filter option named `C`. Verified by burning with real libass and looking at the frames —
Vietnamese diacritics intact, themed and unthemed.

### Added — `theme-from-url.mjs`: read a brand palette off a live page

```bash
node scripts/video/theme-from-url.mjs --url https://your.site --name acme
node scripts/video/theme-probe.mjs --preview acme
```

Three shipped palettes, and the one that matters most — the user's own — was the one nobody
had memorised. Everything this needs already existed: `screenshot.mjs` captures the page,
ffmpeg reduces it to raw RGB, `theme.mjs` has the WCAG rules. No new dependency.

Writes `video-templates/themes.json`; `"theme": "acme"` then works exactly like a preset.
The file is not shipped — a palette read from someone's site describes *their* brand and
belongs in their repo, not in this one.

**Ink is the most prominent readable colour, not the most contrasting one.** Ranking by
contrast was the first version and it is unstable: the darkest thing on a page is often a
0.05% speck. Two runs of `nodejs.org` minutes apart gave `#3a7a31`, then `#64696b`; by share
both give `#417e38`. On `developer.mozilla.org` by-share gives `#222527` at 35% of the page —
the text — while by-contrast gives something covering 0.40%. Three consecutive runs now agree.

It reads the pixels that are there, so on an image-heavy page the dominant colour is the
image. It prints the palette and asks first, and **refuses rather than skipping the prompt**
when stdin is not a terminal.

Also deduplicated: `theme.mjs` kept its WCAG maths private and `validate.mjs` carried a second
copy. This would have been a third. The helpers are exported now and there is one
implementation.

`tests/palette.test.mjs` — 14 tests on in-memory pixel buffers. No browser, no network, no
ffmpeg, so CI never fails because someone else's website was having a bad day.

### Added — four templates, and a `launch` genre to use them

18 → 22 scene templates. Chosen against what the kit could not do rather than to round the
number up:

| | |
|---|---|
| `frame-kinetic-type` | One sentence arriving a word at a time. Every other template presented text as a block that faded or rose in one piece — which reads as a slide, not as motion. |
| `frame-product-reveal` | The beat where a thing is finally named. The kit had hook, body and outro but nothing for the moment the subject appears. |
| `frame-analog-grain` | Tape stock. Inline SVG grain, drifting scan lines, and a title drawn three times with the red and cyan copies offset — which is what chromatic aberration *is*, rather than a filter approximating it. No assets ship with it. |
| `frame-split-compare` | Two states of one thing, uncovered by a travelling divider. `clip-path` was used by **0 of 18** existing templates; `frame-chart-bars` compares magnitudes, which is a different claim. |

Both compositions of each are generated from one source, so the 16:9 and 9:16 layouts cannot
drift apart on slot names or behaviour — only the layout CSS differs.

New `launch` genre (problem → before/after → the name → what it does → one link), and
`testimonial` now reaches for `frame-split-compare` where its beat literally reads "the before
and after, measured".

Three things the tests could not have caught, found by rendering and looking:

- **`frame-split-compare`'s divider travelled against its own reveal** — the line came from
  the left while `clip-path` uncovered from the right. It read as two animations that happen
  to finish together.
- **The first frame showed the animation already finished.** `animation: … 0.45s forwards`
  does nothing during its delay, so the element rendered at its end state, then snapped back.
  Fixed with `both`; the rule is now written down in `CATALOG.md` under "Adding a template".
- **An eleven-character product name wrapped to two lines at 9:16**, so the shutter wiped two
  lines instead of one. Type size cut 132px → 104px and the real limit documented.

A test for the second one was written, run against all 24 folders, and **discarded**: parsing
CSS with a regex across two formatting conventions in this repo flagged `frame-creative-voltage`,
which is correct. A checker that fails correct code gets switched off rather than fixed.

### Added — scene transitions

Every video this kit had ever made joined its scenes with a hard cut. The SFX library shipped
`whoosh`, `swoosh` and `page-flip` tagged `transition`, and played them at exactly those cuts —
so every video carried a sound describing a movement the picture never made.

- `transition` on the script (`fade` · `swipe` · `slide` · `iris` · `pixelize` · `none`), and
  per scene to say how that scene **enters**. The default stays `none`, so nothing changes for
  an existing script until it asks.
- `transitionSec`, default `0.25s` — under the 0.3s of inter-scene silence the audio already
  leaves for it. The validator warns above that, where the blend would cover speech.
- `--no-transitions`, because a transition means the join has to be re-encoded rather than
  stream-copied: measured **0.1s → 2.0s** on a 27-second five-scene 540×960 render.

**The video's length does not change.** `xfade` overlaps its inputs, so a naive chain finishes
`(n−1) × T` short while the separately-built narration does not — every line after the first
would land early. `transitionPlan()` pads each clip by the transition that follows it, so
`sum(padded) − sum(T) === sum(base)`, and each scene's picture still starts on the frame its
narration starts on.

Found while building it, and only by running real ffmpeg: `fps` resets a stream's timebase, so
`settb=AVTB,fps=N` silently discards the `settb`. Pure-crossfade chains survive that; the first
`xfade` **after** a `none` joint does not, because ffmpeg's `concat` filter emits a different
timebase. `tests/transitions.test.mjs` locks in the order, the arithmetic, and the filtergraph
having no dangling pads — 21 tests, none of which need ffmpeg installed.

## [0.4.0] — 2026-08-03

Two threads. The first is a pre-release audit that found four things wrong with how this repo
presents itself — none of which broke a build. The second is what came out of reading
[facebook-skills](https://github.com/sergebulaev/facebook-skills): one real gap in the post
gate, and a skill the kit had been missing since the beginning.

### Highlights

| | |
|---|---|
| **The gate catches the model, not just Markdown** | `oaicite`, "As of my last update", an unfilled `[Your Name]`. Publishing one of those is worse than a stray `##`. |
| **`repurpose`** | One published item → several more, each from a *different angle the source already contains*. For one person that is 3 posts a week versus 12. |
| **`ads-report` without ad spend** | It used to stop when no ads server was connected, leaving everyone who has not started buying reach with nothing. |
| **Attribution that stands alone** | Two notices named the wrong owner by implication; the root NOTICE covered 14 of 20 folders, missing two vendored Apache-2.0 ones. |
| **Repo features as code** | Wiki off, recorded in `repo-about.json` rather than clicked once and forgotten. |

### What was deliberately not taken

facebook-skills calls the em dash "the biggest AI tell of 2026". This repo's own reference
article uses thirteen of them in ordinary Vietnamese prose and reads well. Adopting the rule
would have failed good writing, and a gate that cries wolf is a gate people switch off. Same
for the English vocabulary swaps. Both are one command away in the registry for anyone writing
English.


### Added

- **`skills/repurpose/` — one published item becomes several.** The kit was good at making
  things and had no answer for making more from what it already made. For one person that is
  the difference between three posts a week and twelve: not writing more, getting more out of
  what is written.

  The capability was already here — `examples/ai-video-social/` holds the same source as both
  an article and a video — but nothing connected "I made this once" to "make five more from
  it".

  An angle is **a different thing the source says**, not the same thing reworded; five
  rewordings is spam, five ideas from one piece of research is a week of content. The skill
  pulls them from the source (the counterintuitive bit, the number, the cost, the how, the
  disagreement, the aside) and refuses to pad to hit a count. It also refuses outright when
  the source is thin: five variants of something nobody engaged with is five times the work
  for the same silence.

  Used angles live in a new `brain/repurposed.json`, not in `history.json`. That file is a
  flat list of published titles — it dedups by identity and cannot say which angle you used —
  and its shape is load-bearing for `append.mjs` and every generated agent, so changing it
  would break running projects for a feature they may not use. An angle is recorded only
  **after** it publishes, so a rejected draft does not burn it.

### Changed

- **`ads-report` works without ad spend.** It used to stop when no ads MCP server was
  connected, which left everyone who has not started buying reach with nothing — despite
  having exactly the same question. Organic mode takes pasted platform numbers and reports the
  same way, while saying they are self-reported, leaning on shares and saves rather than
  views, and holding a higher bar before calling a trend on a small sample. The refusal to
  invent numbers is unchanged and now covers both modes.

- **Three facebook-skills in the registry**, fetched on demand like everything else there:
  `fb-humanizer` (the English style rules the forensic tier deliberately left out),
  `fb-hook-extractor` (dissects hooks from posts that actually performed, where VIDEO_GENRES
  only states principles), and `fb-repurposer`.

  Two of the eight upstream skills are deliberately **not** listed: `fb-audience-insights` and
  `fb-engagement-drafter` need a paid Apify token, and everything in this registry should run
  without a subscription. `docs/17` says so rather than letting someone find out after
  installing.

- **A forensic tier: the post gate now catches the model exposing itself.** `validate-post.mjs`
  checked *formatting* leakage — `##`, `**bold**`, a `Meta:` block. It never checked for the
  model leaking its own scaffolding: `oaicite` and other tool markers, "As of my last update",
  the assistant's reply wrapper ("Sure! Here's the post:"), or an unfilled `[Your Name]`.

  That is the worse failure. A stray `##` looks careless; "As of my last update" in a
  published caption announces that a machine wrote it and nobody read it back. All of it is
  language-agnostic, so it ships switched on.

  Placeholders warn rather than block: Vietnamese editorial prose uses square brackets
  legitimately — `[đã lược một đoạn]`, `[nguyên văn]` — so only bracket contents shaped like a
  form field are flagged.

  **Em dashes are deliberately not flagged.** The catalogue this is adapted from calls them
  the biggest AI tell of 2026, and for English social copy that may hold. This repo's own
  reference article uses thirteen in ordinary Vietnamese prose and reads well; adopting the
  rule would fail good writing, and a gate that cries wolf is a gate people switch off. The
  same goes for the English vocabulary swaps (leverage → use).

  Adapted from the forensic tier of facebook-skills (MIT © Sergey Bulaev) — credited in
  NOTICE.md. No code was copied; the patterns were rewritten against this kit's `findLeaks`
  contract, so `audit-quality.mjs` covers already-published items with no change at all.

### Changed

- **Repo features are settings-as-code too.** Wiki is off — an empty wiki tab is a dead end
  for anyone who clicks it, and everything it could hold already lives in `docs/`, where it is
  versioned, reviewed and searchable beside the code. Projects is off for the same reason.
  Issues and Discussions stay on: those are where people talk to you.

  `apply-about.mjs` manages them now rather than leaving it a manual click a fork or a reset
  would silently undo. It reads them through the REST endpoint, because `gh repo view --json`
  has no field for `has_wiki`, and writes with `-F` rather than `-f` — `-f has_wiki=false`
  sends the *string* "false", which the API reads as true.

- **The sample cover ships as JPEG again, 1.6 MB → 241 KB.** It was converted to PNG on
  request; the honest arithmetic did not support keeping it. The source was a JPEG, so the
  PNG was pixel-identical output at 6.7× the size — the compression damage is already in the
  pixels and re-encoding only freezes it into a bigger file. It was 42% of the whole repo for
  no gain, and now sits in the same weight class as the four contact sheets (82–254 KB).

  The rule the kit documents still stands and is unchanged: generate straight to PNG when an
  image has text in it. Converting *to* PNG afterwards is a different thing and buys nothing.

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

[Unreleased]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.2.0
[0.1.0]: https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.1.0
