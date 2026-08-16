---
name: create-video
description: Turn an article, URL or text file into a 9:16 short video (TikTok / Reels / YouTube Shorts) with Vietnamese narration, for an agent built with content-agent-kit. Use when the user says "tạo video", "làm short/reel", "make a video from this article", "video hoá bài này", or a daily run needs a video item. Writes script.json, validates it, renders video.mp4 + voice.mp3 + script.txt.
---

# Create video

Produce a 9:16 short from written content. You write **text only** — the templates own every
pixel of design and motion. Deterministic code turns your `script.json` into the video.

> Antigravity / Gemini: same steps, run the commands directly.

## Step 1 — Get the content

- **URL** → `WebFetch` asking for: `title` (string), `content` (main body, ~500–1500 words),
  `ogImage` (string|null), `domain`. If it fails (paywall / JS-only / 4xx), **stop** and ask the
  user to save the text to a `.txt` — do not invent content.
- **`.txt` file** → `Read` it. Title = first line (≤80 chars), content = the rest,
  domain = `"local"`.
- **A queue item / an item you already wrote** → use it directly.

Pick an output directory. Inside a content-agent-kit project use `brain/<slug>/`, matching where
that item's other artifacts live. `<slug>` is ASCII, diacritics stripped (đ→d), ≤40 chars.

## Step 2 — Read the rules before writing

Read **both**, every time — they are the difference between a video that renders and one that
does not:

