# AGENTS.md — entry point for the IDE agent

> Read this first. It tells you (the AI) how to use this kit. Works for **Claude
> Code** (real skills in `.claude/skills/`) and **Antigravity / Gemini** (read the
> `.md` docs directly — treat each `SKILL.md` as a plain instruction doc).

## Installing the skills — read this if a user says a skill "is not there"
Claude Code loads skills only from `.claude/skills/`, `~/.claude/skills/` or a plugin — **not**
from this repo's `skills/`. Two routes (newcomer walkthrough: `docs/29-bat-dau-nhanh.md`):
```bash
node scripts/install-skills.mjs --kit --global     # copy all 27, each with a .kit-root file
# or, inside Claude Code:  /plugin marketplace add XuHo-IT/Content-Agent-Kit
#                          /plugin install content-agent-kit@content-agent-kit
```
Every skill opens with a step table: narrate it as "Bước n/N", ask one thing at a time, stop
before anything irreversible. Run `node scripts/…` from the kit root (`.kit-root` says where).

## When the user says "build me an agent that does X"
1. **Read** `docs/01-architecture.md`, `docs/03-conventions.md`, and skim the rest of `docs/`.
2. **Run the bootstrap flow** in `skills/bootstrap-content-agent/SKILL.md`:
   interview the user, then scaffold their agent from `templates/` + `scripts/`.
3. Produce, in the user's target project: `PLAYBOOK.md`, `KNOWLEDGE.md`,
   `.env.example`, state JSON, (optional) `sources.yaml` + crawl workflow, wired
   scripts, a `schedule-prompt.md`, and — on Claude Code — the runtime skills
   (`daily-run`, `review-gate`, `crawl-and-queue`, `audit-and-fix`, plus
   `create-video` + `video-and-post` if the agent makes videos).

