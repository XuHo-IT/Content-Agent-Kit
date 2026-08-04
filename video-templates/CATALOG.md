# Template Catalog (HyperFrames, renderer: "hyperframes")

Each scene in a `script.json` names a `templateId` below and fills `inputs` with the
listed slots. The template owns all visual design; you only write text. Keep text
SHORT — these are poster layouts, not paragraphs.

Render aspect is set once per script: **`"9:16"`** (1080×1920, TikTok/Shorts/Reels —
uses `compositions/portrait.html`) or **`"16:9"`** (1920×1080 — uses `index.html`).
`1:1` is **not** supported: no template ships a square composition.

> **How this file is used.** `scripts/video/validate-script.mjs` verifies every
> `templateId` against the folders that actually exist here, so a template you add
> works immediately. The character limits below are *not* auto-enforced — respect
> them or the text overflows its layout. Authoring rules (Vietnamese TTS number
> spelling, scene pacing, template variety) live in
> `templates/VIDEO_CRAFT.template.md`; the method is in `docs/14-video-generation.md`.
>
> **Licensing.** These templates are vendored from MIT / Apache-2.0 projects. Each
> folder's `NOTICE.md` records its lineage and modifications — keep them. See the
> root `NOTICE.md`.

> Vietnamese: visual text (inputs) keeps normal formatting ("5.5", "82.7%").
> Only `voiceText` must spell numbers out phonetically (see the skill rules).
> Emoji/icons (🔥 🚀 → …) are allowed in on-screen `inputs` (they render in colour),
> but NEVER in `voiceText`. Don't put emoji in char-by-char animated fields
> (e.g. `hero` of build-minimal).

---

## frame-review-verdict

**Role:** the frame a review video is built around. Score ring that sweeps to the number,
verdict in one line, then pros and cons. Dark canvas, green accent.
**Best for:** `type: "body"`, usually right before the outro of a review.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `subject`  | string | ≤40  | what is being reviewed, small caps above the verdict |
| `score`    | number | —    | drives BOTH the printed number and the arc |
| `maxScore` | number | —    | default 10 |
| `verdict`  | string | ≤80  | the one-line answer to "so is it good?" |
| `pros`     | string | 4 max | `"a\|b\|c"` — pipe-separated; empty removes the column |
| `cons`     | string | 4 max | same; 9:16 shows 3 per column |
| `prosLabel` | string | ≤16 | column heading, default "Điểm cộng" |
| `consLabel` | string | ≤16 | column heading, default "Điểm trừ" |

---

## frame-quote-testimonial

**Role:** someone else's words, credited. Paper canvas, red accent, oversized quote mark.
**Best for:** `type: "body"` — social proof, a pulled review, an expert line.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `quote` | string | ≤200 | type steps down in 3 sizes as it lengthens |
| `name`  | string | ≤40  | its first letter becomes the avatar |
| `role`  | string | ≤60  | job title · company |

Empty `name` **and** `role` removes the whole attribution row — an unattributed quote is
worse than no quote.

---

## frame-chart-bars

**Role:** a comparison readable in two seconds. Up to five horizontal bars, each printing
its own value, one optionally highlighted. Dark canvas, amber accent.
**Best for:** `type: "body"` — before/after, us vs them, a trend in five points.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `title`     | string | ≤60 | |
| `unit`      | string | ≤40 | e.g. "phút · thấp hơn là tốt hơn"; empty removes the line |
| `bars`      | string | 5 max | `"label:value\|label:value"` — split on the LAST colon, so a label may contain one |
| `highlight` | string | — | the label to paint in the accent colour |
| `source`    | string | ≤60 | empty removes the line |

Widths are computed from the numbers and scaled to the largest, so the bars cannot
disagree with the labels. Unparseable `bars` removes the chart rather than drawing zeros.

---

## frame-step-list

**Role:** numbered steps that arrive one at a time, in narration order. Paper canvas,
green accent.
**Best for:** `type: "body"` — tutorial, listicle, "how it works".

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤24 | small label above the title; empty removes it |
| `title`  | string | ≤60 | |
| `steps`  | string | **5 max** | `"a\|b\|c"` — a sixth overflows; split into two scenes |

---

## frame-bold-poster

