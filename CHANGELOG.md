# Changelog

Notable changes, newest first. Dates are the merge date. Versions follow
[semantic versioning](https://semver.org/lang/vi/); while the major is `0`, a minor
bump is where a breaking change is allowed to appear.

A **breaking change** here means one of: a `script.json` that used to validate no
longer does, a template slot name changes, or an environment variable is renamed or
required where it was not before. Each one is called out explicitly below.

## [Unreleased]

**One breaking change**, called out here because it will reject scripts that used to
validate: `media.kind: "video"` is now an error on every template except `frame-broll`, and
more than one clip per scene is an error too. See below for the measurements behind it. Other
than that: nothing renamed, no new required environment variable.

### A clip only renders in `frame-broll` — measured, then enforced

hyperframes calls a composition's `seek()` **synchronously and never awaits it** (there is no
`await` before any `.seek(` in its bundle), so Chrome has not decoded the new frame when the
screenshot is taken. Whether that race is won depends on how much decode work the frame asks
for, and the results are not subtle:

| template | what it actually rendered |
|---|---|
| `frame-broll` — one full-frame clip in markup | plays correctly |
| `frame-vox-split-screen` — one clip behind a scrim | pane **blanks mid-scene** |
| `frame-vox-photo-grid` — four cell clips | **black, then frozen** |

- `validate.mjs` grew `VIDEO_SAFE_TEMPLATES` and `MAX_VIDEO_PER_SCENE`, both with the reason
  written next to them. The error names the fix rather than the rule.
- A clip landing in a still slot is not an error — `pexels.mjs` is video-only, so the
  resolver takes a frame out of it. Same asset, same credit line, no frozen cell.
- Pinning `id` instead of `query` lets a slot change `kind` without changing which clip it
  is, so `post.md` credits do not have to be rewritten.

### Nine more templates stopped being still frames

The ambient pass previously covered 14 templates. Nine more — the documentary/horror end of
the library — measured **zero** infinite loops in both aspects, which is the "bullet points
appear and then nothing" failure a reader notices immediately.

Each got its **own** motion signature rather than one shared effect: a scan bar for
`frame-document-redacted`, lamp flicker and dust for `frame-magnates-polaroid-desk`,
counter-running caustics for `frame-iceberg-levels`, `steps()` film grain for
`frame-timeline-war-era`, a rotating `conic-gradient` for `frame-pentagram-stat`, and so on.
Sharing one effect across nine templates would have cleared the test and produced nine
identical-looking frames, which loses the thing the pass was for. Periods are coprime (9s–24s)
so neighbouring scenes never resync.

### `brand-bar.mjs` — the channel mark, without covering anything

Reserves a strip along the top and puts a logo at one end and a wordmark at the other. It
**reserves** rather than overlays because every template in this kit already uses its top-left
corner for the kicker. The picture is scaled and matted, never squeezed. Runs once over the
concatenated video, so it cannot drift between scenes. Refuses to run twice against the same
file — stacking two strips looks deliberate enough that nobody notices until it is published.

### `motion-craft` now documents what the renderer can actually drive

The kit used CSS and nothing else, which is one seventh of what ships. hyperframes has seek
adapters for `css`, `waapi`, `gsap`, `animejs`, `lottie`, `three` and `typegpu`. The one that
matters most needs no library at all: **`waapi` seeks every animation in the document**, so
any `@keyframes` is already frame-accurate and the fade-up vocabulary was self-imposed. The
skill now covers `clip-path` reveals, SVG `stroke-dashoffset` draw-on, `mask-image` sweeps,
`background-clip: text`, 3D transforms and `steps()` — and states plainly that a raw
`requestAnimationFrame` loop does **not** survive a seek, because nothing shims the clock.

### `new-template` — a signature frame per episode, without landfill

A series that wants one bespoke frame per video is in tension with "never start from what
would be cool". The skill resolves it instead of suspending it: the gap has to belong to the
*episode* ("nothing can hold two numbers that mirror each other"), only one is built per
video, it is named for its job rather than its episode, and the pile is reviewed every ~10
episodes — reused frames graduate, single-use frames get deleted.

### Topic research — answering "what should today's video be about?"

The kit could always turn *a thing you already had* into a video. It had no answer for the
question people actually start the morning with. `crawl-and-queue` is the nearest thing and
answers a different one: it crawls a fixed `sources.yaml` on a schedule for an agent that
already knows its beat, and cannot take a topic somebody says out loud at 8am.

- `scripts/research/hot-sources.mjs` — Reddit, Hacker News, GitHub and Google News, all
  **keyless**. `GITHUB_TOKEN` is read if present but only raises a rate limit, never unlocks
  a source: a research layer needing five API keys is one most people never switch on.
- `scripts/research/topic-radar.mjs` — fetch → dedup → score → drop-what-was-already-used →
  write `brain/radar/<date>-<topic>.json` + a readable brief.
- `skills/topic-radar` and `skills/daily-topic-video` — the shortlist, and the whole
  radar → primary sources → `create-video` → review gate → publish chain in one ask.
- `docs/23-topic-research.md`.

`score = heat × freshness × crossSource`. Three things went wrong while building it, all of
them the kind that pass every test and still rank the wrong story first:

- **Heat had to be a percentile within its own source.** Ten thousand upvotes, ten thousand
  stars and ten thousand points are three different quantities, and normalising by the maximum
  lets one runaway post flatten everything beneath it to nearly zero.
- **It had to be measured BEFORE the merge.** Dedup first, and a story carried by Reddit and
  HN has one summed engagement and one arbitrary `source` — whichever part arrived first — so
  it gets ranked inside a group it never competed in, landing at the bottom of Reddit while
  sitting top of Hacker News. Each part is now scored in its own source and the story takes
  the best percentile it achieved anywhere.