## When the user says "run today" / "tạo nội dung hôm nay"
Follow `skills/daily-run/SKILL.md` (or the generated project's `PLAYBOOK.md`):
determine today's phase, fan out, **review-gate before publish**, schedule, report.

## When the user just names a topic — "hôm nay có gì hot về X" / "what's hot in X"
Follow `skills/topic-radar/SKILL.md`. Five **keyless** sources (Reddit, Hacker News, GitHub,
Google News, Google Trends VN) — plus TikTok/Instagram/YouTube/Facebook via Apify when
`APIFY_TOKEN` is set (optional, paid) — merged, scored by heat × freshness × cross-source, and de-repeated against what
earlier runs already handed out:
```bash
node scripts/research/topic-radar.mjs --topic "AI coding agents" --top 8   # prints RADAR=<path>
```
If they want the video too — the usual case — `skills/daily-topic-video/SKILL.md` runs the
whole chain: radar → primary sources → `create-video` → review gate → publish.
Method: `docs/23-topic-research.md`.

## When the user says "tạo video" / "make a video" / "làm short/reel"
Follow `skills/create-video/SKILL.md` — read `templates/VIDEO_CRAFT.template.md` **and**
`video-templates/CATALOG.md` first, write `script.json`, then:
```bash
node scripts/video/validate-script.mjs <dir>/script.json --strict   # seconds — never skip
node scripts/video/render.mjs          <dir>/script.json            # ~3–5 min
```
To also publish it, use `skills/video-and-post/SKILL.md`. Method: `docs/14-video-generation.md`.
Many at once: `node scripts/video/render-batch.mjs list.txt` (one script.json per line) — finished
ones are skipped, one failure never stops the rest, the report says which failed and why.
Run it with `--validate-only` first.

Someone talking on camera (or just a voice recording) → `skills/talking-head-edit/SKILL.md`
(`talking-head.mjs`: cards `full`/`pip`/`split`, `--faces`, text `behind` the speaker,
`--cover` for the thumbnail, `--silence auto`, `--snap-beats`). Method: `docs/26-auto-edit.md`.

Before ANY video is posted: `node scripts/video/delivery-check.mjs video.mp4 --platform <where>`
(TikTok, Facebook Reels, YouTube Shorts, Shopee, Zalo — limits sourced and dated; `--fix`
re-encodes to fit, never trims). Editing techniques and cutting to the beat: `docs/31-ky-thuat-dung.md`.

## When the user names competitors — "phân tích đối thủ", "kênh X đang viral gì"
Follow `skills/competitor-analysis/SKILL.md`. Keyless: YouTube channels via their public feed,
any site via RSS (Vietnamese news sections included). Pass the project's history so the report
can name topic gaps:
```bash
node scripts/research/competitor-scan.mjs --channel @kenh-a --channel https://vnexpress.net/so-hoa --history brain/history.json
```
Breakouts are measured against each channel's OWN median. Never copy a competitor's title —
take the device, write your own. Method: `docs/24-competitor-analysis.md`.

## When the user brings their own footage — "cắt khoảng lặng", "dựng video tự quay"
```bash
node scripts/video/talking-head.mjs take.mp4 --transcript take.json --style pop --theme <preset> --credit "<source · licence>"
node scripts/video/transcribe.mjs take.mp4                        # word-timed transcript (server or faster-whisper)
node scripts/video/talking-head.mjs report.mp4 --edl edl.json --transcript report.json --style cinematic   # several ranges + B-roll
# "cards" in the EDL cut in kit templates (a number, a checklist, a step) while the voice runs on —
# full frame for voice-over, "pip" to keep the speaker in a corner. Example: examples/talking-head-demo/hoan-chinh/
node scripts/video/autocut.mjs take.mp4 --vertical --punch 0.12   # cut only: pauses out, punch-ins, -16 LUFS
```
To edit it the way a human editor would — fillers, repeated words and retakes cut BY WHAT WAS
SAID, cards drafted from each sentence and landed on the spoken word (`"at": "tăng"`), a music bed
ducked under the voice, a sound per card — follow `skills/talking-head-edit/SKILL.md`:
```bash
node scripts/video/speech-cuts.mjs take.transcript.json                       # review first, cuts nothing
node scripts/video/suggest-cards.mjs take.transcript.json --edl edl.json --out edl.json
node scripts/video/talking-head.mjs take.mp4 --transcript take.transcript.json --edl edl.json --cut-words --music bed.mp3 --style pop
```
Card text comes only from what the speaker said — never an invented number, price or quote.
`--style`: `clean` · `pop` · `editorial` · `cinematic` · `kinetic-doc` · `launch` · `meme`. Pick by vertical and
platform, or render two and let the user choose. Every crop must stay clear of burned-in TV
bars and logos; B-roll should come from the same licensed footage, under ~35% of the runtime.
Method (ported from kurbaitaev/ghost-editor, MIT): `docs/26-auto-edit.md`.

## When the user wants a story — "video kể chuyện", "câu chuyện thương hiệu", "brand story"
Follow `skills/story-video/SKILL.md`: find the story (who · want · in the way · turn · after),
put it on a six-beat arc, then pick `frame-story-*` frames **by the beat they carry**. Start
from a story genre in `VIDEO_GENRES.template.json` — `brand-story`, `customer-story` (a
storytelling ad), `legend` (history, heritage), `case-breakdown`. Sound for the beats:
```bash
node scripts/video/sfx-cc0.mjs            # once: 27 CC0 sounds → assets/sfx/ (page turns, stings, booms)
node scripts/video/template-sheet.mjs --preset story --out /tmp/story.jpg   # what each frame looks like
```
Never invent a customer, a quote or a letter — `frame-story-letter` is for a real message,
used with permission. Method: `docs/27-storytelling.md`.

## When the user runs Facebook ads — "chạy ads", "canh ads", "trả lời comment", "feed catalog", "tệp khách", "lịch sale"
`docs/28-facebook-ads.md` maps every stage of the work to a skill. All of it runs offline on
an Ads Manager export or pasted numbers; the `meta-ads` MCP only saves the export step.
```bash
node scripts/ads/creative-matrix.mjs plan.json --max 12         # ads-creative-lab: test matrix + ad names
node scripts/ads/fatigue-check.mjs export.csv                   # ads-fatigue-watch: which creatives are tiring
node scripts/ads/comment-triage.mjs comments.csv --brand "Shop" # ads-comment-triage: sort + draft replies
node scripts/ads/policy-lint.mjs ads.txt                        # ads-policy-check: exit 2 = BLOCK
node scripts/ads/feed-audit.mjs catalog.csv                     # catalog-feed-audit
node scripts/ads/rfm-segments.mjs orders.csv --out audiences/   # audience-plan: RFM + hashed upload files
node scripts/ads/promo-plan.mjs --quarter 2027-Q1 --budget 60000000   # promo-calendar
```
Plus `skills/ugc-koc-brief` (creator briefs, usage rights, paid-partnership disclosure). Run
`policy-lint` on any ad copy before the review gate passes it.

## Palette — every video gets one
Set `"theme"` in `script.json` to the vertical's preset from `templates/INDUSTRIES.template.json`
(`graphite-signal`, `ledger-green`, `newsprint-red`, …). No violet→cyan gradients, gradient
text or neon glows — `docs/25-palettes.md`. Check fonts carry Vietnamese glyphs after adding a
template: `node scripts/video/font-check.mjs`.

## When the user wants footage, screenshots or more visual variety
Follow `skills/research-and-capture/SKILL.md` — research the topic, capture the pages worth
showing, pick B-roll, and write `media` blocks into the scenes:
```bash
node scripts/media/stock-search.mjs --query "data center servers"   # read WHAT EACH CLIP IS
node scripts/media/screenshot.mjs --url "https://…" --out shot.png
node scripts/video/add-template.mjs --preset news                   # transitions, captions, charts
```
For a **meme** — the cheapest way to break a run of text frames. Free, no keys:
```bash
node scripts/media/meme-search.mjs --query drake
node scripts/media/meme-search.mjs --render "drake|Viết tay|Dùng agent" --out /tmp/m.png   # LOOK at it
```
`"media": { "kind":"image", "source":"meme", "id":"drake|…|…", "fit":"contain" }` on a
`frame-meme` scene. `fit:"contain"` is required — `cover` crops the punchline off. The font
defaults to **notosans**, not Impact, which has no Vietnamese diacritics.

For a **social clip** (Douyin / TikTok / Bilibili / Kuaishou) — the kit ships no downloader,
it talks to a service you run (`SOCIAL_API_BASE`, see `docs/15`). The clip is somebody else's
work, so every scene must declare `"rights"` and the validator refuses without it:
```bash
node scripts/media/social-fetch.mjs --url "https://www.douyin.com/video/7…" --analyze
```
`--analyze` studies a post's hook and rhythm without shipping its footage — the mode with no
legal question attached, and usually the one you actually want.

For a **real place** — a map falling out of the sky onto it, then street level. Free, no keys:
```bash
node scripts/video/geo-flythrough.mjs --sources                               # tile sources
node scripts/video/geo-flythrough.mjs --place "Aokigahara, Japan" --dry-run   # what it fetches
```
…or let a scene ask for it: `"media": { "kind":"video", "source":"geo", "query":"…" }`.
Stitched from OpenStreetMap-derived tiles (CARTO, Esri satellite) — **attribution is a licence
condition and is not baked into a tile**, so the script draws it on and writes a
`.credits.txt`. Never crop it out. Street level via a free Mapillary token, or the kit's own
offline vector map: `frame-geo-markers` → `frame-geo-route` → `frame-geo-pin-detail`.
Method: `docs/15-media-sources.md` and `docs/16-template-registry.md`.

## When the user wants articles from a specific site
If it runs WordPress and exposes `/wp-json/` — most of the WordPress web does — use
`scripts/crawl/wp-fetch.mjs`, not `crawl.py`. No Python, no Chromium, no queue API:
```bash
node scripts/crawl/wp-fetch.mjs --base https://example.com --categories       # find the ids
node scripts/crawl/wp-fetch.mjs --base https://example.com --category 93 --limit 2 --dry-run
```
It stops the article at its byline (so "related posts" widgets can't donate their images),
collapses WordPress's responsive copies of one photo back into one, and **refuses posts behind
a membership paywall**. Do not filter for free articles by category — a category named "Free
Cases" was 39% gated on the site this was built against. Method: `docs/10-crawl-discovery.md`.

## Non-negotiable conventions (see `docs/03-conventions.md`)
- **Env-only secrets** — never hardcode a token, webhook, or key. If env is missing, stop with a clear message.
- **Review gate** — nothing publishes without passing an independent review subagent.
- **Idempotent** — treat `409 Conflict` as "already done", mark it done, move on.
- **Clean up** — delete per-run scratch files at the end; keep only state files.
- **Copyright** — crawl = excerpts + link only; write original text.
- **Scoped auto-accept** — a scheduled run uses `acceptEdits` + a tight allow-list (never
  `bypassPermissions`); no destructive/out-of-scope commands. See `docs/13-permissions.md`.
- **No internal-id leak** — logic ids never appear in reader-visible text. See `docs/03`.
- **Validate video scripts before rendering** — `validate-script.mjs` costs seconds, a render
  costs 3–5 minutes. Never pass `--skip-validate` to save time.
- **Ad accounts are the user's** — no skill creates, edits, pauses or re-budgets a live ad, and
  none posts, hides or deletes a comment, without the user's explicit yes for that action.
- **Customer data** — only with consent (Nghị định 13/2023/NĐ-CP), only written out hashed
  (SHA-256, as Meta requires); raw emails and phones never land in a file or a report.
- **Keep the attribution** — `NOTICE.md` at the root and every `video-templates/*/NOTICE.md`
  are licence conditions of the vendored code. Never delete or "tidy" them.

## Map of the kit
- `docs/` — methodology (bilingual). Start at `01-architecture.md`.
- `templates/` — fill-in scaffolds.
- `scripts/` — generic working CLIs (env-only), incl. `scripts/video/`.
- `video-templates/` — the 130 scene templates + `CATALOG.md` (slots + character limits),
  including the 6 Claude Opus 5.5 style-recipe templates (`frame-opus-*`) and the 13 2026
  trend templates (`frame-trend-*`, emitted by `scripts/video/lib/build-trend-templates.mjs` —
  edit the builder, never the HTML).
  plus the 15 storytelling templates (`frame-story-*`, emitted by
  `scripts/video/lib/build-story-templates.mjs` — same rule: edit the builder).
  `CATALOG.md` says what each one is *for*; `node scripts/video/motion-index.mjs` says how each
  one *moves* and which sample to copy an effect from. Its `**Motion:**` lines are generated —
  regenerate with `--write-catalog`, never hand-edit. Traps: `skills/motion-craft/SKILL.md`.
- `templates/VIDEO_GENRES.template.json` — scene sequences for 20 genres (review, tutorial, news,
  listicle, launch, testimonial, local, vox-explainer, geo-answer, technical-deepdive, growth-strategy, geo-itinerary,
  comment-reply, flash-deal, data-story, brand-story, customer-story, legend, case-breakdown, comment-story). Answers 'which frames, in what order'
  rather than 'what shape is a script'. Method: `docs/21-video-genres.md`.
- `skills/` — Claude Code skills; also readable as plain instructions. `registry.json`
  lists skills from other projects, fetched on demand by `scripts/install-skills.mjs` —
  none of them are vendored. Method: `docs/17-skills-registry.md`.
- `.mcp.json` — optional ad-platform servers (OAuth in your client, no credentials in the
  repo). They are READ-AND-WRITE on live accounts. Method: `docs/18-ads-and-marketing.md`.
  Canva is there too, for campaign visuals: `docs/19-design-canva.md`.
- `skills/repurpose/` — one published item → several more, each from a DIFFERENT angle the
  source already contains. Tracks used angles in `brain/repurposed.json`, because
  `history.json` dedups by title and cannot answer that. Method: `docs/22-repurposing.md`.
- `profiles/` — backend, voice, palette and spend ceiling per context (personal,
  business). `script.json` always wins over a profile. Method: `docs/20-video-backends.md`.
- `examples/ai-news-social/` — a complete reference agent to copy from.
- `examples/ai-video-social/` — the video version of the same.
- `docs/30-de-xuat-tiep-theo.md` — the backlog: proposals not built yet, with licence, effort and
  the first step. Check it before proposing a new tool; it also lists what was rejected and why.
- `NOTICE.md` — third-party attribution for the vendored video pipeline and templates.