**Role:** hook / strong statement. 1970s editorial poster — giant red figure,
3-line tilted headline (middle line auto-red), serif standfirst.
**Best for:** the opening hook, or a punchy single-claim body beat.

| slot           | type     | limit                    | notes                                                |
| -------------- | -------- | ------------------------ | ---------------------------------------------------- |
| `kicker`       | string   | ≤24                      | small uppercase label, top-left (e.g. "Chuyên mục")  |
| `date`         | string   | ≤24                      | top-right metadata (e.g. "12 · 06 · 2026")           |
| `figure`       | string   | ≤4                       | giant red figure — a number/stat (e.g. "5.5", "200") |
| `headline`     | string[] | ≤3 lines, ≤14 chars/line | line 2 renders red                                   |
| `standfirst`   | string   | ≤160                     | italic serif sub-line                                |
| `footer_left`  | string   | ≤32                      | channel name                                         |
| `footer_right` | string   | ≤32                      | source domain (renders red)                          |

---

## frame-statement-outro

**Role:** outro / closing CTA. Paper card: red rule, CTA, giant red channel
name, muted source, ink rule.
**Best for:** the final scene (always `type: "outro"`).

| slot      | type   | limit | notes                                                                  |
| --------- | ------ | ----- | ---------------------------------------------------------------------- |
| `cta`     | string | ≤60   | uppercase call-to-action (e.g. "Theo dõi để xem bản tin mới mỗi ngày") |
| `channel` | string | ≤24   | channel name (giant red)                                               |
| `source`  | string | ≤40   | "Nguồn: <domain>"; leave empty and the line is omitted                 |

---

## frame-pentagram-stat

**Role:** body / stat. Swiss-grid data anchor on a **dark neon** canvas
(`#0a0c12` + blue ambient glow) — giant glowing amber number, cyan eyebrow label,
faint oversized cyan number bleeding off the right, a small bar chart (cyan hero
bar), dark footer bar with a cyan rule.
**Best for:** a single hero statistic / benchmark / percentage with a premium,
high-tech dark look.