- **Title matching could not be a prefix key.** "OpenAI launches a new coding model" and the
  same headline plus "today" reduce to a four-word and a five-word key and never meet — which
  is exactly the case the check existed for. It is Jaccard over the signal words now, at a
  threshold pinned by the pair that must *not* merge: "releases GPT model" vs "releases Sora
  model" sits at 0.6, so the cutoff is 0.7.

Two smaller notes: a source with no engagement numbers at all (an RSS wire) gets a **neutral**
heat rather than the floor, because *no signal* and *the weakest signal* are different claims;
and Reddit's JSON API now 403s unauthenticated clients, so the source falls back to its Atom
feed — posts but no vote counts — and **says so in the report**, because a ranking that quietly
got weaker is much harder to debug than one that explains itself.

The seen-ledger records what the radar **handed out**, not everything it found. Recording
everything would bury a story that ranked 40th on Monday and was shown to nobody.

### `geo` — a real place as B-roll, free and keyless

`scripts/video/geo-flythrough.mjs` builds a 9:16 hook by stitching raster map tiles at four
zoom levels falling from the whole world onto a set of coordinates, then optional street-level
imagery, each still given a Ken Burns push and cross-faded into the next. Registered as a
fifth media source, so a scene asks for it the way it asks for stock footage:

```json
"media": { "kind": "video", "source": "geo", "query": "Aokigahara, Japan" }
```