1. `templates/VIDEO_CRAFT.template.md` (or the project's own `VIDEO_CRAFT.md`) — the two text
   channels, the Vietnamese number table, pacing, template choice, the review rubric.
2. `video-templates/CATALOG.md` — every template's slots, types and **character limits**.
   Only use a `templateId` that appears there.

## Step 3 — Write `script.json`

Start from `templates/VIDEO_SCRIPT.template.json` — it is a complete, validator-clean 9-scene
example. Write to `<outputDir>/script.json`.

The rules that break a render if you get them wrong:

- **8–12 scenes**: 1 `hook` + 6–10 `body` + 1 `outro`. First scene `type:"hook"`, last `type:"outro"`.
- **Total 270–360 words** (≈90–120s). Each body scene **25–40 words, one idea**. Two ideas in a
  paragraph → two scenes. Keep the total; add scenes for pace.
- **`voiceText` is spoken aloud**: spell every number out in Vietnamese words
  (`GPT 5.5` → `GPT năm chấm năm`, `200MP` → `hai trăm megapixel`, `2x` → `gấp đôi`).
  No digits, no emoji, no URLs, no `→ & % $ # + =`. End each with `.` or `?`.
- **`inputs` is rendered on screen**: keep pretty numbers (`5.5`, `82%`), emoji allowed
  (0–1 per field) — but **never** in `frame-build-minimal`'s `hero`, which animates per character.
- **Hook** is always `frame-liquid-bg-hero`. **Outro** is `frame-logo-outro` (or
  `frame-statement-outro`). Body templates are your choice — **vary them**, max twice each.
- Colours (`accent_from`/`accent_to`, per-side `from`/`to`) and item `icon` emoji are yours to
  pick per scene.

**Does the whole video want a different palette?** Almost every template is dark by default.
One top-level key recolours all of them at render time:

```json
{ "aspect": "9:16", "theme": "paper-blue" }
```

`paper-blue` (white canvas, ocean-blue ink) · `paper-ink` · `paper-forest`, or an object that
overrides any field of one. Ask before choosing — a palette is the user's call, not yours.

**If the user has a website, offer to read their palette off it** rather than guessing hex
codes: `node scripts/video/theme-from-url.mjs --url <their site> --name <id>` writes a theme
they can then use by name. Run it with `--dry-run` first and show them the palette — on a
page that is mostly photography the dominant colour is the photograph, and only they can tell.
Two consequences worth knowing: emoji keep their own colours (a red 🚫 stays red on a blue
frame), and a new template must be measured with `theme-probe.mjs` before it themes correctly.
See `video-templates/CATALOG.md`.

**Which frames does this kind of business need?** `templates/INDUSTRIES.template.json` has an
entry per vertical: the genre to start from, the frames that vertical actually uses, and a
palette. It also names what that vertical *wants* and this kit cannot draw yet — do not
substitute a frame that only nearly fits, say the gap out loud instead.

**How do the scenes join?** Hard cuts unless you say otherwise. One top-level key gives the
whole video a transition, and a scene can override how it enters:

```json
{ "transition": "fade", "scenes": [{ "id": "s2", "transition": "swipe" }] }
```

`fade` · `swipe` · `slide` · `iris` · `pixelize` · `none`. The finished video is exactly the
same length either way — the padding is worked out for you — but a transition forces a
re-encode of the join, so `--no-transitions` is there while you iterate. **If a scene carries
a `whoosh`, `swoosh` or `page-flip` SFX, give it a transition**: that sound is describing a
movement, and over a hard cut it describes one that never happens.

**Does any scene want real footage?** A scene can carry a `media` block — a stock clip, or a
screenshot of the page you are citing:

```json
"media": { "kind": "video", "source": "pexels", "id": "28709421" }
"media": { "kind": "screenshot", "url": "https://…" }
"media": { "kind": "video", "source": "geo", "query": "Aokigahara, Japan" }
```

Use `frame-broll` when the footage *is* the scene, `frame-media-inset` when it illustrates a
point the words carry, `frame-screenshot` to show a page the viewer might doubt. **Never put
footage under a statistic** — a number needs a text template to stay readable, and never let
more than about a third of scenes be B-roll.

**Does the video need a change of energy?** A run of text frames and stock B-roll is one tone
for ninety seconds. `frame-meme` costs one scene and resets attention:

```json
"media": { "kind": "image", "source": "meme", "id": "drake|Viết tay|Dùng agent", "fit": "contain" }
```

- **About one meme per six to eight scenes**, and never two in a row. A meme every third
  scene is not a change of energy, it is the energy — and then nothing is a change.
- **It has to carry the point of that beat**, not decorate it. If the caption would still say
  the same thing with the meme removed, the meme is filler.
- **`fit: "contain"` is required** — `cover` crops the image to fill the frame and takes the
  punchline with it, before this template ever sees the file. The validator refuses without it.
- **Write the meme lines SHORT.** memegen fits each line to one rendered line; a line that
  wraps has its second half clipped off the image. `drake` wraps at about 15 Vietnamese
  characters, `afraid` at 23 — it depends on the template, so render it and look:
  `node scripts/media/meme-search.mjs --render "drake|…|…" --out /tmp/m.png`
- The lines are **on-screen text, not narration** — `voiceText` still has to make sense with
  the sound off the picture. Do not read the meme aloud word for word.

**Is the scene about a real place?** The `geo` source builds a flythrough of it — map tiles
falling from the whole world onto the coordinates, then satellite, then street level. It makes
a strong `frame-broll` hook when *where* is the story. **Free and keyless.** Look before you
commit: `node scripts/video/geo-flythrough.mjs --place "…" --dry-run`.

Two things it will tell you, and both matter: whether a **font** was found for the
attribution — a tile carries no credit of its own, and publishing without one breaks the
licence — and whether **street-level imagery** exists there at all (Mapillary's coverage is
much thinner than Street View's; no coverage is normal, and the clip is then map-only).
Prefer `--lat/--lng` over `--place`: geocoding a name happily returns a café with the same
name in another country. For a stylised map instead of photographic, use the vector frames —
`frame-geo-markers` → `frame-geo-route` → `frame-geo-pin-detail`.

**Is the footage somebody else's TikTok / Douyin post?** The `social` source fetches it
through a service you run — and the scene must say on what basis:

```json
"media": { "kind": "video", "source": "social", "url": "https://www.douyin.com/video/7…",
           "rights": "permitted", "rights_note": "author @abc agreed by DM, 2026-08-14" }
```

`rights` is one of `own` · `licensed` · `permitted` · `public-domain`; the last two are claims
about someone else's permission and must name it in `rights_note`. The validator refuses a
scene without a declaration, and `media-lock.json` records it beside the original URL. There
is no `unknown` value — **if you cannot say which of the four it is, use Pexels instead.**
Studying a post's hook rather than shipping its footage? `social-fetch.mjs --analyze`.

For choosing clips and capturing pages, follow the **`research-and-capture`** skill; the rules
live in `VIDEO_CRAFT.md` §4b and `docs/15-media-sources.md`.

**Pairing with specialized registry skills:**
- **Hook & CRO optimization**: Use `marketing-core` (`product-marketing.md`) or `fb-hook-extractor` to analyze hook formulas before writing scene 1.
- **STEM & Explainer formulas**: Use `manim-math` for math proofs (`frame-math-manim`) and `drawio` for flowchart/architecture mapping (`frame-diagram-architecture`, `frame-diagram-flowchart`).
- **Motion & Transition tokens**: Use `ui-transitions` and `motion-craft` for curated easing curves (`cubic-bezier`), delays, and micro-animations across HTML frames.
- **Design hierarchy**: Use `ui-ux-pro` for WCAG AAA contrast and typography ratios.

## Step 4 — Validate (do not skip)

```bash
node scripts/video/validate-script.mjs <outputDir>/script.json --strict
```

Fix everything it reports and re-run until clean. It quotes the offending text. This costs
seconds; rendering a broken script costs 3–5 minutes. Silently correct up to two rounds; if it
still fails, say what is wrong rather than rendering anyway.

## Step 5 — Pick the voice (first run, or whenever it changes)

The narrator comes from `TTS_PROVIDER`/`TTS_VOICE_ID` in env, or from the script's own `voice`
block, which wins:

```json
"voice": { "provider": "elevenlabs", "voiceId": "21m00Tcm4TlvDq8ikWAM", "speed": 1.0 }
```

Put it in the script whenever the choice matters — that is what makes the video reproducible
rather than dependent on whoever's `.env` ran it.

**Before the first render with a new voice, listen to it** — seconds, versus 3–5 minutes:

```bash
node scripts/video/tts-check.mjs --providers     # what's configured / available
node scripts/video/tts-check.mjs                 # speak a sample, save it, report timing
```

Only `omnivoice` needs a local server; the others need an API key. If a cloud provider bills
per character, check the damage first: `node scripts/video/render.mjs <script.json> --estimate`.

## Step 6 — Render

Foreground, streaming output — it takes ~15–20s per scene, so 3–5 minutes for 8–10 scenes:

```bash
node scripts/video/render.mjs <outputDir>/script.json
```

It preflights ffmpeg / Chrome / the configured voice first and names anything missing.
On success it prints `VIDEO=<path>` — capture that.

If a scene's text was wrong, fix `script.json` and re-run: **narration re-generates by itself**
when the text, provider, voice or speed changed (it is fingerprinted). Only visual edits need a
manual nudge — delete `clips/scene-<id>.mp4` after changing that scene's `inputs`.

## Step 6b — Look at the frames

```bash
node scripts/video/contact-sheet.mjs <outputDir>/video.mp4
```

One labelled thumbnail per scene in a single image. **Do this every time.** The validator
checks rules; it cannot see that a headline printed twice, that a word broke mid-syllable, or
that the B-roll shows a coffee cup. All three of those shipped before this step existed.

## Step 7 — Report

```markdown
✓ Video:  <outputDir>/video.mp4   (1080×1920, XX.Xs)
✓ Audio:  <outputDir>/voice.mp3   — for CapCut
✓ Script: <outputDir>/script.txt  — CapCut auto-caption
```

To publish it, hand off to the `video-and-post` skill or run `scripts/social/make-post.mjs
--video …` (see `docs/11-social-posting.md`).

## Notes

- Requires FFmpeg + Chrome, plus a voice: an API key for a cloud provider, **or** a local
  OmniVoice server. See `docs/14-video-generation.md`.
- No `assets/sfx/` → renders without sound effects; that is fine.
- Adding a template: see `docs/14-video-generation.md`. The validator reads the folder, so a new
  template works immediately.