| slot           | type   | limit | notes                                                      |
| -------------- | ------ | ----- | ---------------------------------------------------------- |
| `label`        | string | ≤40   | small cyan uppercase eyebrow (e.g. "Hiệu năng · Coding")   |
| `headline`     | string | ≤12   | the giant glowing amber stat (e.g. "82%", "1M", "200")     |
| `subtitle`     | string | ≤120  | one supporting sentence under the stat                     |
| `anchor`       | string | ≤4    | faint giant number behind it (usually = the stat's digits) |
| `footer_left`  | string | ≤32   | channel name (on the dark footer bar)                      |
| `footer_right` | string | ≤32   | source domain                                              |

---

## frame-build-minimal

**Role:** body / bold statement. Dark cinematic canvas (`#0b0a09` + a warm amber
ambient glow) — one **big bold word** revealed letter-by-letter (glowing warm
white), an amber eyebrow, an amber hairline, a two-line description, rotated side
labels.
**Best for:** a punchy single-concept beat (a verdict, a theme, a turning point)
with a premium dark/amber look.

| slot         | type   | limit | notes                                                         |
| ------------ | ------ | ----- | ------------------------------------------------------------- |
| `eyebrow`    | string | ≤20   | small uppercase label above the word                          |
| `hero`       | string | ≤10   | ONE short word/phrase (revealed char-by-char — keep it short) |
| `desc`       | string | ≤90   | one supporting sentence below                                 |
| `side_left`  | string | ≤20   | rotated label on the left edge (e.g. channel)                 |
| `side_right` | string | ≤20   | rotated label on the right edge                               |

---

## frame-vignelli

**Role:** body / bold stat hero. Massimo Vignelli editorial — **dark charcoal**
canvas, a single red accent column on the right, 6-column grid, a giant white
number, uppercase label, footer wordmark with red underline.
**Best for:** a striking single statistic when you want a dark, high-contrast
beat (variety vs the white/paper templates).

| slot     | type   | limit | notes                                                            |
| -------- | ------ | ----- | ---------------------------------------------------------------- |
| `kicker` | string | ≤30   | small uppercase label next to a red bar (e.g. "Khảo sát · 2026") |
| `number` | string | ≤6    | the giant white stat (e.g. "62%", "3/4", "1M")                   |
| `label`  | string | ≤40   | uppercase white label under the number (≤2 short lines)          |
| `note`   | string | ≤120  | one muted supporting sentence                                    |
| `brand`  | string | ≤24   | footer wordmark (channel name)                                   |

---

## frame-logo-outro

**Role:** outro / brand end-card (**default outro**). Deep-violet radial canvas,
a glowing segmented logo mark that assembles in, brand name with a shimmer
sweep, tagline, and a footer URL.
**Best for:** the final scene (`type: "outro"`) — a polished brand sign-off.

| slot          | type   | limit | notes                                                       |
| ------------- | ------ | ----- | ----------------------------------------------------------- |
| `brand_name`  | string | ≤60   | channel/brand name (big, shimmering)                        |
| `tagline`     | string | ≤120  | one line under the name                                     |
| `primary_url`  | string | ≤40   | footer URL / source; **empty removes the footer line**       |
| `corner_left`  | string | ≤24   | small corner label, bottom-left; **empty removes it**        |
| `corner_right` | string | ≤24   | small corner label, bottom-right; **empty removes it**       |

---

## frame-liquid-bg-hero

**Role:** hook / hero (**default hook**). "Aurora Violet" — deep-indigo canvas
with large soft floating colour blobs + faint grid; a centred white headline,
subheadline and a rounded CTA pill.
**Best for:** the opening hook (`type: "hook"`) — a modern, premium intro.

| slot          | type   | limit | notes                                              |
| ------------- | ------ | ----- | -------------------------------------------------- |
| `kicker`        | string | ≤24  | small uppercase label, top-left (e.g. "Chuyên mục")           |
| `headline`      | string | ≤60  | the hook line (keep punchy, ~2 short lines) — shown in a vivid gradient |
| `headline_from` | string | hex  | headline gradient start (optional; default vivid gold→purple) |
| `headline_to`   | string | hex  | headline gradient end (optional)                              |
| `subheadline`   | string | ≤120 | one supporting sentence                                       |
| `cta`           | string | ≤24  | rounded pill label (e.g. "Theo dõi ngay")                    |
| `brand`         | string | ≤24  | footer-left label (channel/source)                           |

> Headline renders in an eye-catching gradient (default gold→orange→pink→purple).
> Override with `headline_from`/`headline_to` to fit the tone if you want.

---

## frame-creative-voltage
**Role:** hook / creative statement (alternative). Electric split — an electric-
blue panel (mono meta + a handwritten script accent + hand-drawn underline) and
a dark panel with a stacked display title, one line outlined in electric blue.
Bold, energetic, design-forward.
**Best for:** a punchy hook or a strong creative body statement (a few short words).

| slot            | type     | limit            | notes                                                            |
| --------------- | -------- | ---------------- | ---------------------------------------------------------------- |
| `meta`          | string   | ≤40              | mono label on the blue panel (e.g. "// CHE_DO_SANG_TAO · ON")    |
| `display_lines` | string[] | ≤4 lines, short  | the big title, one line per word/phrase                          |
| `accent_index`  | number   | 0-based          | which `display_lines` line gets the electric blue outline (default 1) |
| `script`        | string   | ≤20              | handwritten accent on the blue panel (Dancing Script)            |
| `caption`       | string   | ≤60              | mono caption, bottom-right                                       |

---

## frame-glitch-title
**Role:** hook / cyberpunk glitch (alternative). Dark signal-noise canvas —
scanlines, grid, grain, vignette, mono "REC"/timecode chrome, and a big title
with a cyan×magenta RGB-split glitch. High-energy, edgy.
**Best for:** a dramatic/breaking or tech hook (a short shouty title).

| slot       | type   | limit | notes                                                  |
| ---------- | ------ | ----- | ------------------------------------------------------ |
| `title`    | string | ≤40   | the big glitch title (short; uppercased automatically) |
| `subtitle` | string | ≤80   | mono line under the title                              |

---

## frame-aicoding-list
**Role:** body / list · comparison (original). Dark canvas with a warm gradient
glow, a big gradient-accent title + subtitle, then a stack of rounded item cards
— each with a coloured icon chip, title + description, and a coloured level tag.
**Best for:** any scene that is a **list / ranking / comparison of 2–5 items**
(who's affected, pros vs cons, tiers, a checklist).

| slot       | type     | limit       | notes                                                        |
| ---------- | -------- | ----------- | ------------------------------------------------------------ |
| `title`       | string   | ≤40       | big headline (text before the accent)                          |
| `accent`      | string   | ≤20       | trailing word shown in a gradient (optional)                   |
| `accent_from` | string   | hex       | gradient start colour for `accent` (optional; default `#ff9a3d`) |
| `accent_to`   | string   | hex       | gradient end colour for `accent` (optional; default `#ff2d55`)   |
| `subtitle`    | string   | ≤60       | muted line under the title                                     |
| `items`       | object[] | 2–5 items | each: `{ icon, title, desc, tag, level }`                      |

Each `items[]` entry:
- `icon` — **you choose** an emoji that fits the item (🚫 ⚠️ ✅ 🔴 📈 ❌ 💡 🔒 🚀 …), shown in a tinted chip. Not fixed.
- `title` — bold item name (≤24). `desc` — small muted line (≤40).
- `tag` — short right-hand label (≤6, e.g. "Nguy", "Cao", "Lợi").
- `level` — `danger` (red) · `warn` (amber) · `good` (green) · `info` (blue); sets the icon/tag/bar colour.

> The accent gradient colours (`accent_from`/`accent_to`) are free to choose to fit the tone
> (e.g. warm `#ff9a3d`→`#ff2d55`, cool `#7c5cff`→`#22d3ee`, green `#34d399`→`#22c55e`).

---

## frame-aicoding-comparison
**Role:** body / head-to-head comparison (original). Dark canvas with a teal
glow, a pill badge, a "X vs Y" headline with two differently-coloured gradient
sides, two framed cards (big gradient label + bullets, a WIN badge on the winner)
and an optional stat row.
**Best for:** comparing **two things** (old vs new, A vs B, before vs after).

| slot       | type   | limit | notes                                                            |
| ---------- | ------ | ----- | ---------------------------------------------------------------- |
| `badge`    | string | ≤16   | pill label (e.g. "Đối đầu", "HEAD TO HEAD")                      |
| `pre`      | string | ≤16   | plain word before the left side in the headline (optional)       |
| `vs`       | string | ≤6    | middle word (default "vs")                                       |
| `post`     | string | ≤16   | plain word after the right side in the headline (optional)       |
| `left`     | object | —     | left side (see below)                                            |
| `right`    | object | —     | right side (see below)                                           |

Each side (`left` / `right`) object:
- `label` — short name (≤8, e.g. "LMS", "AI") shown gradient in the headline + big on the card.
- `from` / `to` — **caller-chosen** gradient hex for that side (e.g. left warm `#ffb020`→`#ff7a3d`, right teal `#34e0c0`→`#22d3ee`).
- `icon` — optional emoji shown above the card label.
- `bullets` — array of short lines (use "/" inside a line, e.g. "Khoá cố định / lộ trình tuyến tính").
- `stat` + `stat_label` — optional stat chip under the card (e.g. "88%" + "Ưa nền tảng mới").
- `win` — `true` (or a custom badge string) marks the winning side (teal border + WIN badge).

---

## frame-broll

**Role:** hook or body / footage-led. Full-bleed stock clip with one line of narration over
it. A fixed top/bottom scrim keeps the text readable on bright and dark clips alike.
**Best for:** a storytelling beat, a mood shift, an establishing scene.
**Needs a `media` block** — see `docs/15-media-sources.md`.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `chip` | string | ≤22 | pill top-left (e.g. "🔥 Tin nóng"). Omit to hide it. |
| `kicker` | string | ≤30 | small cyan uppercase label above the headline |
| `headline` | string | ≤42 | the line itself — 1–2 short lines |
| `subheadline` | string | ≤90 | one supporting line |
| `media_kind` | string | — | set by the pipeline (`video`/`image`). Do not hand-set. |

---

## frame-media-inset

**Role:** body / footage as illustration. A poster layout that keeps its own design
language, with the clip framed inside it and tinted into the palette.
**Best for:** a scene where the words carry the point and the clip *illustrates* it.
Use `frame-broll` instead when the footage IS the scene.
**Needs a `media` block.**

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | amber uppercase label |
| `headline` | string | ≤34 | big headline above the frame |
| `caption` | string | ≤130 | one sentence under the frame |
| `footer_left` | string | ≤24 | channel |
| `footer_right` | string | ≤24 | year / source |
| `media_kind` | string | — | set by the pipeline. Do not hand-set. |

---

## frame-screenshot

**Role:** body / evidence. A captured web page inside a browser chrome (traffic lights +
URL pill). The image is top-aligned so a page headline is never cropped away.
**Best for:** "here is the actual announcement" — backing a claim with its source.
**Needs a `media` block with `kind: "screenshot"` and a `url`.**

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | cyan uppercase label |
| `headline` | string | ≤34 | headline above the window |
| `url` | string | ≤46 | what the URL bar shows — trimmed for you, scheme optional |
| `caption` | string | ≤130 | one sentence under the window |
| `source` | string | ≤40 | small uppercase source line |

> The capture is 1280×860 by default and the window is sized to that ratio. Change
> `media.width`/`media.height` and the sides start cropping — adjust the `.shot` height
> in the composition to match.

---

## frame-kinetic-type

**Role:** body / statement. One sentence, arriving a word at a time in a heavy serif, so the
frame keeps pace with the narration instead of presenting a finished slide.
**Best for:** the line you want remembered — a claim, a conclusion, a reframing.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤24 | small uppercase label; empty removes it |
| `line` | string | ≤90 | split on whitespace in JS — pass a sentence, not a list |
| `accent` | string | one word | held a beat longer, coloured, underlined |
| `footnote` | string | ≤60 | source or qualifier; empty removes it |

> `accent` is matched case- and punctuation-insensitively, so `"đúng"` still matches the
> word `"đúng."` at the end of a sentence. It matches **every** occurrence — pick a word
> that appears once.

---

## frame-product-reveal

**Role:** body. The beat where a thing is finally named: a shutter wipes away and the name
scales in behind it, so the two are one gesture rather than two overlapping animations.
**Best for:** a launch, an introduction, the frame right after "so what did we build".

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `teaser` | string | ≤20 | uppercase line above; empty removes it |
| `name` | string | ≤14 at 9:16, ≤22 at 16:9 | the reveal |
| `tagline` | string | ≤70 | one line saying what it does |
| `badge` | string | ≤16 | pill under the tagline; empty removes it entirely |

> A name past the limit **wraps**, and the shutter then wipes two lines instead of one. It
> still renders; it just stops being a single gesture, which was the whole point. The 9:16
> type size was cut from 132px to 104px for exactly this reason after an eleven-character
> name broke across two lines.

---

## frame-analog-grain

**Role:** body / texture. Tape stock: SVG grain, drifting scan lines, and a title drawn three
times with the red and cyan copies offset — which is what chromatic aberration *is*, rather
than a filter approximating it.
**Best for:** an aside, a memory, a "back when" — and as relief from frames that all look
machine-clean.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `tape` | string | ≤14 | top-left furniture, e.g. `SP · 2026` |
| `timecode` | string | ≤12 | top-right furniture |
| `title` | string | ≤18 | the aberrated line — **no emoji**, it is drawn three times |
| `subtitle` | string | ≤44 | one line under it |

> Both corner slots are removed when empty, and removing both leaves a plain grained frame
> rather than an empty corner. No assets ship with this: the grain is an inline SVG filter.

---

## frame-split-compare

**Role:** body / evidence. Two states of the same thing, uncovered by a line that travels.
`frame-chart-bars` compares magnitudes; this compares **states**, which is a different claim.
**Best for:** before/after, A/B, with-and-without.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `leftLabel` / `rightLabel` | string | ≤18 | uppercase headings |
| `leftValue` / `rightValue` | string | ≤6 | the two numbers — keep them short, they are huge |
| `leftNote` / `rightNote` | string | ≤40 | optional line under each; empty removes it |
| `delta` | string | ≤5 | sits on the divider, the one place belonging to neither side |
| `caption` | string | ≤80 | what was measured, and over what |

> 16:9 splits left/right, 9:16 splits top/bottom, and the divider travels the same direction
> the reveal does in both. A divider moving against its own reveal reads as two animations
> that happen to finish together — which is how the first version of this looked.

---

## frame-terminal

**Role:** body / evidence. A command and what it printed, in a window whose chrome carries no
text. The command types itself with a `clip-path` sweep — one animation rather than a timer
per character, so it cannot drift out of step.
**Best for:** the step someone will actually run, and the error they will actually hit.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `label` | string | ≤12 | title-bar text, e.g. `bash`; empty removes it |
| `prompt` | string | ≤3 | `$` · `>` · `❯` — a slot, so it is not baked into the markup |
| `command` | string | ≤52 | longer wraps, and the sweep covers both lines |
| `output` | string | 6 max | `"a\|b\|c"` — a line starting with `!` is drawn in the error colour |
| `caption` | string | ≤70 | one line under the window; empty removes it |

> The first template here that can show code at all. Upstream ships 33 `code-*` items and this
> kit vendors none, because they are **blocks**: they carry no `index.html`, so each would
> still need a 9:16 composition written by hand before a `script.json` could name it.

---

## frame-timeline

**Role:** body. What happened, in the order it happened, on an axis that draws before the
markers arrive — so the eye reads the span before it reads the entries.
**Best for:** a retrospective, a build log, a "how we got here".

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤22 | small uppercase label |
| `title` | string | ≤34 | |
| `events` | string | 4 max | `"when:what\|when:what"` — no colon means the whole string is the label |
| `note` | string | ≤60 | empty removes it |

> **Not `frame-step-list`.** That one is procedural — do this, then this. A timeline is
> chronological, and the gap between two dates is part of the claim: "three years" and "three
> weeks" are different stories told with the same steps.
>
> Horizontal at 16:9, **vertical at 9:16** — a horizontal timeline on a phone leaves the
> labels unreadable at any type size that still fits between the markers.

---

## frame-myth-fact

**Role:** body / correction. The belief, struck out, and what is actually true underneath.
Paper canvas, red rule.
**Best for:** the shape most content worth watching has — everyone thinks X, here is why not.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `mythLabel` | string | ≤18 | e.g. "Ai cũng nghĩ" |
| `myth` | string | ≤60 | wraps to two lines safely — the strike crosses both |
| `factLabel` | string | ≤14 | e.g. "Thực tế" |
| `fact` | string | ≤80 | the correction, set larger than the myth |
| `source` | string | ≤60 | optional, and worth filling: a correction with no source is just another assertion |

> The strike is a **repeating gradient whose period is the line height**, not a positioned bar.
> The first version was a bar at `top: 52%`: it strikes a one-line myth correctly and, on a
> two-line one, lands *between* the lines and reads as an underline of the first. The text is
> `display: inline` with `box-decoration-break: clone` so the rule hugs each line rather than
> running past a short last line into empty space.

---

## frame-checklist

**Role:** body / advice. Do these, not those — two columns that stand on their own.
**Best for:** guidance with no score attached.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤26 | |
| `title` | string | ≤26 | |
| `doLabel` / `dontLabel` | string | ≤14 | column headings |
| `dos` / `donts` | string | 5 max each | `"a\|b\|c"`; an empty column is **removed**, not left as a heading over nothing |

> Pros and cons existed only inside `frame-review-verdict`, welded to a score ring — so getting
> two columns meant inventing a number to put in it. The ticks and crosses are CSS `content`,
> the same call as the oversized quote mark in `frame-quote-testimonial`: punctuation for the
> layout rather than words, so no slot needs to reach them.

---

## frame-chat-bubbles

**Role:** body / social proof, or a question worth answering. A short exchange as messages.
**Best for:** proof that reads as overheard rather than as supplied.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `title` | string | ≤24 | small uppercase label; empty removes it |
| `messages` | string | 5 max | `"who:text\|who:text"` — `me` aligns right, anything else left |
| `note` | string | ≤40 | e.g. that the exchange was shortened |

> Two speakers, not a role system: a third on a phone-width frame produces bubbles too narrow
> to read. Bubbles land ~0.45s apart, which reads as someone replying; faster reads as a paste.
>
> **Nothing here imitates a specific product's interface.** A frame that looks like a real
> app's screenshot is a claim about where the message came from.

---

## A renderer limit worth knowing: full-bleed video at 16:9

All three media templates above are **verified at both 9:16 and 16:9**. Getting there
uncovered a hard constraint in `hyperframes@0.6.94`:

**A composition whose `<video>` covers the entire frame is passed straight through as the
output — the page around it (scrim, headline, chip) is discarded.** At 9:16 the clip and the
frame share an aspect ratio and the normal page compositor runs, so `frame-broll`'s portrait
composition is full-bleed and works. At 16:9 it does not, and a full-bleed layout there
renders a bare stock clip with no text on it — silently, with a successful exit code.

Established by elimination: removing the `<video>` made the identical layout render
correctly, while an explicit `z-index`, a wrapper element and a 2px inset all changed nothing.

**If you write a template that puts footage behind text, give its 16:9 composition a layout
where the video sits in a panel rather than covering the frame** — that is exactly why
`frame-broll`'s `index.html` and `compositions/portrait.html` are different designs rather
than one file scaled. `frame-media-inset` and `frame-screenshot` were never affected because
their media is already inside a bordered element.

---

## Adding a template

Drop a folder `video-templates/<id>/` with `index.html` (16:9 root, `data-composition-id`),
`compositions/portrait.html` (9:16), `hyperframes.json`, `meta.json`, and a
`NOTICE.md` if vendored. Use a Vietnamese-capable font stack (Alfa Slab One /
Lora / Be Vietnam Pro are known-good). Then add a row here.

Or pull one from the upstream registry — 176 items, no hand-copying:

```bash
node scripts/video/add-template.mjs --list
node scripts/video/add-template.mjs --preset news
```

Only folders with a root `index.html` become scene templates. Registry *blocks* and
*components* ship `compositions/` only, so they land here as building material without
cluttering the list a script can choose from. See `docs/16-template-registry.md`.

### A delayed animation needs a start state, or frame 0 shows the ending

`animation: slide 0.8s ease 0.45s forwards` does **nothing** during its 0.45s delay — the
element renders with its normal style, which for a `forwards` animation is where it will
finish. The first half-second of the video shows the animation already over, then it snaps
back and replays.

Two ways to be right, and every template here uses one:

```css
.thing { opacity: 0;   animation: rise 0.5s ease 0.3s forwards; }  /* base = the start */
.thing { animation: rise 0.5s ease 0.3s both; }                    /* backwards fill */
```

Prefer the base-rule form when the start state is the same in both aspects, and `both` when
it is not — `frame-split-compare`'s divider slides in from the right at 16:9 and from the
bottom at 9:16, so its start state cannot live in the shared rule.

This is **not** checked by a test. Writing one meant regex-parsing CSS across two formatting
conventions in this folder, and the first attempt flagged `frame-creative-voltage`, which is
correct. A checker that fails correct code gets switched off rather than fixed.

### Look at it before you believe it

The animation bugs in this folder — two templates rendering at 1920×1080 inside a 9:16 video,
a divider travelling against its own reveal, an animation showing its final frame first — all
passed every test that existed. Render the template and open the image:

```bash
node scripts/video/theme-probe.mjs --template <id>     # canvas, both aspects
node scripts/video/contact-sheet.mjs <clip.mp4>        # then actually look at it
```

---

## Recolouring every template at once: `theme`

Almost every template here ships a dark canvas. Wanting a light one used to mean forking
fourteen templates and maintaining fourteen more. Instead, name a palette once in
`script.json` and each template is recoloured into a **throwaway copy** at render time —
the files in this folder keep the palette they were authored with.

```json
{ "aspect": "9:16", "theme": "paper-blue" }
```

| preset | canvas | ink |
| --- | --- | --- |
| `paper-blue` | white | ocean blue |
| `paper-ink` | white | near-black, print-like |
| `paper-forest` | off-white | forest green |

Or state your own — any field overrides the preset it names:

```json
"theme": { "preset": "paper-blue", "ink": "#123a5f", "hue": 208, "spread": 14 }
```

`hue` is the centre of the band every colour is squeezed into and `spread` its half-width.
The squeeze **preserves the original ordering**, so a comparison card's two sides still
differ from each other while both read as one family. A blanket "make everything #0a4a7a"
would flatten them into a single colour.

Three things are handled that a naive find-and-replace gets wrong, each of which shipped as
a bug once:

- **Colours written inside JS and `data-composition-variables` are recoloured too** — that is
  where a template keeps its caller-facing colours, so skipping them left a themed
  comparison card with one orange side and one teal one.
- **`mix-blend-mode: screen` flips to `multiply`** when a dark canvas goes light. Screen over
  white paints white, so an aurora blob or a glitch layer would silently disappear.
- **Accents are darkened until they clear 3:1 against the canvas.** Flipping lightness alone
  leaves a mid-tone accent at ~1.5:1 on white — perfectly readable before, invisible after.

Emoji are the one thing a theme cannot touch: they are colour glyphs, not CSS. A red 🚫 stays
red on a blue-and-white frame. Choose them with that in mind, or leave the slot empty.

### Which way to flip is measured, not guessed

```bash
node scripts/video/theme-probe.mjs                       # write video-templates/theme-map.json
node scripts/video/theme-probe.mjs --preview paper-blue   # 14 before/after stills in ~40s
node scripts/video/theme-probe.mjs --selftest             # the colour rules, offline
```

A dark canvas needs its lightness flipped; a light one only needs re-hueing. Reading that
out of the CSS does not work — the canvas is painted by a full-bleed child as often as by
`body`, and **two compositions of the same template can disagree**: `frame-bold-poster` is
light at 16:9 and dark at 9:16. So Chrome screenshots each composition and ffmpeg measures
it. Add a template, re-run the probe, commit `theme-map.json`.

`--preview` is worth the forty seconds before committing to a five-minute render. It cannot
show everything: `frame-broll`, `frame-media-inset`, `frame-screenshot` and
`frame-pentagram-stat` reveal their content through the hyperframes animation driver, so
those four preview as bare canvases. Judge them from the contact sheet after a render.

---

## Two slot contracts that are easy to get wrong

Both of these render *something* when misused, so a broken value survives all the way to
the finished video. They were hit while making a real video — do not rediscover them.

**`frame-aicoding-list` — `title` is a PREFIX; `accent` is APPENDED to it.**
They concatenate into one headline; `accent` is the part that gets the gradient.

| | |
|---|---|
| ✗ | `"title": "Hai bản, một mô hình"`, `"accent": "một mô hình"` → *"Hai bản, một mô hìnhmột mô hình"* |
| ✓ | `"title": "Hai bản, "`, `"accent": "một mô hình"` → *"Hai bản, **một mô hình**"* |

Keep the trailing space on `title` — nothing inserts one for you.

**`frame-aicoding-comparison` — `pre` + `vs` + `post` is ONE sentence split in three.**
It is not the two card labels. Those live in `left.label` / `right.label` and should be
short (`"LMS"`, `"AI"`, `"Fable 5"`).

| | |
|---|---|
| ✗ | `pre:"Fable 5"`, `vs:"→"`, `post:"Opus 4.8"` with the same names as labels → each name twice |
| ✓ | `pre:"Câu hỏi rủi ro"`, `vs:"chuyển sang"`, `post:"bản an toàn hơn"` |

---

## Vietnamese breaks layouts that Latin text does not

Two templates shipped with `line-height` below 1 — comfortable for Latin capitals, and wrong
here. A Vietnamese vowel can carry a **horn and a tone mark stacked above** it (Ư, Ỡ, Ầ) and
still have a descender below (g, y). Both were found by looking at a contact sheet; neither
validator rule could have caught them, because the text was the right length and the render
exited 0.

| template | was | is | what went wrong |
| --- | --- | --- | --- |
| `frame-bold-poster` | `.head` `line-height: 0.98` / `0.92` | `1.2` / `1.18` | the three headline lines are tilted up to 4°, so their ends swing ~30px vertically — "ngày" landed on top of "rồi tắt" |
| `frame-build-minimal` | `.hero` `line-height: 0.98` / `0.96` | `1.16` / `1.14` | the tilde was clipped off "Ỡ" |

`frame-build-minimal` also had a subtler one. Its hero is split into one `inline-block` per
character for the letter-by-letter reveal, which makes **every character a line-break
opportunity** — ordinary text never breaks inside a word, but this does. The auto-fit shrank
the word to fit on one line, then set `white-space` back to its default, and a size that was
one pixel too wide rendered "NGƯỠNG" as **"NGƯỠ / G"**. The fit now keeps `nowrap` and leaves
a 3% margin for letter-spacing rounding.

If you author a template: use `line-height: 1.15` or more on any large Vietnamese display
text, and never re-enable wrapping on per-character spans.