**Nothing here needs an account and nothing is billed.** Wide shots come from CARTO's
OpenStreetMap basemaps, close-ups from Esri World Imagery, with `osm` and `opentopo` also
available; geocoding is Nominatim. Street level is [Mapillary](https://www.mapillary.com/) —
crowd-sourced, CC BY-SA, free token — whose coverage is far thinner than Street View's, so no
coverage is the ordinary case rather than an error.

No API renders a video flythrough, and there is no free static-map API worth depending on.
Tiles are the raw material every web map is made of, the projection maths is public, and
stitching them is a dozen requests and an ffmpeg filtergraph. About 54 requests per clip, with
an 80ms pause between them — these are donated and free-tier servers, not a CDN to hammer —
and built clips are cached by request hash so a re-render fetches nothing.

**The one thing a tile does not bring with it is its credit.** A Google static image arrives
with the attribution already burned in; a raster tile does not, and attribution is a licence
condition of every source here. So the script draws it onto every still itself, writes
`<clip>.credits.txt` beside the output, and the `geo` source copies that into
`media-lock.json` — which `docs/15` already calls the credits ledger. If no usable font can be
found it refuses to pretend otherwise: it says so loudly and prints the exact string that must
appear on screen instead. See `NOTICE.md` §2d for the per-source terms.

`scripts/video/lib/tiles.mjs` holds the projection and the source registry, separately from
the CLI, because it is the part that is wrong invisibly — a map centred one tile off still
looks exactly like a map, and satellite imagery of the wrong suburb looks exactly like
satellite imagery. `tests/tiles.test.mjs` checks it against hand-computable slippy-map cases
rather than against its own output, including the two that bite: **Esri's tile path is
`z/y/x` while every other source is `z/x/y`** (swap them and you get a valid tile of somewhere
else entirely), and latitude is Mercator, not linear — pinned to the analytic ratio 1.39749,
where a linear stand-in gives exactly 1.

### A music bed that stays under the voice

`script.json` takes a `music` block — a query searched on Openverse, or a file you supply.
Openverse needs **no key** (anonymous quota 20/min, 200/day) and every request is filtered to
`license_type=commercial,modification`: the licences that clear a monetised, edited video.
CC0 is the default because it carries no obligation; CC-BY is allowed and then the render
**prints the attribution and writes it to `media-lock.json`**, which is where the licence,
creator and source URL live from then on.

Two mechanisms keep it under the narration, because one is not enough. `volume=<gainDb>` sets
where it sits in the gaps — and **a non-negative gain is an error, not a preference**, caught
by `validate.mjs` in the step that costs seconds rather than after a full render with
headphones on. Then `sidechaincompress` keyed on the voice pulls it further down under every
spoken word and lets it back up between them; a fixed level quiet enough never to mask a soft
consonant is quiet enough to be inaudible everywhere else. Measured on a real render: voice
alone **-18.8 LUFS**, voice + bed **-19.1 LUFS** — the bed adds no perceived loudness.

Two things worth knowing before relying on it. Openverse answers **401** — not 429 — when you
exceed the anonymous burst, which reads as a credential error for an API that takes no
credentials; the message now says so and names the real quota. And **CC0 means "not
copyright-encumbered", not "will not be Content-ID claimed"** — widely-used CC0 audio gets
registered by distributors with no right to it. The claim is disputable because the licence is
in the lock file, but it can still happen.

### `zoom` — a transition for the beat where something is FOUND

`TRANSITIONS` gains `zoom` (ffmpeg's `zoomin`), for the join after a radar lock or a map
arriving on its target, where a fade says "and then" but the picture should say "there".

Adding it surfaced a **latent bug in `geo-flythrough.mjs`**: it passed `TRANSITIONS.fade` where
`concatWithTransitions` wants the kit's own name and does the lookup itself. That worked only
because `fade` maps to the identical ffmpeg name — `TRANSITIONS.iris` would have looked up
`TRANSITIONS["circleopen"]` and thrown. Now passes `"fade"`.

### `frame-vox-split-screen` can hold real footage

Its pane was already labelled "Document scan", and the kit had run out of places to put moving
footage: only six templates draw media and `maxSameTemplate: 2` capped a script at five media
scenes. The pane now takes a clip — cream paper and dark text without one, a dark panel with
the footage behind a fixed scrim and light text with one, because this pipeline picks clips
nobody has previewed.

Its `seek` was a no-op, so any clip would have rendered as a single frozen frame. Fixed.

### Multi-media: a scene can show four pictures, not one

`scene.media` now accepts an **array**. `resolveSceneMediaList()` resolves each entry to
`assets/media-1.*` … `media-4.*`, and **still writes the first to `assets/media.*`** so every
template built before this keeps working untouched — a silently blank frame is the failure
mode that change would otherwise have, and it would not have been an error.

The lock key carries the slot (`"grid#2"`) so the existing `sameRequest` reuse logic works
per picture, unchanged; a single-object `media` keeps its bare scene id, so lock files written
before this still hit. Validation runs **every** entry through the same rules — the array form
must not become a way around the `rights` or `fit` gates — and an array on a template that
draws only the first picture is an error, not a warning, because that renders happily while
dropping three of your four images.

`media_kinds` is passed to the template because a grid routinely mixes a satellite **clip**
with three **stills**. Detecting it by loading an `<img>` and falling back to `<video>` on
error would swap the element mid-render, and hyperframes seeks frame by frame — the swapped
frame would come out blank.

### `frame-vox-photo-grid` — the frame that needed it

The 106th template, and the only one that draws more than the first picture: a 2×2 grid, a
caption per cell, headline and takeaway. A cell with no picture is **removed**, not left
empty — three pictures should read as three, not as three and a hole.

### The ambient layer: nine frames that were going dead

Measured, not guessed. Nine of the templates this kit reaches for finished their entrance at
~2s and then rendered an **identical frame** for the remaining 4–8 seconds of the scene.
`frame-geo-pin-detail` was the extreme: 190 lines of CSS and exactly two animations.

The three templates people call good — `frame-analog-grain`, `frame-geo-sonar-radar`,
`frame-bold-poster` — all ran continuous loops and none of them said so. So `motion-craft` was
not wrong, it was **half-written**: it documented the content layer ("everything settled by
~2.0s") and never named the ambient one. That omission is what produced the dead frames.

Both layers are now written down, and `#root::after` gives the nine an ambient layer with its
own character each — a scanner bar down a document, paper grain under newsprint, light leaning
between two compared sides. Periods 6–19s, opacity delta ≤0.15, scale delta ≤0.04, never on
text.

`tests/motion.test.mjs` holds the set, checks **both aspects**, and prints how much of the
library is still dead (30 of 106 have a layer) rather than letting the gap sit unstated. It
caught a real bug on its first run: **`frame-bold-poster` floated four shapes in 9:16 and had
nothing at all in 16:9** — half its renders were a still image, and had been for releases.

### Fixed

- `scripts/media/lib/normalize.mjs` — `normalizeImage()` takes **one frame**. A stock "image"
  routinely arrives as a clip (Pexels' catalogue is video) and an animated meme is a GIF; both
  made the image2 muxer fail with *"Cannot write more than one file with the same name"*,
  which reads as a broken path rather than "you handed me a movie".
- `tests/templates.test.mjs` — the media-template checks matched only `assets/media.`, so a
  template building `"assets/media-" + i + ".png"` was **silently exempt** from both the
  catalogue-still and the stand-in check. Widened to `media[.-]` and any `<var>.src`.
- `frame-logo-outro` accepts a **brand mark** via the scene's media block; the built-in SVG
  glyph stays as the stand-in, so a channel that passes no logo still gets a mark.

### `meme` — a change of energy, in its own colours

`scripts/media/lib/sources/meme.mjs` renders through memegen.link (free, keyless, MIT, ~400
templates) and a new **`frame-meme`** template displays it — the 105th, and the only one that
**never tints its media**. `frame-media-inset` tints media into the palette on purpose; a meme
recoloured to match a dark brand palette is no longer the meme, because its colour is part of
how the joke lands. The frame is themed, the image is not, and `tests/meme-social.test.mjs`
asserts no filter creeps onto `.meme` later.

```json
"media": { "kind": "image", "source": "meme", "id": "drake|Viết tay|Dùng agent", "fit": "contain" }
```

Three things here were found by rendering and looking, not by reading documentation:

- **The font had to be `notosans`, not memegen's own `impact`.** Impact has no Vietnamese
  diacritics: "Viết script bằng tay" renders as "VI T SCRIPT BẰNG TAY" and "Để agent viết bước
  đầu" as "Đ AGENT VI T B C Đ U". The glyphs are dropped silently, the API still returns 200,
  and nothing downstream can tell.
- **`fit: "contain"` is now required and enforced.** `fit` defaults to `cover`, which crops
  the image to fill the frame and takes the punchline with it — in `normalizeImage`, before
  the template sees the file, after which the render succeeds with a full frame.
- **Meme lines have to fit ONE rendered line.** memegen sizes text to a single line inside the
  template's text box and clips the overflow off the image. The limit is per-template, not
  global: `drake` (two half-width panels) wraps at about 15 Vietnamese characters while
  `afraid` (full-width) takes 23. So `meme-search.mjs --render` writes a PNG to open, and the
  catalogue says to measure rather than estimate.

Text goes to memegen by **POST**, not built into the URL path. Its path encoding (`_` space,
`__` underscore, `--` dash, `~q` `~s` `~a` `~p` `~h`, `''`) is a minefield for Vietnamese
punctuation; POST takes a plain array and escapes server-side.

### `social` — Douyin / TikTok / Bilibili / Kuaishou, with the paperwork attached

`scripts/media/lib/sources/social.mjs` resolves one post you name, and `social-fetch.mjs`
fetches it from the command line. **The kit ships no downloader and vendors nothing** — it is
a thin client for a self-hosted `Douyin_TikTok_Download_API` (Apache-2.0) reached via
`SOCIAL_API_BASE`, the same arrangement as the servers in `.mcp.json`. Cookies stay in that
service's own config.

The clip is somebody else's work, and removing a watermark does not remove a copyright. The
kit does not make that judgement — it refuses to let it go unrecorded. A scene using this
source must declare `rights` (`own` · `licensed` · `permitted` · `public-domain`); the two
that claim someone else's permission must name it in `rights_note`; `validate-script.mjs`
fails the script otherwise, in seconds rather than after a 3–5 minute render; and the
declaration lands in `media-lock.json` beside the original URL and author — the file `docs/15`
already calls the credits ledger.

There is deliberately **no `unknown` and no `fair-use`**, and a test asserts they never
appear: a value meaning "I did not check" turns the whole field into decoration.

`social-fetch.mjs --analyze` is the mode with no legal question attached — it downloads a post
so you can study its hook and cut rhythm, then you write your own and shoot or licence the
footage. It pairs with `topic-radar` and the `fb-hook-extractor` registry skill.

### Fixed

- `scripts/media/lib/resolve.mjs` — a `url` on a non-screenshot scene now resolves through the
  source instead of falling through to *"media needs one of id / ref / query / url"*, which is
  a confusing thing to be told when you passed a url.
- `scripts/media/lib/resolve.mjs` — `kind` is passed to a source's `byId`/`search`, because a
  source can need it to pick a FORMAT: an animated meme must arrive as a `.gif` for
  `kind:"video"` and a `.png` for `kind:"image"`. Sources that do not care ignore it.
- `scripts/media/lib/normalize.mjs` — `download()` now copies a **local path or `file://` URL**
  instead of handing it to `fetch`, which refuses both. `manual`'s header has promised this
  since it was written ("paste its direct URL (or a local path) here"); it failed with "Failed
  to parse URL", which reads like a broken entry rather than an unimplemented case.

## [0.5.0] — 2026-08-10

Eighteen pull requests since v0.4.0. **No breaking change** — nothing that validated before
stops validating, no slot renamed, no environment variable added to the required list.

The visible half is that the video side grew up: eighteen templates became forty, and they
stopped being a pile. An **industry layer** now answers the question that comes before "which
template" — what does someone in this trade write, what counts as evidence there, and what is
illegal to say. The pipeline makes its own **captions** and **transitions**, reads a **palette
off a live page**, and watches the upstream registry daily so a stale number is a pull request
rather than a discovery.

The other half is less flattering and worth stating plainly, because it is the same fault four
times. Every one of these shipped green: three templates that rendered as a blank box, four
tiles in the catalogue image emptied by the very code written to keep them full, two frames
that turn a missing clip into a black rectangle, and an English README five features and 22
templates behind the Vietnamese one. **A passing test suite says the code did what the tests
ask. It says nothing about whether anyone looked.** Rendering a picture and opening it found
what 227 tests did not, four separate times, and most of the guards added this cycle exist to
turn "someone should have looked" into "CI looked".

### Highlights

| | |
|---|---|
| **Forty templates, grouped by what they do** | Four 3D frames, four data frames, maps, and a catalogue image ordered by the job a frame does rather than the batch it arrived in. |
| **An industry layer** | `INDUSTRIES.template.json` — 16 industries, each carrying **both halves**: what to write and what counts as evidence there, then the genre, frames and palette. The three regulated ones (healthcare, finance, real estate) carry a `legal` block **with links to the source**, and a test requires the link. |
| **GEO, both of them** | The `local` genre, where the story is *where*, and `geo-audit.mjs`, which grades whether a post still means anything once an answer engine quotes one paragraph of it. Kept in one place so nobody does the wrong one. |
| **Captions and transitions, made here** | `--captions burn`, and `fade · swipe · slide · iris · pixelize` with the arithmetic that keeps the video's length exact. |
| **A palette read off a live page** | `theme-from-url.mjs` takes background, ink and accent from a real site, under the contrast rule the validator already enforces. |
| **A robot on the upstream registry** | `registry-watch.mjs` runs daily, diffs a committed snapshot, opens exactly one PR when upstream moves — it reports, it does not add. |

### Fixed — two frames that turn missing footage into a black rectangle

`frame-media-inset` has drawn a hatched panel behind its media since PR #49, so a scene with no
clip reads as *missing input* rather than as a broken renderer. `frame-broll` and
`frame-screenshot` never got one. A render that forgot its media gave a black frame and a set
of dead browser chrome respectively — output nobody would think to file against a template.

PR #52 made this harder to notice, not easier: the catalogue image now hands all four a
committed still, so the picture everyone looks at can no longer show the fault. Both now carry
the same shapes-only stand-in, and a test reads each composition and requires one behind
anything that draws `assets/media.*` — with the marker as an **attribute**, `data-media-fallback`,
because the two that already had one had named them differently (`.ph` and `.skeleton`) and no
test survives a list of class names that grows whenever someone picks a third.

Rendering them with no `assets/` directory turned up a second thing, and corrected a claim
written in two templates' comments: **an empty `alt` does not suppress Chrome's own 16px
broken-image mark** on an image that has layout dimensions. It suppresses alt *text*. That mark
was sitting in the corner of `frame-3d-device`'s skeleton the whole time — small, but the exact
kind of thing a placeholder exists to avoid. All four now hide a failed image outright.

### Fixed — an English README five features and 22 templates behind

`README.en.md` said **"18 templates, 5 genres"** while 40 templates and 7 genres shipped, never
mentioned `theme-from-url.mjs`, `registry-watch.mjs` or the whole industry pack, and carried
five of the ten rows its Vietnamese counterpart has. English is the version most visitors to
this repo read first.

Two structural reasons, both now closed:

- The count guard listed **three** sentences from `README.md` and **one** from `README.en.md`.
  The English twin of the "40 templates, 7 genres" row was not among them, so it sat at 18
  through 22 new templates while its counterpart was corrected each time. Every sentence
  carrying that number now has its own entry, and the genre half of it is checked too.
- Several guards **concatenate both READMEs** before searching, so "documented" quietly meant
  "documented in at least one language". A new test compares the *tool names* each README
  mentions — CLIs and fill-in templates, not prose, since two languages will never match
  sentence for sentence and a test demanding that would be deleted within the month.

### Fixed — four holes in the catalogue image, made by the code that existed to prevent them

`frame-broll`, `frame-media-inset`, `frame-screenshot` and `frame-3d-device` all rendered in
the README's catalogue image as text over a flat block. They are the four frames that draw
media you supply, so they had nothing to draw.

`template-sheet.mjs` knew about the problem and made it worse. It FABRICATED a still with
`ffmpeg -f lavfi gradients=…` — a dark navy wash — on the reasoning that a gradient "says the
frame works without pretending to be someone's B-roll". At 126 px a flat wash is
indistinguishable from an empty box, so it did not prevent the broken-tile reading; it
produced it. Worse, it painted over the one real placeholder in the set: `frame-media-inset`
draws a hatched panel with a picture icon behind its media, added specifically so a missing
clip reads as deliberate, and nobody could see it.

`frame-3d-device` was not in the list at all. It reads `assets/media.png` exactly as
`frame-screenshot` does, arrived later, and nothing tied the list to the templates — so it
showed its dark CSS skeleton, and had done since it shipped.

The gradient is gone. Two committed stills stand in instead, both borrowed rather than
invented: `examples/gallery/media-still.jpg` is one frame of the same Pexels clip the sample
video uses for `body-11` — the reader meets the same footage in `contact-sheet.jpg` — and
`screenshot-still.jpg` captures `github.com/XuHo-IT/RAG-EVAL-VN`, the page
`frame-screenshot`'s own `url` slot already names, so the URL bar and the screen finally
agree. Both are committed, so `--preset all` still builds with the network unplugged.
Attribution for the Pexels frame is in `NOTICE.md` §2c: the licence does not require it, but a
committed frame of someone's work should be traceable without opening a lock file.

Two traps worth writing down. `compose.mjs` names the asset off the extension — `.png`, or
`.mp4` for anything else — so a `.jpg` lands as `assets/media.mp4` and every one of these
templates draws nothing at all, with no error; the stills are converted to PNG in the scratch
dir rather than teaching `compose.mjs` a third case. And the stills are 3:4 and 4:3, never
9:16: `tests/wiring.test.mjs` rejects anything in `examples/gallery/` more than 1.5× taller
than wide, and `object-fit: cover` makes the aspect a non-issue anyway.

A test now fails any template that reads `assets/media.` without a still, any still named for
a template that no longer draws media, and any still named but not committed. Verified by
removing `frame-3d-device` from the table and watching it go red.

### Changed — the sample video's contact sheet is no longer inlined in the top READMEs

Both READMEs opened with a full 15-scene contact sheet before the reader had a reason to care
about any one of them. The table directly above it already links to the sample, and the
sample's own README still shows the sheet — where someone who opened it is looking for
exactly that. No image was deleted.

### Added — GEO, both of them

Two unrelated things are called GEO, and doing the wrong one costs an afternoon. The kit had
neither. It now has both, in one place, labelled.

**Generative Engine Optimization** — writing so ChatGPT, Perplexity, AI Overviews or Claude
can lift a passage out of your page and cite it. That is not SEO: SEO gets a human to click a
ranked link, GEO gets a machine to quote a paragraph, and the reader may never arrive. So the
unit of success changes from *a page that ranks* to **a passage that still means something
once it is cut out of its page** — which is why this shipped as a checker and not as advice.

`scripts/geo-audit.mjs` grades a draft against seven rules, no key and no network:
`answer-first`, `self-contained` and `sourced-numbers` are **must**; `question-headings`,
`definition`, `dated` and `table` are **should**. It exits 1 on a failing must, so it works as
a gate beside `validate-post`. `--place "Đà Nẵng"` turns on one more must — the locality has
to appear in the title or the first paragraph — which is where the two GEOs meet.

Deliberately not a score out of 100: a number invites tuning the number, and the list of
failing passages is the thing you act on.

**Geography** — the `local` genre in `VIDEO_GENRES.template.json`, opening on the map rather
than a title card. `validate.mjs` now accepts `frame-geo-markers` as a hook template for that
reason: a place-led video that opens on a logo has spent its hook on the one thing the viewer
already knows.

`examples/ai-video-social/sample-geo/` carries both halves — a `local` script with its frame
strip (no narration rendered), and `post-draft.md` → `geo-report.md` → `post-fixed.md`, which
is the audit finding eight faults in a draft that reads perfectly well and the same piece
rewritten until it passes.

Three defects the sample found, all in the tool rather than in the sample:

- **`\b` does not work on Vietnamese.** JavaScript's word boundary is defined on `[A-Za-z0-9_]`,
  so in "nó" the final "ó" is not a word character and `/^nó\b/` never matches. Three rules —
  `self-contained`, `sourced-numbers`, `definition` — were silently passing everything written
  with diacritics, which is most of what this kit writes. Every boundary is now a Unicode
  lookaround.
- **"Chúng tôi" was read as a dangling pronoun.** "chúng" is one; "chúng tôi" is a subject.
  Uncorrected, the rule fired on the opening line of most Vietnamese posts, which is how a
  rule gets ignored.
- **A correctly sourced post still failed.** "theo log điều phối nội bộ" and "theo bảng chi
  phí" are how an operations number gets cited in Vietnamese, and the first version accepted
  neither — it wanted a capitalised name or one of six research words. Separately, `31/05/2026`
  was reported as an unsourced `31`. A date is not a claim.

Skill: `skills/geo-optimize`. Both READMEs, `docs/21-video-genres.md` and the meta-skill now
name it. The English README's skills row also said 11 skills and 13 external; the real numbers
were 13 and 15 before this change and are 14 and 15 after.

### Added — depth, and the measurement that contradicted the plan

36 → 40. `frame-3d-device` (a capture tilted in space), `frame-3d-flip` (a card that turns to
its answer), `frame-3d-stack` (layers receding), `frame-3d-spotlight` (a light swings across
and the words are there when it passes).

Thirty-six templates and not one used `transform-style: preserve-3d`. The whole 3D transform
family was untouched, and it costs nothing to reach: HyperFrames renders through headless
Chrome, so it already works. This is **2.5D** — perspective on flat layers, not a scene with
lights and meshes — and that is the honest description. Real 3D stays on the `remotion`
backend, which already exists and already has `--template=three`. Vendoring three.js into the
HTML path would buy geometry this kit has no use for and lose the property it does have: it
draws with the network unplugged.

`frame-3d-spotlight` was written after reading how vibe-motion's `light-spotlight-render`
describes its effect — the one item in that 3D set that is HTML rather than three.js or a
Remotion component. No code was taken: that repository publishes no licence.

**The plan said to measure the render cost, expecting 3D to be the expensive part. It is
not.** The four render in 10.0–11.6 s; the slowest render in the comparison is a flat
template at 16.9 s. Both are dominated by the ~10 s of npx and Chrome startup that every
render pays. The real cost is bytes, and that is not about 3D either: a full-frame gradient in
permanent motion gives the encoder nothing to reuse, so `frame-3d-spotlight` is 2–3× the size
of its neighbours. The table is in `CATALOG.md`.

Two things found by rendering and looking, neither of which any test would have caught:

- **Stack labels read as text sliced in half.** They were already anchored to the bottom of
  their cards, which is where the visible strip is — but perspective shrinks each card toward
  the centre of the scene and *the shrink compounds down the pile*, so a strip that measures
  96px in the flat layout is not 96px once projected. By the fourth card it had closed up
  under its own label. The Z step dropped 70px → 46px, and the Y step is now measured from the
  card's own height at render time instead of typed as a constant — one constant was always
  going to be wrong for one aspect, since the card is 136px tall in portrait and 118 in
  landscape.
- **`frame-3d-spotlight` shipped with an empty `kicker`.** Not a blank template — it had a
  headline and a caption — but a slot whose default demonstrated nothing.

### Fixed — a gallery that became a wall, and a cost table measured on empty frames

The catalogue picture was rebuilt with the command as written in both READMEs and came out
**960×4520**: forty 9:16 tiles at the tool's own defaults, stacked into a column GitHub makes
you scroll past. `tests/wiring.test.mjs` bounds that ratio at 1.5 and would have failed CI at
4.71. The command in the READMEs never reproduced the committed image in the first place — it
is now `--per-row 10 --width 126`, which puts forty tiles in the same four rows and the same
1260px width the picture has always had, at 112 KB.

The first version of `CATALOG.md`'s render-cost table read 17–38 KB per clip and claimed
`frame-3d-spotlight` was 25–55× the size of everything else. Those renders were made with
`inputs: {}`, which produces **blank frames** — a template's `data-composition-variables` are
editor defaults and do not reach the renderer on their own, a trap already documented at the
top of `template-sheet.mjs`. An empty 1080×1920 video compresses to almost nothing, so the
table was comparing degrees of emptiness. Re-measured with each template's real defaults, the
ratio is 2–3×, and the conclusion it had been supporting was not the true one.

### Fixed — three templates that rendered as a blank box

`frame-broll`, `frame-media-inset` and `frame-screenshot` shipped with **every text slot
empty** — `""` for all of them. They drew nothing in the catalogue image, nothing in the
HyperFrames editor, and nothing for anyone who opened one to find out what it does, which is
the one job a default value has.

Nothing caught it. The compositions parse, the slots match across aspects, no default names
someone else's brand, and no rule said a default had to *say* anything. It was found by
looking at the catalogue image and noticing three holes in it.

They now carry real content, drawn from the kit's own RAG sample so a reader recognises it —
and so nothing here is a placeholder pretending to be content. `media_kind` also moved from
`video` to `image`: a still handed to a template expecting a clip draws nothing at all, with
no error, which is a second way these three could come out blank.

A test now fails any template whose slots are all empty. Verified by emptying one again.


### Added — the last three the backlog could name

33 → 36. `frame-funnel` (marketing), `frame-progress` (games, and every roadmap), `frame-draw-on`
(education). That empties the buildable half of the queue the industry layer produced.

Each enforces the same rule the data frames do — **the picture is computed from the number**:

- **Funnel widths come from the value**, not from position in the list. A funnel drawn as
  evenly narrowing trapezoids is a decoration with numbers on it, and it lies whenever the real
  drop is uneven. Conversion rates are computed, never typed, and the **steepest** drop is
  marked because that is the stage anyone reading a funnel is looking for.
- **Progress milestones sit at their own proportion**: one at 80% is drawn at 80%, not at "the
  fourth of five". Over 100% draws a full bar and still prints the true figure — a campaign at
  143% should look finished and say 143, not look broken.

Two found by rendering and looking:

- **`frame-draw-on` drew every stroke as fragments.** `getTotalLength()` returns *user* units
  while `vector-effect: non-scaling-stroke` makes the browser read `stroke-dasharray` in
  *screen* pixels — the two disagree by the viewBox scale, so the dash repeated seven times.
  The circulating advice for this effect is "SVG + GSAP"; it is `stroke-dashoffset` in plain
  CSS, once the coordinate spaces agree.
- **Funnel labels straddled their bar's edge** at the narrow stages — half on purple, half on
  black. They sit above the bar now, and the bar is pure geometry.

### What is left, and why some of it should not be a template

The queue is down to four, and the honest note now says so:

| | |
|---|---|
| floor plan · anatomy | need the geometry of *each* building or body part, not one frame. Drawing them wrong is worse than not drawing them. |
| evidence board | close enough to `frame-node-graph` that it should be tried there first |
| 360° product spin | needs real footage — `media` + Pexels, not a template |

### Added — maps, and the counting mistake that hid them

31 → 33. `frame-geo-markers` (places from coordinates) and `frame-geo-route` (stops in order,
arcs drawn between them).

**Maps were the largest remaining gap and the backlog could not see it.** Six verticals asked
for one under six different names — *bản đồ có điểm đánh dấu*, *bản đồ hành trình có cung nối*,
*bản đồ theo giai đoạn*, *bản đồ tuyến giao*, *bản đồ sự kiện*, *bản đồ nhiệt / bản đồ vùng* —
so counting the list by string produced "1 each" and maps sank to the bottom of the queue.
`_missing` now names one family once, so it can be counted.

The coastlines are committed, not fetched:

```
Natural Earth 1:110m Admin 0   PUBLIC DOMAIN
  → topojson/world-atlas       ISC
  → scripts/video/build-map-path.mjs   →  world-path.json, 125 rings, ~59 KB
```

**Nothing is fetched at render time.** The upstream HyperFrames `world-map` block pulls d3,
topojson-client, gsap *and* the atlas from a CDN on every render — which turns "offline means
missing fonts" into "offline means a blank map". TopoJSON is decoded by hand in about forty
lines rather than by adding a dependency; the trap there is that a **negative arc index means
that arc reversed**, encoded as `~i`, and getting it wrong produces coastlines that double back
on themselves.

Two things found by rendering and looking:

- **The auto-fit floored both axes independently** at 60×30 units and then multiplied. One unit
  is 0.36°, so a 60-unit floor is 21° before padding — three Vietnamese cities came out as a
  map of Indonesia. Now each axis fits the data and only the short one is widened to the
  frame's aspect.
- **The title was sitting on top of a marker.** Markers now sit at 62% down rather than centred.

### Added — `motion-craft`

Every animation bug this repo has shipped passed the full test suite. Geometry is checkable;
motion is not. So the vocabulary is written down: three easing curves and when each is right,
duration and stagger ranges tied to the narration, what not to animate — and **the four traps
that have actually caught us**, each with the frame it caught.

They were scattered as notes across `CATALOG.md` and `new-template`. `new-template` now points
here rather than restating two of them.

### Added — four data frames, chosen by the industry layer rather than guessed

27 → 31. These are not four templates someone thought would be nice: they are the four
families that `INDUSTRIES.template.json` counted as missing across the most verticals, one
PR after it started counting.

| | asked for by | |
|---|---|---|
| `frame-node-graph` | **4 verticals** — logistics, tech, legal, marketing | boxes and the connections between them |
| `frame-trend-line` | finance, environment | one value moving over time |
| `frame-dashboard` | finance, corporate | several numbers at once, each with its direction |
| `frame-hud` | games, tech | instrument chrome around one reading |

**No coordinates are typed in the node graph.** Depth comes from a breadth-first search out
of whatever has no incoming edge, nodes spread evenly within their depth, and the wires are
drawn from the real laid-out positions. Branching and converging both work — verified on a
supply chain that forks to two warehouses and rejoins at the customer. A cycle would loop the
search forever, so anything still unplaced is parked in a final layer: a graph that disagrees
with itself still draws.

**`frame-trend-line` starts its Y axis at zero, and that is the point.** The industry layer
lists *"a chart with the Y axis cut so the rise looks steeper than it is"* under what a
finance post must avoid — so the template enforces it rather than leaving it as advice a
caller can ignore. `baseline: "auto"` opts into a zoomed axis **and makes the frame print
that it did**; a zoomed axis is a legitimate choice and an invisible one is not.

`frame-dashboard` takes the delta's colour from its **sign**, so a caller cannot accidentally
paint a fall green.

Found by rendering and looking: the HUD's radar sweep was a 150% wedge anchored at the frame
centre, so it clipped at the edges into corner shards that read as a rendering fault rather
than as a sweep. Now square, centred, and sized past the diagonal.

**The backlog cannot lie about itself.** `tests/industries.test.mjs` asserts that everything
in a vertical's `missing` list genuinely does not exist — so building these four *forced* 12
entries out of the wish lists and into real `frames` arrays. What remains is maps, draw-on,
funnel, floor plans, anatomy, an evidence board and a progress bar.

### Added — an industry layer, covering the article as well as the video

A list of roughly 70 "industry video templates" circulates online: Property Tour, Historical
Timeline, Case Timeline, Stock Dashboard, Git Commit Timeline, and so on. Mapped against this
kit, **most of them are the same frame wearing different industry clothing** — seven of those
names are `frame-timeline`.

What actually differs between a legal video and a fintech one is not the geometry. It is what
counts as proof, what you are not allowed to claim, and which beat opens the piece. So
`templates/INDUSTRIES.template.json` is a **selection layer over 27 frames, not 70 templates**.

16 verticals, each carrying **both halves**:

```json
"tai-chinh": {
  "post":  { "types": [...], "proof": "…", "avoid": [...], "legal": [{ "rule": "…", "source": "https://…" }] },
  "video": { "genre": "news", "frames": [...], "missing": [...] },
  "theme": "corporate",
  "backend": "html"
}
```

**Two kinds of entry, and they are not the same kind of claim.** `legal` is a rule from
Vietnamese law with a source link — none written from memory. `avoid` is craft judgement and
does not pretend otherwise. A test enforces the line: a sentence in `avoid` phrased as law
(*cấm*, *nghị định*, *xử phạt*…) with no source **fails the build**.

The three regulated verticals were researched against primary sources:

| | |
|---|---|
| **Y tế** | Functional food may not be advertised as medicine and must carry the statutory disclaimer; **doctors, pharmacists and medical staff may not appear in food advertising** at all; clinical advertising must match the facility's licence. |
| **Tài chính** | Financial advertising may not promise specific returns. Publishing advertising-characteristic information that affects investor rights is fined up to **600 million VND**. |
| **Bất động sản** | No advertising, deposits or capital-raising for a project that does not yet meet its legal conditions — Decree 16/2025/NĐ-CP adds suspension of 3–6 months. |

Each entry also lists what that vertical **wants and this kit cannot draw yet**. Collected,
the whole 70-name list collapses to **six missing frame families**: maps with markers, node
graphs, a value over time, a HUD, a multi-cell dashboard, and draw-on. Six, not seventy — and
that list is now the build queue rather than a guess.

Two palettes named in the request: **`corporate`** (white, navy, a deliberately narrow band so
no colour argues with the number beside it) and **`luxury`** (warm near-black, cream, brass at
38° — open the band and the warm end drifts orange, which reads as a sale rather than as
expensive). Both clear the 4.5:1 floor `validate-script.mjs` enforces, at 15.3:1 and 14.9:1,
and a test checks that so a preset the validator would reject cannot ship.

### Changed — one catalogue image instead of three archaeological layers

The README carried three gallery strips ordered by **when each batch was added** — "the five
newest", "the four before that", "and four before those". Someone choosing a frame does not
care which release it arrived in.

Now one image of all 27, grouped by **what each frame does**: hooks and statements, data and
evidence, people and sequence, contrast and reveal and close. Every tile carries its own
template id, so the picture is enough to choose from.

`scripts/video/template-sheet.mjs` gained three things to make that possible:

- **`--preset all`**, derived from `listTemplateIds()` rather than listed, so a new template
  appears the moment it exists
- **each template's own declared defaults** when no inputs are supplied. This matters more
  than it sounds: `composeTemplate({ inputs: {} })` renders a **blank frame** —
  `data-composition-variables` is the editor's preview state and never reaches the renderer.
  Confirmed against `frame-review-verdict`, which predates all of this, so it is long-standing
  behaviour rather than a new bug. Without the fallback the catalogue would have been 27 empty
  tiles.
- **`--script <file>`** — the scenes of a `script.json`, in order, with that script's own
  inputs and labelled by scene id. **This is how a sample gets a picture without spending a
  single TTS character.**

Footage-led frames (`frame-broll`, `frame-media-inset`, `frame-screenshot`) get a plain
gradient rather than rendering as an empty box, which in a catalogue reads as a broken tile.
They need `media_kind: "image"` alongside it — the same note `render.mjs` already carries: a
still handed to a template expecting a clip draws nothing at all, with no error.

Removed: `templates-2026.jpg`, `new-templates.jpg`, `templates-batch3.jpg`, and
`gallery-inputs.json` — the last one's whole job was supplying content the tool now reads from
the templates themselves, and a file nothing uses is the orphan problem this repo just fixed
for images.

The "gallery images are wide, not tall" test became a **ratio** bound. A 27-tile grid comes out
slightly taller than wide and that is fine; 9:16 is 1.78 and that is the shape the test exists
to keep out. It now checks every image in the folder rather than two names that could be
deleted out from under it.

### Changed — the licence rule was answering the wrong question

`install-skills.mjs` refused any upstream with no licence file, on the grounds that *a skill
with no licence is a skill nobody may legally reuse*.

That reasoning is right about **vendoring** and was being applied to **fetching**. `docs/17`
opens by saying it: *they are not vendored*. Nothing is copied into this repository — the files
land on the user's own disk, which is what `git clone` does, and these upstreams publish
install commands inviting exactly that. `vibe-motion/skills` prints
`npx skills add vibe-motion/skills` in its own README. Refusing to fetch what an author is
asking you to fetch protects nobody.

The rule split in two. **Carrying unlicensed work in this repo is still refused** — that half
has not moved. Fetching it to your machine is allowed, with the restriction *stated* rather
than implied:

```
[skills] ! vibe-motion/skills publishes NO LICENCE FILE.
[skills]   You may keep and run this copy. You may NOT redistribute it, ship it
[skills]   inside a product, or relicense it — absent a licence, all rights are
[skills]   reserved. Upstream invites the install; it has not granted anything more.
```

The same sentence goes into the `NOTICE.md` beside the skill, so it outlives the scrollback.
What the installer refuses now is **vagueness**: an entry either names a licence file or sets
`unlicensed: true`. A test also caps how many entries may take that hatch — if most of the
catalogue drifts into it, the warning stops being read.

### Added — `via: "skills"`, and two entries that needed it

Walking the GitHub contents API one file at a time is right for a handful of markdown files and
hopeless for a repository that is mostly a project: `video-shotcraft` is **181 MB** against a
**60-request-per-hour** anonymous limit. An entry can now delegate to `npx skills add <repo>` —
`skills` is MIT, on npm, and is the installer both vibe-motion and Remotion tell people to use.

| | |
|---|---|
| `vibe-motion` | 13 motion skills (986★). No licence → installs with the warning above. Most target Remotion or three.js, so they are a source of *technique* — `frame-terminal` is already `claude-typer`'s idea rebuilt in CSS. |
| `video-shotcraft` | 104 shot recipe cards and a cinematic product-video template (3482★, Apache-2.0). Size is printed before the install starts. |

Also corrected while checking: a widely-repeated claim that
`reactvideoeditor/remotion-templates` is "81 templates, MIT". The repository has **no licence
file**. Its README says "81 free, ready-to-use" — and *free* in a README is not a licence
grant. That is precisely what this rule exists to catch, and it still catches it.

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

[Unreleased]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/XuHo-IT/Content-Agent-Kit/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.2.0
[0.1.0]: https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.1.0
