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
>
> **`**Motion:**` is generated, not written.** It appears only on templates that move by
> something beyond `opacity`/`translate`, and it is there so you can find a working sample to
> copy instead of reinventing the effect. Regenerate it after editing a template — never hand-
> edit the line:
> ```bash
> node scripts/video/motion-index.mjs                      # the table, and what to copy from
> node scripts/video/motion-index.mjs --write-catalog       # rewrite the lines below
> ```
> Techniques and their traps: `skills/motion-craft/SKILL.md`.

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
**Motion:** draw-on

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
**Motion:** gradient-text · continuous loop

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
**Motion:** conic, gradient-text · continuous loop
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
**Motion:** gradient-text · continuous loop

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
**Motion:** gradient-text · continuous loop

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
**Motion:** draw-on, gradient-text

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
**Motion:** gradient-text, mask-sweep · continuous loop
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
**Motion:** gradient-text, mask-sweep

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
**Needs a `media` block** — see `docs/15-media-sources.md`. With none resolved it draws a
shapes-only stand-in rather than a black frame; the fault should look like missing input, not
like a broken renderer.

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
**Needs a `media` block with `kind: "screenshot"` and a `url`.** With no capture resolved the
screen shows a shapes-only stand-in rather than dead browser chrome.

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
**Motion:** mechanical · continuous loop
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
**Motion:** clip-reveal · continuous loop

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
**Motion:** clip-reveal, mechanical · continuous loop

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

## frame-node-graph

**Role:** body / structure. Boxes and the connections between them, **laid out from the data**.
**Best for:** a workflow, a supply chain, an architecture, a document flow — the four things
**Motion:** draw-on · continuous loop
`INDUSTRIES.template.json` asks for most.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤22 | |
| `title` | string | ≤34 | |
| `nodes` | string | 8 max | `"id:Label\|id:Label"` — the id is what edges refer to |
| `edges` | string | 12 max | `"a>b\|a>c"` — branching and converging both work |
| `note` | string | ≤60 | empty removes it |

> **No coordinates are typed.** Depth comes from a breadth-first search out of whatever has
> no incoming edge; nodes spread evenly within their depth; wires are drawn from the real
> laid-out positions rather than from guesses. A diagram with hand-placed boxes disagrees
> with its own data the first time an edge changes.
>
> Columns at 16:9, **rows at 9:16** — a left-to-right flow on a phone gives each box about 90
> pixels of width, which is a suggestion of a diagram rather than one.
>
> A cycle would loop the depth search forever, so anything still unplaced afterwards is
> parked in a final layer. A graph that disagrees with itself still draws.

---

## frame-trend-line

**Role:** body / data. One value moving over time, drawn from the numbers.
**Best for:** finance and environment — the two verticals that asked for it.
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤26 | |
| `title` | string | ≤40 | |
| `unit` | string | ≤34 | what the numbers are, printed under the axis |
| `points` | string | 3–8 | `"T1:1689\|T2:1204"` — label:value |
| `highlight` | string | one label | that point is enlarged and prints its value |
| `baseline` | string | `zero` (default) · `auto` | see below |

> **The Y axis starts at zero.** `INDUSTRIES.template.json` lists *"a chart with the Y axis cut
> so the rise looks steeper than it is"* under what a finance post must avoid — so this
> template enforces it rather than leaving it as advice a caller can ignore.
>
> `baseline: "auto"` opts into a zoomed axis **and makes the frame print that it did**. A
> zoomed axis is a legitimate choice; an invisible one is the problem.
>
> Not `frame-chart-bars` (compares categories) and not `frame-timeline` (marks events).

---

## frame-dashboard

**Role:** body / data. Several numbers at once, each with which way it moved.
**Best for:** a quarter, a month, a status — finance and corporate.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤24 | |
| `title` | string | ≤30 | |
| `cells` | string | 4 max | `"Label:Value:Delta"` — the delta is optional per cell |
| `note` | string | ≤50 | what the comparison is against |

> **The delta's colour comes from its sign**, so a caller cannot accidentally paint a fall
> green. A cell with no delta simply has none — better than a `0%` that looks measured.
>
> Deliberately no sparklines and no icons. Four numbers with their direction is the job;
> anything more and it becomes a picture of a real dashboard, which `frame-screenshot` does
> better because it *is* one.

---

## frame-hud

**Role:** body / instrument chrome around one reading.
**Best for:** games and tech — a number that belongs to a machine rather than to a document.
**Motion:** conic · continuous loop

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `label` | string | ≤26 | small caps above the reading |
| `readouts` | string | 4 max | `"LABEL:value"` — they take the four corners in order |
| `center` | string | ≤6 | the reading; it is enormous, so keep it short |
| `caption` | string | ≤44 | one line under it |

> Everything else in this folder is a document laid out on a page. A HUD is the opposite:
> furniture at the edges, one thing in the middle.
>
> **The sweep is slow on purpose.** A fast radar sweep reads as a loading state, and a loading
> state is the one thing a finished frame must not look like. It is also square and centred
> past the diagonal — the first version was a 150% wedge anchored at the centre, which clipped
> at the edges and read as a rendering fault.

---

## frame-geo-markers

**Role:** body / place. Locations on a map, plotted from coordinates.
**Best for:** where you operate, where something happened, where the readers are.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤24 | |
| `title` | string | ≤36 | |
| `markers` | string | 6 max | `"lat,lon:Label\|lat,lon:Label"` — decimal degrees |
| `note` | string | ≤60 | empty removes it |

> **The view fits itself to the markers.** No zoom slot, because a zoom slot is one more thing
> to get wrong; the bounding box is padded, expanded to the frame's aspect, and floored at
> about 7° so two neighbouring cities do not produce a map of one province.
>
> The first version floored *both axes independently* at 60×30 units and then multiplied.
> One unit is 0.36°, so a 60-unit floor is 21° before any padding — three Vietnamese cities
> came out as a map of Indonesia.
>
> Markers sit at **62% down** rather than centred: the title owns the top of the frame, and
> a marker under it is a marker nobody can read.

---

## frame-geo-route

**Role:** body / journey. Stops in order, with the arcs between them drawn one after another.
**Best for:** a delivery route, an itinerary, "we expanded to N markets".
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤24 | |
| `title` | string | ≤36 | |
| `stops` | string | 6 max | `"lat,lon:Label"` — **order is the content**, so stops are numbered |
| `note` | string | ≤44 | |

> Arcs bulge perpendicular to the straight line. A straight segment between two dots reads as
> a ruler; the curve is what makes it read as a journey. It is a quadratic Bézier rather than
> a great circle — at the span one video covers, the difference is smaller than the stroke.

---

### The map itself: where it comes from and why it is committed

Both frames draw the same coastlines, inlined as one SVG path.

```
Natural Earth 1:110m Admin 0   PUBLIC DOMAIN, no permission needed
  → topojson/world-atlas       ISC
  → scripts/video/build-map-path.mjs
  → video-templates/world-path.json   (125 rings, ~59 KB)
```

```bash
node scripts/video/build-map-path.mjs            # regenerate
node scripts/video/build-map-path.mjs --check    # verify, no network
```

**Nothing is fetched at render time.** The upstream HyperFrames `world-map` block loads d3,
topojson-client, gsap **and** the atlas from a CDN on every render — which turns "offline
means missing fonts" into "offline means a blank map", and puts four network round trips into
a step that otherwise has none. These draw with the network unplugged.

TopoJSON is decoded by hand in about forty lines rather than by adding a dependency. The trap
there: a **negative arc index means that arc reversed**, encoded as `~i`. Getting it wrong
produces a map that looks almost right, with coastlines doubling back on themselves.

---

## frame-funnel

**Role:** body / data. One population shrinking through stages, and where it goes.
**Best for:** marketing — the drop between two stages *is* the content.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤22 | |
| `title` | string | ≤34 | |
| `stages` | string | 2–6 | `"Label:number\|Label:number"`, largest first |
| `note` | string | ≤50 | |

> **Width comes from the number**, not from position in the list. A funnel drawn as evenly
> narrowing trapezoids is a decoration that happens to have numbers on it, and it lies whenever
> the real drop is uneven — which is most of the time.
>
> **Conversion rates are computed, never typed.** A printed percentage that disagrees with the
> width beside it is worse than no percentage, and a hand-entered one disagrees the first time
> a number moves. The steepest drop is marked, because that is the stage anyone reading a
> funnel is looking for.
>
> Labels sit **above** their bar, not on it. On it, a label straddles the bar's edge at the
> narrow stages: half on purple, half on black.

---

## frame-progress

**Role:** body / state. How far through one thing you are, and what is left.
**Best for:** a roadmap, a build log, a fundraiser, a game's completion.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤22 | |
| `title` | string | ≤42 | |
| `value` / `total` | number | — | the percentage is computed from these |
| `milestones` | string | 4 max | `"at:Label"` — `at` is in the same units as `value` |
| `note` | string | ≤50 | |

> Milestones sit at **their own proportion** along the track: one at 80% is drawn at 80%, not
> at "the fourth of five".
>
> Over 100% draws a full bar and still prints the true figure. A campaign at 143% should look
> finished and say 143 — not look broken.
>
> Not `frame-chart-bars` (compares things) and not `frame-timeline` (marks dates). Neither says
> how far through **one** thing you are.

---

## frame-draw-on

**Role:** body / annotation. A mark drawing itself, the way a hand would.
**Best for:** education — ringing the answer, ticking the right one, underlining the point.
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤22 | |
| `title` | string | ≤34 | |
| `paths` | string | 5 max | a preset name, or raw SVG path data; drawn in order |
| `caption` | string | ≤44 | |

Presets: `circle` · `check` · `cross` · `underline` · `arrow`. Anything else is treated as SVG
path data in a 100×100 box, so a caller who needs a specific shape can give one.

> The advice circulating for this effect is *"SVG + GSAP"*. `stroke-dasharray` and
> `stroke-dashoffset` do it in **CSS with nothing installed**, which is the constraint this kit
> works under.
>
> **Do not add `vector-effect: non-scaling-stroke` here.** `getTotalLength()` returns *user*
> units while `non-scaling-stroke` makes the browser read `stroke-dasharray` in *screen*
> pixels. The two disagree by the viewBox scale — the first version repeated the dash seven
> times and drew every stroke as fragments instead of a line being drawn.
>
> Each stroke's length is **measured**, not estimated: too short leaves the tail undrawn, too
> long delays the finish past the narration.

---

## frame-3d-device

**Role:** body / media. A capture on a screen, tilted in space.
**Best for:** "here is the thing running" — a product, an app, this kit's own terminal.
**Motion:** dimensional · continuous loop

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤22 | |
| `headline` | string | ≤44 | |
| `caption` | string | ≤60 | |

Takes the capture at `assets/media.png`, the same path `frame-screenshot` uses — so
`scripts/media/screenshot.mjs` feeds it with nothing new added.

> With no capture yet, the screen shows a **CSS-only skeleton** — window bar, three dots, four
> bars. A broken `<img>` with an empty `alt` paints no alt *text* in Chrome, so the first build
> of this template rendered a black rectangle in the catalogue: the same blank-default fault as
> `frame-broll`, arriving by a different route. The skeleton has no text in it, so it can never
> say something the caller did not. (The catalogue image no longer shows the skeleton — like
> the other three footage-led frames it is handed a committed still; see `STILL_FOR` in
> `scripts/video/template-sheet.mjs`.)
>
> Empty `alt` does *not*, however, hide Chrome's own 16px broken-image mark on an image that
> has layout dimensions. That mark sat in the corner of this skeleton until someone rendered
> the file with no `assets/` beside it and looked. All four media frames now hide a failed
> image outright.
>
> The device keeps turning instead of settling. A mockup that stops moving is a still with
> extra steps.

---

## frame-3d-flip

**Role:** body. A card that turns over to show what was behind it.
**Best for:** question → answer, before → after, claim → correction, in one gesture.
**Motion:** dimensional

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `frontLabel` | string | ≤16 | |
| `front` | string | ≤48 | what is on screen first |
| `backLabel` | string | ≤16 | |
| `back` | string | ≤40 | the payoff; **empty drops the whole card** |
| `note` | string | ≤50 | |

> `frame-myth-fact` shows both sides at once and strikes one out. Use this instead when the
> second thing is a *payoff* rather than a *contrast* — it stays hidden until the turn.
>
> `backface-visibility: hidden` is what makes it a turn and not a smear: without it both faces
> paint through each other for the whole half-second the card is edge-on.
>
> The card's faces are absolutely positioned, so `.scene` carries the height. Pushing the note
> down with a margin instead — the first build — left the card hanging in the top third with
> the frame's lower half empty.

---

## frame-3d-stack

**Role:** body. Layers receding into the frame.
**Best for:** a tech stack, a set of options, a pile of anything — depth, not order.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤22 | |
| `title` | string | ≤40 | |
| `layers` | string | 2–5 | `"Front\|Behind\|Further back"`, front first; extras ignored |
| `note` | string | ≤50 | |

> `frame-step-list` shows ORDER. This shows DEPTH — how many there are and that they sit on
> top of each other.
>
> Each label sits at the **bottom** of its card, because the part of a back card you can see is
> the strip below the card in front of it.
>
> That alone was not enough. The first build anchored the labels to the bottom and three of the
> four still read as text sliced in half, because **perspective shrinks each card toward the
> centre of the scene and the shrink compounds down the pile** — a strip that measures 96px in
> the flat layout is not 96px once projected, and by the fourth card it had closed up under its
> own label. Two changes fixed it: the Z step dropped from 70px to **46px** so recession still
> reads without eating the strips, and the Y step is now **measured at render time** from the
> card's own height rather than typed as a constant, which one aspect was always going to be
> wrong for — the card is 136px tall in portrait and 118 in landscape.
>
> Depth comes from `translateZ` alone. Multiplying it by a hand-written `scale()` as well
> shrank the back card to three quarters and the pile stopped looking like one object seen in
> perspective.

---

## frame-3d-spotlight

**Role:** hook / outro. A light swings across and the words are there when it passes.
**Best for:** a single line that wants weight — an opening claim, a closing thought.
**Motion:** gradient-text · continuous loop

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤20 | optional; empty is dropped |
| `headline` | string | ≤44 | |
| `caption` | string | ≤50 | |

> The cone has to be **wider than the frame at its foot**, or the visible slice is a shaft of
> near-constant width and the eye reads a searchlight rather than a lamp.
>
> The reveal gradient holds its lit colour to the far end, so the sweep *lands* on an evenly
> lit headline. A gradient that darkens again at 100% — the first build — leaves whichever
> words the sweep passed last permanently dimmer than the rest, which reads as a broken font
> rather than as light.

---

## frame-vox-highlighter

**Role:** body / investigative evidence. Cream newsprint document card with animated electric yellow highlighter marker stroke sweeping across key words.
**Best for:** `type: "body"` — citing reports, leaked documents, official publications or shocking findings in Vox visual journalism style.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤28 | uppercase kicker tag (e.g. "HỒ SƠ TƯ LIỆU · BÁO CÁO") |
| `document_title` | string | ≤60 | serif title of the source publication |
| `quote_pre` | string | ≤80 | optional text before the highlighted phrase |
| `highlight_text` | string | ≤80 | **the key phrase** to draw the yellow marker over |
| `quote_post` | string | ≤80 | optional text following the highlighted phrase |
| `source_note` | string | ≤60 | citation note at footer |

---

## frame-vox-collage

**Role:** hook / body statement. Archival investigative collage with vintage ruler, taped tag, angled red rubber stamp ("BÍ MẬT" / "ĐÃ KIỂM CHỨNG"), and bold serif headline.
**Best for:** `type: "hook"` or strong turning-point body beat in a documentary or video essay.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤28 | category / investigation tag |
| `stamp_label` | string | ≤18 | red rubber stamp text (e.g. "BÍ MẬT", "XÁC NHẬN") |
| `headline` | string | ≤60 | large high-contrast display headline |
| `subhead` | string | ≤140 | explanatory summary card with yellow accent border |
| `source` | string | ≤50 | archive or document provenance |

---

## frame-vox-data-callout

**Role:** body / data journalism. Technical grid with crosshairs, giant central stat number, yellow underline, and 2 distinct breakdown callout cards with pointer lines.
**Best for:** `type: "body"` — breaking down a shocking statistic or comparing two quantitative impacts.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | infographic label |
| `stat_number` | string | ≤12 | giant figure (e.g. "+340%", "42.8 tỷ", "3.2x") |
| `stat_label` | string | ≤70 | what the figure represents |
| `callout_1_title` | string | ≤30 | title for breakdown point 1 |
| `callout_1_desc` | string | ≤80 | explanation for breakdown point 1 |
| `callout_2_title` | string | ≤30 | title for breakdown point 2 |
| `callout_2_desc` | string | ≤80 | explanation for breakdown point 2 |
| `source` | string | ≤50 | data source attribution |

---

## frame-geo-local-card

**Role:** body / local review. High-end map-grid card featuring location name, street address, 5-star rating score with review count, and feature highlight pills.
**Best for:** `type: "body"` — local business, food review, travel check-in, real estate.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | local category (e.g. "ĐỊA ĐIỂM NỔI BẬT · ĐÀ NẴNG") |
| `badge` | string | ≤20 | top pill badge (e.g. "TOP 1 CHECK-IN", "PHẢI THỬ") |
| `place_name` | string | ≤50 | name of the place / venue |
| `address` | string | ≤70 | street / district address |
| `rating` | string | ≤5 | score (e.g. "4.9") |
| `rating_count` | string | ≤30 | number of reviews (e.g. "1,250+ đánh giá") |
| `highlights` | string | 4 max | `"a\|b\|c"` — pipe-separated highlight tags |

---

## frame-geo-region-stat

**Role:** body / multi-region comparison. Regional market choropleth and animated progress breakdown bars comparing provinces, regions or countries.
**Best for:** `type: "body"` — market share by region (Bắc - Trung - Nam), geographic expansion, demographic differences.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | market report tag |
| `title` | string | ≤60 | main comparison title |
| `subtitle` | string | ≤70 | time period or context |
| `regions` | string | 4 max | `"Tên:Số:Tỷ lệ%\|..."` (e.g. `"Miền Bắc:450 tỷ:48%\|Miền Nam:360 tỷ:38%"`) |
| `highlight_region` | string | ≤30 | name of the region to illuminate in cyan accent |
| `source` | string | ≤50 | data source note |

---

## frame-geo-faq-direct

**Role:** hook / body — Answer-First GEO. Search engine query box followed by an immediate direct 1-sentence definition (<25 words), 2 bulleted evidence points, and a citation anchor.
**Best for:** `type: "hook"` or `type: "body"` — Generative Engine Optimization explainer video answering search queries directly for AI citation.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `query` | string | ≤70 | exact search query / question |
| `answer_direct` | string | ≤130 | concise direct answer (<25 words) |
| `evidence_1` | string | ≤90 | supporting fact 1 |
| `evidence_2` | string | ≤90 | supporting fact 2 |
| `citation_source` | string | ≤60 | official source anchor |

---

## frame-vox-split-screen

**Role:** hook / body — investigative split-screen. Left half displays archival document scan with live timecode HUD and stamp; right half features bold display typography conclusion.
**Best for:** `type: "hook"` or `type: "body"` — contrasting official claims with verified investigative findings.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | investigative category tag |
| `tag_label` | string | ≤20 | document category badge (e.g. "TÀI LIỆU GỐC") |
| `doc_title` | string | ≤60 | title of the scanned report |
| `doc_snippet` | string | ≤120 | key excerpt from the document |
| `headline` | string | ≤60 | high-impact serif display headline |
| `takeaway` | string | ≤130 | takeaway conclusion card |
| `source` | string | ≤60 | archive or audit source |

---

## frame-vox-investigation-board

**Role:** hook / body — detective corkboard. Archival pinboard with 3 pinned evidence cards, animated connecting red strings, and a slamming red "CONFIRMED" rubber stamp.
**Best for:** `type: "hook"` or `type: "body"` — connecting multiple clues, root cause analysis, or investigative breakdowns.
**Motion:** draw-on · continuous loop

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | case dossier label |
| `board_title` | string | ≤50 | main investigation title |
| `card_1_label` | string | ≤20 | evidence 1 label |
| `card_1_text` | string | ≤90 | evidence 1 text |
| `card_2_label` | string | ≤20 | evidence 2 label |
| `card_2_text` | string | ≤90 | evidence 2 text |
| `card_3_label` | string | ≤20 | evidence 3 label |
| `card_3_text` | string | ≤90 | evidence 3 text |
| `stamp_text` | string | ≤18 | rubber stamp text (e.g. "XÁC THỰC", "CONFIRMED") |
| `conclusion` | string | ≤110 | bottom conclusion banner |

---

## frame-vox-pull-quote

**Role:** body — editorial pull quote. Giant stylized quotation marks, newsprint background, highlighted key phrase, author name, and official verification seal.
**Best for:** `type: "body"` — memorable quotes from executives, researchers, or historical figures.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | quote category tag |
| `quote_main` | string | ≤160 | full quotation text |
| `highlight_word` | string | ≤40 | key phrase inside quotation to highlight in yellow |
| `author_name` | string | ≤40 | speaker / author full name |
| `author_role` | string | ≤70 | speaker title or organization |
| `source_date` | string | ≤40 | publication date or venue |

---

## frame-diagram-flywheel

**Role:** body — strategic flywheel. Circular orbital growth loop with 4 self-reinforcing nodes, particle flow animation, and central value hub.
**Best for:** `type: "body"` — explaining compounding advantages, business models, or virtuous cycles.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | strategic model label |
| `title` | string | ≤60 | main flywheel title |
| `core_label` | string | ≤24 | central hub label |
| `node_1` | string | ≤40 | stage 1 node title |
| `node_2` | string | ≤40 | stage 2 node title |
| `node_3` | string | ≤40 | stage 3 node title |
| `node_4` | string | ≤40 | stage 4 node title |
| `takeaway` | string | ≤140 | strategic summary narrative |

---

## frame-diagram-quadrant

**Role:** body — 2x2 matrix quadrant. Magic quadrant grid with directional X/Y axes, 4 labeled quadrants, and animated highlight badge.
**Best for:** `type: "body"` — market positioning, competitive landscaping, prioritization frameworks.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | framework tag |
| `title` | string | ≤60 | matrix evaluation title |
| `axis_x` | string | ≤30 | X-axis label with direction arrow |
| `axis_y` | string | ≤30 | Y-axis label with direction arrow |
| `q1_label` | string | ≤24 | top-left quadrant title |
| `q2_label` | string | ≤24 | top-right quadrant title (Leaders) |
| `q3_label` | string | ≤24 | bottom-left quadrant title |
| `q4_label` | string | ≤24 | bottom-right quadrant title |
| `highlight_entity` | string | ≤30 | entity badge text in winning quadrant |
| `summary` | string | ≤140 | strategic insight takeaway |

---

## frame-diagram-radar

**Role:** body — 6-axis spider radar chart. Concentric polygonal grid evaluating 2 competing solutions across 6 key performance dimensions.
**Best for:** `type: "body"` — model benchmark comparisons, architecture evaluations, feature gap analyses.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | evaluation tag |
| `title` | string | ≤60 | comparison title |
| `metrics` | string | 6 items | `"Metric1\|Metric2\|...\|Metric6"` pipe-separated |
| `model_a_name` | string | ≤30 | name of model / system A |
| `model_a_scores` | string | 6 nums | comma-separated values 0-100 (e.g. `"92,88,95,85,90,94"`) |
| `model_b_name` | string | ≤30 | name of model / system B |
| `model_b_scores` | string | 6 nums | comma-separated values 0-100 (e.g. `"60,70,45,65,55,60"`) |
| `verdict` | string | ≤140 | benchmark conclusion takeaway |

---

## frame-diagram-architecture

**Role:** body — system architecture & data pipeline. 4-node pipeline flow with animated data packets, status lights, and throughput telemetry.
**Best for:** `type: "body"` — backend architectures, AI agent workflows, distributed cloud pipelines.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | architecture label |
| `system_title` | string | ≤60 | system pipeline title |
| `node_1_name` | string | ≤30 | node 1 title |
| `node_1_tech` | string | ≤40 | node 1 stack details |
| `node_2_name` | string | ≤30 | node 2 title |
| `node_2_tech` | string | ≤40 | node 2 stack details |
| `node_3_name` | string | ≤30 | core node 3 title |
| `node_3_tech` | string | ≤40 | core node 3 stack details |
| `node_4_name` | string | ≤30 | node 4 title |
| `node_4_tech` | string | ≤40 | node 4 stack details |
| `throughput_metric` | string | ≤30 | telemetry badge (e.g. "LATENCY: < 120MS") |
| `summary` | string | ≤140 | architecture resilience note |

---

## frame-geo-itinerary

**Role:** body — multi-stop travel & logistics route. 3-stage timeline route with timestamps, location names, and highlight tags.
**Best for:** `type: "body"` — travel guides, city tours, delivery logistics, multi-stop itineraries.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | travel itinerary tag |
| `itinerary_title` | string | ≤60 | tour or route title |
| `stop_1_time` | string | ≤20 | stop 1 arrival time |
| `stop_1_name` | string | ≤40 | stop 1 location name |
| `stop_1_highlight` | string | ≤90 | stop 1 key experience |
| `stop_2_time` | string | ≤20 | stop 2 arrival time |
| `stop_2_name` | string | ≤40 | stop 2 location name |
| `stop_2_highlight` | string | ≤90 | stop 2 key experience |
| `stop_3_time` | string | ≤20 | stop 3 arrival time |
| `stop_3_name` | string | ≤40 | stop 3 location name |
| `stop_3_highlight` | string | ≤90 | stop 3 key experience |
| `total_duration` | string | ≤30 | total trip time badge |

---

## frame-geo-versus-city

**Role:** body — regional head-to-head comparison. Dual split card comparing 2 cities or markets across 3 key economic/operational metrics.
**Best for:** `type: "body"` — market expansion decisions, cost of living, regional talent comparisons.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | regional benchmark tag |
| `versus_title` | string | ≤60 | main comparison title |
| `city_a_name` | string | ≤30 | city / region A name |
| `city_a_badge` | string | ≤24 | city A specialization tag |
| `city_b_name` | string | ≤30 | city / region B name |
| `city_b_badge` | string | ≤24 | city B specialization tag |
| `metric_1_name` | string | ≤30 | metric 1 label |
| `metric_1_val_a` | string | ≤20 | metric 1 value for A |
| `metric_1_val_b` | string | ≤20 | metric 1 value for B |
| `metric_2_name` | string | ≤30 | metric 2 label |
| `metric_2_val_a` | string | ≤20 | metric 2 value for A |
| `metric_2_val_b` | string | ≤20 | metric 2 value for B |
| `metric_3_name` | string | ≤30 | metric 3 label |
| `metric_3_val_a` | string | ≤20 | metric 3 value for A |
| `metric_3_val_b` | string | ≤20 | metric 3 value for B |
| `summary` | string | ≤140 | comparative conclusion |

---

## frame-geo-pin-detail

**Role:** body — deep-dive landmark card. High-end venue card with GPS coordinates HUD, star rating score, address, price tier, and call-to-action button.
**Best for:** `type: "body"` — venue spotlight, restaurant review, hotel review, flagship attraction.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | feature landmark tag |
| `venue_name` | string | ≤50 | venue or business name |
| `category_tag` | string | ≤24 | venue category |
| `gps_coords` | string | ≤40 | latitude/longitude HUD coordinates |
| `address` | string | ≤70 | street and district address |
| `rating` | string | ≤8 | rating score (e.g. "4.9 / 5.0") |
| `price_tier` | string | ≤30 | pricing category |
| `hours_status` | string | ≤50 | operational hours |
| `signature_dish` | string | ≤80 | signature dish or top amenity |
| `cta_button` | string | ≤30 | call to action button text |

---

## frame-ui-glass-dashboard

**Role:** hook / body — glassmorphic control panel. Frosted glass card in Linear/macOS style with 3 live KPI cards, animated SVG sparkline chart, and telemetry status.
**Best for:** `type: "hook"` or `type: "body"` — SaaS launches, infrastructure monitoring, analytics showcases.
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | telemetry category tag |
| `app_name` | string | ≤30 | product or service name |
| `status_pill` | string | ≤36 | operational status pill |
| `metric_1_label` | string | ≤30 | metric 1 title |
| `metric_1_value` | string | ≤16 | metric 1 primary stat |
| `metric_1_change` | string | ≤16 | metric 1 growth badge |
| `metric_2_label` | string | ≤30 | metric 2 title |
| `metric_2_value` | string | ≤16 | metric 2 primary stat |
| `metric_2_change` | string | ≤16 | metric 2 growth badge |
| `metric_3_label` | string | ≤30 | metric 3 title |
| `metric_3_value` | string | ≤16 | metric 3 primary stat |
| `metric_3_change` | string | ≤16 | metric 3 growth badge |
| `chart_label` | string | ≤40 | chart title |
| `takeaway` | string | ≤140 | platform performance conclusion |

---

## frame-ui-terminal-ide

**Role:** body — developer IDE editor. Visual Studio Code / Neovim style workspace with project tree sidebar, syntax-highlighted code editor, and live terminal output.
**Best for:** `type: "body"` — software engineering tutorials, SDK reveals, technical deep-dives, developer marketing.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | engineering category tag |
| `file_name` | string | ≤30 | active file name in tab and sidebar |
| `lang_tag` | string | ≤16 | language badge (e.g. "TYPESCRIPT", "RUST", "PYTHON") |
| `code_line_1` | string | ≤70 | code line 1 |
| `code_line_2` | string | ≤70 | code line 2 |
| `code_line_3` | string | ≤70 | code line 3 |
| `code_line_4` | string | ≤70 | code line 4 |
| `code_line_5` | string | ≤70 | code line 5 |
| `terminal_cmd` | string | ≤40 | terminal command string |
| `terminal_output` | string | ≤80 | execution test result / log output |
| `takeaway` | string | ≤120 | engineering takeaway headline |

---

## frame-math-manim

**Role:** body — mathematical and algorithmic theorem explainer. KaTeX/LaTeX-styled step-by-step formula derivations with coordinate grid background, animated function curve, and global minima proof inspired by 3Blue1Brown/Manim.
**Best for:** `type: "body"` — STEM education, algorithm breakdowns, loss function derivations, AI architecture math.
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤34 | small uppercase math category tag |
| `formula_title` | string | ≤60 | headline theorem/formula title |
| `step_1_label` | string | ≤30 | step 1 header |
| `step_1_math` | string | ≤80 | step 1 math formula string |
| `step_2_label` | string | ≤30 | step 2 header |
| `step_2_math` | string | ≤80 | step 2 math formula string |
| `step_3_label` | string | ≤30 | step 3 header |
| `step_3_math` | string | ≤80 | step 3 math formula string |
| `graph_label` | string | ≤30 | convergence rate badge text |
| `takeaway` | string | ≤140 | mathematical conclusion takeaway |

---

## frame-diagram-flowchart

**Role:** body — animated decision tree and workflow flowchart. Structured start node, decision diamond with glowing animated SVG branching paths (pass / block outcomes) inspired by Draw.io.
**Best for:** `type: "body"` — workflow explanation, risk gating, business logic, algorithmic decision trees.
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤34 | process category tag |
| `flowchart_title` | string | ≤60 | main workflow headline |
| `start_node` | string | ≤30 | entry trigger node label |
| `decision_node` | string | ≤30 | decision condition inside diamond |
| `branch_no_label` | string | ≤20 | green outcome branch tag |
| `branch_no_action` | string | ≤50 | pass action title |
| `branch_yes_label` | string | ≤20 | red outcome branch tag |
| `branch_yes_action` | string | ≤50 | block action title |
| `summary` | string | ≤140 | workflow efficiency summary |

---

## frame-whiteboard-doodle

**Role:** body — hand-drawn whiteboard sketch explainer. Rough sketch card borders, handwritten display typography, playful animated doodle cards and highlighter notes inspired by whiteboard animations.
**Best for:** `type: "body"` — educational listicles, common mistakes, beginner guides, storytelling lessons.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | lesson category tag |
| `lesson_title` | string | ≤60 | main lesson headline |
| `doodle_label_1` | string | ≤40 | point 1 header |
| `doodle_desc_1` | string | ≤70 | point 1 description |
| `doodle_label_2` | string | ≤40 | point 2 header |
| `doodle_desc_2` | string | ≤70 | point 2 description |
| `doodle_label_3` | string | ≤40 | point 3 header |
| `doodle_desc_3` | string | ≤70 | point 3 description |
| `takeaway` | string | ≤140 | key lesson takeaway |

---

## frame-fitness-workout

**Role:** body — workout breakdown and exercise routine card. Muscle group targeting tag, animated circular interval countdown timer, sets/reps telemetry, and pro coaching form tips.
**Best for:** `type: "body"` — gym & fitness tutorials, exercise breakdowns, sports coaching, health routines.
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤36 | workout program category tag |
| `exercise_name` | string | ≤50 | exercise movement name |
| `muscle_target` | string | ≤40 | targeted muscle anatomy |
| `reps_sets` | string | ≤30 | sets & repetition scheme |
| `timer_text` | string | ≤20 | rest countdown timer text |
| `intensity_level` | string | ≤30 | RPE / intensity rating |
| `form_tip` | string | ≤120 | coach technique instructions |
| `takeaway` | string | ≤140 | hypertrophy / conditioning takeaway |

---

## frame-canvas-gauge-dial

**Role:** body — analog/digital speedometer & telemetry dial. Circular gauge arc with sweeping LED needle, live digital metric readout, min/max thresholds and performance telemetry cards.
**Best for:** `type: "body"` — benchmark results, performance speed tests, throughput telemetry, hardware reviews.
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤34 | benchmark category tag |
| `dial_title` | string | ≤60 | performance test headline |
| `gauge_value` | string | ≤10 | large central digital readout |
| `gauge_unit` | string | ≤20 | measurement unit |
| `min_label` | string | ≤15 | minimum scale label |
| `max_label` | string | ≤15 | maximum scale label |
| `status_badge` | string | ≤36 | status rating badge |
| `spec_1_label` | string | ≤24 | auxiliary metric 1 name |
| `spec_1_val` | string | ≤20 | auxiliary metric 1 value |
| `spec_2_label` | string | ≤24 | auxiliary metric 2 name |
| `spec_2_val` | string | ≤20 | auxiliary metric 2 value |
| `takeaway` | string | ≤140 | benchmark summary takeaway |

---

## frame-3d-perspective-card

**Role:** body / showcase — 3D spatial perspective card. Dynamic 3D gyro tilt transformation with metallic sheen reflection, floating NFC/VIP chips, and security feature cards inspired by Three.js depth cards.
**Best for:** `type: "body"` — premium fintech cards, membership tiers, hardware crypto wallets, cybersecurity features.
**Motion:** dimensional · continuous loop

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤34 | security category tag |
| `card_title` | string | ≤40 | product / card name |
| `card_tier` | string | ≤30 | tier badge |
| `feature_1` | string | ≤60 | highlight feature 1 |
| `feature_2` | string | ≤60 | highlight feature 2 |
| `feature_3` | string | ≤60 | highlight feature 3 |
| `card_chip` | string | ≤20 | card chip status badge |
| `card_id` | string | ≤20 | masked card number / serial |
| `takeaway` | string | ≤140 | enterprise value takeaway |

---

## frame-presentation-slide

**Role:** body — executive presentation slide & pitch deck. Keynote-style structured slide layout with slide numbering, 3 bullet cards with top accent colors, speaker badge, and takeaway summary.
**Best for:** `type: "body"` — pitch decks, corporate presentations, quarterly business reviews, strategic plans.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤34 | report category kicker |
| `slide_title` | string | ≤60 | main slide headline |
| `slide_num` | string | ≤20 | slide page index (e.g. "SLIDE 04 / 12") |
| `presenter_tag` | string | ≤36 | speaker bio / title tag |
| `bullet_1_title` | string | ≤40 | bullet 1 headline |
| `bullet_1_desc` | string | ≤70 | bullet 1 description |
| `bullet_2_title` | string | ≤40 | bullet 2 headline |
| `bullet_2_desc` | string | ≤70 | bullet 2 description |
| `bullet_3_title` | string | ≤40 | bullet 3 headline |
| `bullet_3_desc` | string | ≤70 | bullet 3 description |
| `takeaway` | string | ≤140 | strategic executive takeaway |

---

## frame-2d-sprite-mascot

**Role:** body / engagement — animated 2D sprite mascot character. Lively idle bouncing avatar with comic speech bubble dialog, action step card and tip badge.
**Best for:** `type: "body"` — tips & tricks, interactive tutorials, software onboarding, engaging social shorts.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤34 | mascot category tag |
| `topic_title` | string | ≤60 | main topic headline |
| `speech_bubble` | string | ≤90 | dialog text in speech balloon |
| `mascot_name` | string | ≤24 | assistant / mascot name |
| `mascot_emoji` | string | ≤4 | avatar emoji or character glyph |
| `tip_badge` | string | ≤16 | action callout badge |
| `action_step` | string | ≤60 | keyboard shortcut / actionable command |
| `takeaway` | string | ≤140 | engagement takeaway |

---

## What 3D actually costs

The plan for these four assumed Chrome would raster `preserve-3d` more slowly and that the
number belonged in this file. It was measured, and **the assumption was wrong**. Six-second
9:16 renders at 30 fps, same machine, back to back, each template fed its own declared
defaults:

| template | 3D | render | mp4 |
| --- | --- | --- | --- |
| `frame-3d-stack` | yes | 10.0 s | 203 KB |
| `frame-3d-device` | yes | 11.2 s | 543 KB |
| `frame-3d-spotlight` | yes | 11.4 s | **822 KB** |
| `frame-3d-flip` | yes | 11.6 s | 262 KB |
| `frame-checklist` | no | 10.6 s | 345 KB |
| `frame-step-list` | no | 12.3 s | 391 KB |
| `frame-quote-testimonial` | no | 16.9 s | 244 KB |

Perspective on a handful of flat layers is nothing next to the ~10 s of npx and Chrome startup
that every render pays. The four 3D templates occupy 10.0–11.6 s; the **slowest render in the
set is a flat one**. **3D is not the expensive part.**

The cost that is real sits in the last column, and it still has nothing to do with 3D:
`frame-3d-spotlight` is 2–3× the bytes of its neighbours because a full-frame gradient that
moves continuously changes every pixel in every frame, so there is nothing for the encoder to
reuse. `frame-3d-device`, whose mockup never stops turning, pays the same way. That is the
trade worth knowing — bytes, not milliseconds — and it applies to any template with permanent
full-frame motion, 3D or not.

> **Measure with real inputs.** The first version of this table read 17–38 KB and claimed
> `frame-3d-spotlight` was 25–55× the size of everything else. Those renders were made with
> `inputs: {}`, which produces **blank frames** — a template's `data-composition-variables` are
> editor defaults and do not reach the renderer on their own. An empty 1080×1920 video
> compresses to almost nothing, so the table was comparing degrees of emptiness. The ratio was
> off by an order of magnitude and the conclusion it supported was not the true one. The same
> trap is documented at the top of `scripts/video/template-sheet.mjs`; it caught this file too.

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

## frame-vox-declassified

**Role:** body / investigation. Classified government & corporate leak document with animated declassification reveal.
**Best for:** Vox-style investigative documentaries, whistleblower reports, AI safety audit leaks.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | investigative department tag |
| `stamp` | string | ≤24 | red top-secret / declassified stamp text |
| `doc_title` | string | ≤50 | formal leaked document headline |
| `case_id` | string | ≤24 | reference file code |
| `date_issued` | string | ≤30 | publication / incident date |
| `body_paragraph_1` | string | ≤120 | leading background context |
| `highlight_leak` | string | ≤60 | secret text revealed from beneath black redact bar |
| `body_paragraph_2` | string | ≤120 | forensic trail and discovery |
| `takeaway` | string | ≤100 | bottom summary bar |

---

## frame-vox-newspaper-tear

**Role:** body / print editorial. Vintage broadsheet newspaper excerpt with classic masthead, lead quote, and dual-column report.
**Best for:** historical retrospectives, major industry milestones, investigative press reviews.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `publication_name` | string | ≤32 | newspaper masthead title |
| `issue_date` | string | ≤40 | issue date and volume number |
| `headline` | string | ≤60 | all-caps front page headline |
| `lead_quote` | string | ≤90 | highlighted yellow editorial pull quote |
| `column_left` | string | ≤120 | left journalistic column |
| `column_right` | string | ≤120 | right journalistic column |
| `editor_note` | string | ≤70 | bottom editorial footnote |

---

## frame-geo-heatmap

**Role:** body / geo data. Dynamic heat distribution map across geographic regions with density telemetry.
**Best for:** market demand hotspots, regional economic comparisons, compute cluster distribution.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | category tag |
| `map_title` | string | ≤50 | heatmap title |
| `zone_1_name` | string | ≤40 | region 1 name |
| `zone_1_val` | string | ≤30 | region 1 metric / density |
| `zone_2_name` | string | ≤40 | region 2 name |
| `zone_2_val` | string | ≤30 | region 2 metric / growth |
| `zone_3_name` | string | ≤40 | region 3 name |
| `zone_3_val` | string | ≤30 | region 3 metric / share |
| `takeaway` | string | ≤100 | bottom strategic takeaway |

---

## frame-geo-sonar-radar

**Role:** body / tactical tracking. Military satellite radar sweep dish with real GPS coordinates and target lock-on blips.
**Best for:** global telemetry, subsea cable tracking, satellite network monitoring, tactical briefings.
**Motion:** conic · continuous loop

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤35 | tactical system banner |
| `radar_title` | string | ≤50 | radar mission headline |
| `coords_1` | string | ≤50 | target 1 latitude/longitude & name |
| `status_1` | string | ≤40 | target 1 connection status & bandwidth |
| `coords_2` | string | ≤50 | target 2 latitude/longitude & name |
| `status_2` | string | ≤40 | target 2 lock status & latency |
| `scan_frequency` | string | ≤40 | radar sweep band and radius |
| `takeaway` | string | ≤100 | tactical summary bar |

---

## frame-math-graph-plot

**Role:** body / math explainer. 3Blue1Brown/Manim animated function curve with Oxy coordinate axes and tangent derivative slope.
**Best for:** calculus tutorials, machine learning gradient loss curves, optimization theory, academic STEM explainers.
**Motion:** draw-on

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | academic topic tag |
| `formula_title` | string | ≤50 | main theorem / curve topic |
| `latex_func` | string | ≤40 | original mathematical function f(x) |
| `latex_derivative` | string | ≤40 | first derivative f'(x) = 0 |
| `critical_point_1` | string | ≤40 | local maximum coordinates & value |
| `critical_point_2` | string | ≤40 | local minimum coordinates & value |
| `summary` | string | ≤110 | analytical geometric conclusion |

---

## frame-math-matrix-calc

**Role:** body / linear algebra. Animated matrix transformation with tensor multiplication brackets and dot product evaluation.
**Best for:** AI neural network weights, 3D graphics transformation matrices, linear algebra proofs.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤35 | linear algebra topic banner |
| `matrix_title` | string | ≤50 | vector space transform title |
| `matrix_a_label` | string | ≤30 | weight matrix W label & dimension |
| `matrix_a_vals` | string | ≤35 | matrix W components string |
| `vector_x_label` | string | ≤30 | input vector X label & dimension |
| `vector_x_vals` | string | ≤25 | vector X components string |
| `result_label` | string | ≤30 | output product vector Y label |
| `result_vals` | string | ≤25 | output vector result string |
| `takeaway` | string | ≤110 | geometric transformation explanation |

---

## frame-hybrid-vox-geo

**Role:** body / multi-skill hybrid. Dual-pane layout combining Vox investigative journalism on the left with GPS satellite radar map on the right.
**Best for:** high-production documentary shorts, investigative tech exposes, geopolitical deep dives.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤40 | multi-skill header banner |
| `hybrid_title` | string | ≤50 | investigative master headline |
| `vox_headline` | string | ≤40 | left pane editorial headline |
| `vox_excerpt` | string | ≤90 | left pane document excerpt |
| `vox_highlight` | string | ≤40 | left pane yellow highlight banner |
| `geo_target_label` | string | ≤30 | right pane satellite target label |
| `geo_coords` | string | ≤40 | right pane GPS latitude/longitude |
| `geo_status` | string | ≤40 | right pane thermal/signal telemetry |
| `takeaway` | string | ≤110 | combined cross-source conclusion |

---

## frame-hybrid-math-diagram

**Role:** body / multi-skill hybrid. Dual-pane layout combining system architecture flowchart nodes on the left with Manim gradient calculus formulas on the right.
**Best for:** deep-learning backpropagation explainers, algorithm performance analysis, quantitative trading engineering.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤40 | multi-skill engineering banner |
| `hybrid_title` | string | ≤50 | algorithm & mathematics headline |
| `step_1_node` | string | ≤50 | flowchart forward pass node |
| `step_2_node` | string | ≤40 | flowchart loss calculation node |
| `step_3_node` | string | ≤40 | flowchart backpropagation node |
| `math_formula_main` | string | ≤40 | matrix gradient equation |
| `math_update_rule` | string | ≤40 | parameter update rule formula |
| `learning_rate` | string | ≤40 | optimization hyperparameter metrics |
| `takeaway` | string | ≤110 | engineering & calculus synergy summary |

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

---

## frame-stock-candlestick
**Role:** body / data visualization (fintech). Realtime candlestick chart with breakout resistance line, volume surge bars and technical indicator badge.
**Best for:** stock, crypto, technical analysis, price action breakouts.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `ticker` | string | ≤12 | e.g. "BTC/USDT" |
| `price` | string | ≤16 | e.g. "$96,450.00" |
| `change` | string | ≤10 | e.g. "+14.2%" |
| `kicker` | string | ≤24 | uppercase category label |
| `headline` | string | ≤40 | main takeaway title |
| `res_level` | string | ≤16 | resistance level label |
| `indicator` | string | ≤40 | RSI, MACD, Volume stats |
| `summary` | string | ≤80 | key interpretation summary |

---

## frame-crypto-orderbook
**Role:** body / data visualization (fintech). Dual-column live orderbook with bids, asks, spread badge, and depth sentiment indicator.
**Best for:** explaining liquidity walls, whale accumulation, and orderflow dynamics.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `pair` | string | ≤16 | e.g. "ETH / USDT" |
| `spread` | string | ≤30 | spread metrics |
| `bids_title` | string | ≤20 | column heading for bids |
| `asks_title` | string | ≤20 | column heading for asks |
| `bids` | string | — | pipe-separated "price:amount" pairs |
| `asks` | string | — | pipe-separated "price:amount" pairs |
| `insight` | string | ≤80 | key takeaway insight |

---

## frame-wealth-compound
**Role:** body / data visualization (fintech). Exponential compound interest curves comparing early vs late investing over time.
**Best for:** personal finance, compound interest, retirement planning, opportunity cost.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | big title |
| `subline` | string | ≤60 | premise description |
| `person_a` | string | ≤30 | outcome label for early investor |
| `person_b` | string | ≤30 | outcome label for late investor |
| `delta` | string | ≤50 | mathematical difference badge |
| `rule` | string | ≤80 | rule of thumb conclusion |

---

## frame-portfolio-donut
**Role:** body / data visualization (fintech). Asset allocation donut chart with dynamic legend and PnL performance badge.
**Best for:** investment portfolio breakdown, risk distribution, financial balance.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `title` | string | ≤36 | title |
| `total_pnl` | string | ≤24 | PnL profit badge |
| `total_label` | string | ≤16 | center label |
| `items` | string | — | pipe-separated "Asset:Percentage" |
| `verdict` | string | ≤80 | risk / asset analysis verdict |

---

## frame-inflation-purchasing-power
**Role:** body / data visualization (fintech). 3-decade purchasing power erosion comparison cards.
**Best for:** inflation warnings, cash depreciation, real purchasing power.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | punchy headline |
| `subline` | string | ≤60 | explanatory subline |
| `era_1` | string | ≤40 | first era purchasing power |
| `era_2` | string | ≤40 | second era purchasing power |
| `era_3` | string | ≤40 | modern era purchasing power |
| `insight` | string | ≤80 | core lesson / financial takeaway |

---

## frame-iceberg-levels
**Role:** body / explainer (science & psychology). 3-stage underwater iceberg descent (surface facts → hidden mechanisms → deep root causes).
**Best for:** deep secrets, unseen efforts, iceberg theories, hidden mechanisms.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | top title |
| `tag_surface` | string | ≤24 | surface tier badge |
| `level_1` | string | ≤60 | visible surface facts |
| `tag_middle` | string | ≤24 | middle tier badge |
| `level_2` | string | ≤60 | hidden mechanisms |
| `tag_deep` | string | ≤24 | deep tier badge |
| `level_3` | string | ≤60 | fundamental root cause |
| `takeaway` | string | ≤80 | concluding philosophy |

---

## frame-brain-synapse
**Role:** body / explainer (science & psychology). Neural network synapse activation with molecule badges and trigger-reaction mapping.
**Best for:** dopamine addiction, habit loops, cognitive psychology, neuroscience.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `molecule` | string | ≤30 | chemical compound badge |
| `node_1` | string | ≤20 | synapse phase 1 |
| `node_2` | string | ≤20 | synapse phase 2 |
| `node_3` | string | ≤20 | synapse phase 3 |
| `trigger` | string | ≤60 | environmental trigger |
| `reaction` | string | ≤60 | neurological reaction |
| `warning` | string | ≤80 | warning takeaway |

---

## frame-habit-loop
**Role:** body / explainer (science & psychology). 4-quadrant rotating habit cycle (Cue → Craving → Response → Reward).
**Best for:** habit formation, self-improvement, productivity frameworks.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `cue` | string | ≤50 | step 1 cue |
| `craving` | string | ≤50 | step 2 craving |
| `response` | string | ≤50 | step 3 action |
| `reward` | string | ≤50 | step 4 reward |
| `key_point` | string | ≤80 | actionable advice |

---

## frame-dna-helix-breakdown
**Role:** body / explainer (science & technology). DNA genetic breakdown with highlighted target gene mutation.
**Best for:** CRISPR, biotechnology, genetics, medical breakthroughs.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `target_gene` | string | ≤30 | gene target label |
| `mechanism` | string | ≤60 | biological mechanism |
| `application` | string | ≤60 | practical application |
| `impact` | string | ≤80 | long-term global impact |

---

## frame-bell-curve-iq
**Role:** body / explainer (science & psychology). Gaussian normal distribution curve with Dunning-Kruger markers.
**Best for:** cognitive biases, intelligence distribution, psychology concepts.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `low_group` | string | ≤50 | peak of mount stupid |
| `mid_group` | string | ≤50 | valley of despair |
| `high_group` | string | ≤50 | slope of enlightenment |
| `lesson` | string | ≤80 | key philosophical lesson |

---

## frame-magnates-polaroid-desk
**Role:** body / documentary (investigative). Detective desk with pinned Polaroid photos and red conspiracy yarn.
**Best for:** business wars, corporate scandals, financial investigations.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | headline |
| `case_no` | string | ≤30 | confidential case stamp |
| `target_a` | string | ≤40 | character A description |
| `target_b` | string | ≤40 | entity B description |
| `connection` | string | ≤50 | secret link / money transaction |
| `verdict` | string | ≤80 | investigative conclusion |

---

## frame-stock-ticker-tape
**Role:** body / documentary (breaking news). Amber LED dot-matrix scrolling ticker with breaking market alerts.
**Best for:** Wall Street panics, breaking market crashes, emergency news.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `breaking` | string | ≤30 | breaking badge |
| `ticker_feed` | string | ≤80 | ticker tape string |
| `headline` | string | ≤40 | main breaking headline |
| `context` | string | ≤80 | historical / market context |

---

## frame-timeline-war-era
**Role:** body / documentary (historical). Burnt parchment historical timeline with pulsing chronological milestones.
**Best for:** wars, economic crises, historical eras, corporate evolutions.
**Motion:** mechanical · continuous loop

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | timeline title |
| `event_1` | string | ≤60 | historical event 1 |
| `event_2` | string | ≤60 | historical event 2 |
| `event_3` | string | ≤60 | historical event 3 |
| `conclusion` | string | ≤80 | historical lesson |

---

## frame-document-redacted
**Role:** body / documentary (classified). Declassified secret report where black ink redaction evaporates.
**Best for:** secret agreements, leaks, exclusive investigation findings.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `classification` | string | ≤30 | top secret stamp |
| `doc_title` | string | ≤40 | internal document title |
| `secret_text` | string | ≤60 | revealed secret clause |
| `revealed_info` | string | ≤80 | context elaboration |
| `summary` | string | ≤80 | summary statement |

---

## frame-money-flow-conduit
**Role:** body / documentary (corporate). Animated offshore currency flow through intermediary shell companies.
**Best for:** tax avoidance schemes, money flow, venture capital pipelines.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `source_entity` | string | ≤30 | origin entity |
| `conduit_entity` | string | ≤30 | intermediary tax haven entity |
| `tax_haven` | string | ≤30 | destination offshore haven |
| `savings` | string | ≤50 | tax reduction metrics badge |

---

## frame-tier-list
**Role:** body / gamification (viral ranking). S-A-B-C-D tier board for ranking tools, tech stacks, or strategies.
**Best for:** ranking videos, top AI tools, tier lists, controversial rankings.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `tier_s` | string | ≤60 | S-tier items |
| `tier_a` | string | ≤60 | A-tier items |
| `tier_b` | string | ≤60 | B-tier items |
| `verdict` | string | ≤80 | ranking takeaway |

---

## frame-notification-stack
**Role:** hook / viral (social proof). Rapid-fire cascading push notifications on a smartphone lock screen.
**Best for:** high-conversion hooks, proof of sales, viral growth metrics.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `phone_time` | string | ≤6 | clock time e.g. "09:41" |
| `noti_1` | string | ≤60 | payment notification |
| `noti_2` | string | ≤60 | social viral alert |
| `noti_3` | string | ≤60 | community growth alert |
| `proof_hook` | string | ≤80 | credibility hook |

---

## frame-poll-voting
**Role:** body / engagement (interactive). Tug-of-war community voting poll with dynamic percentage bars.
**Best for:** driving comments, controversial choices, Option A vs Option B.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `question` | string | ≤40 | poll question |
| `option_a` | string | ≤40 | option A text + percentage |
| `option_b` | string | ≤40 | option B text + percentage |
| `cta` | string | ≤80 | call to action prompt |

---

## frame-speedrun-timer
**Role:** body / viral (high urgency). Millisecond speedrun challenge timer with milestone checklist.
**Best for:** speedrun tutorials, 60-second build challenges, urgency triggers.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | challenge title |
| `timer_display` | string | ≤12 | e.g. "00:48.24" |
| `milestone_1` | string | ≤50 | milestone 1 |
| `milestone_2` | string | ≤50 | milestone 2 |
| `milestone_3` | string | ≤50 | milestone 3 |
| `outcome` | string | ≤80 | record outcome badge |

---

## frame-card-pack-opening
**Role:** body / gamification (gacha). Holographic card pack opening revealing a rare item card.
**Best for:** feature reveals, major product drops, super skills.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | headline |
| `card_name` | string | ≤30 | card name |
| `power_stat` | string | ≤30 | power level metric |
| `attribute` | string | ≤40 | category / elemental attribute |
| `rarity` | string | ≤30 | rarity badge (e.g. "ULTRA RARE") |

---

## frame-saas-pricing-tier
**Role:** body / SaaS (conversion). 3-tier pricing table with glowing "Most Popular" plan highlight.
**Best for:** SaaS product demos, pricing breakdowns, business models.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `plan_free` | string | ≤50 | free plan details |
| `plan_pro` | string | ≤50 | pro plan details |
| `plan_ent` | string | ≤50 | enterprise plan details |
| `highlight_note` | string | ≤80 | recommendation badge |

---

## frame-api-request-response
**Role:** body / dev (technical). Dual JSON code inspector showing request/response payload with latency timer.
**Best for:** API architecture, backend services, latency comparisons.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `endpoint` | string | ≤40 | HTTP method & endpoint |
| `status_code` | string | ≤20 | status code & latency |
| `req_payload` | string | — | request JSON payload |
| `res_payload` | string | — | response JSON payload |
| `insight` | string | ≤80 | performance takeaway |

---

## frame-diff-code-editor
**Role:** body / dev (code optimization). Code diff view comparing slow red deleted code with fast green additions.
**Best for:** code refactoring, performance optimization, AI coding tips.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `file_name` | string | ≤30 | filename tag |
| `before_code` | string | ≤80 | red deleted line |
| `after_code` | string | ≤80 | green added line |
| `perf_gain` | string | ≤80 | speed improvement metric |

---

## frame-git-branch-graph
**Role:** body / dev (DevOps). Git branch commit tree tracking feature, staging and main branches.
**Best for:** DevOps workflows, release strategies, CI/CD explanations.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `branch_main` | string | ≤40 | production branch |
| `branch_staging` | string | ≤40 | staging / CI branch |
| `branch_feature` | string | ≤40 | active feature branch |
| `status` | string | ≤80 | automated merge status |

---

## frame-ai-benchmark-leaderboard
**Role:** body / AI tech (benchmarks). Horizontal race bar chart comparing LLM models on standardized benchmarks.
**Best for:** LLM launches, AI model comparisons, benchmark scores.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `benchmark_name` | string | ≤40 | benchmark title badge |
| `rank_1` | string | ≤40 | model 1 score |
| `rank_2` | string | ≤40 | model 2 score |
| `rank_3` | string | ≤40 | model 3 score |
| `verdict` | string | ≤80 | victory takeaway |

---

## frame-pros-cons-scale
**Role:** body / review (honest evaluation). Balance scale comparing weighted pros vs cons.
**Best for:** product reviews, buying guides, balanced verdicts.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | review title |
| `pros_title` | string | ≤30 | pros heading |
| `pros_list` | string | ≤100 | bulleted pros |
| `cons_title` | string | ≤30 | cons heading |
| `cons_list` | string | ≤100 | bulleted cons |
| `verdict` | string | ≤80 | final buying recommendation |

---

## frame-receipt-slip
**Role:** body / review (transparent costs). Sliding thermal receipt slip breaking down genuine costs and hidden fees.
**Best for:** pricing transparency, true cost of ownership, budgeting.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `store_name` | string | ≤30 | receipt title header |
| `item_1` | string | ≤40 | item line 1 |
| `item_2` | string | ≤40 | item line 2 |
| `item_3` | string | ≤40 | item line 3 |
| `total` | string | ≤30 | total line |
| `advice` | string | ≤80 | cost-saving tip |

---

## frame-unboxing-specs
**Role:** body / review (hardware specs). 4-corner specification grid highlighting hardware metrics.
**Best for:** smartphones, laptops, hardware gadgets, unboxings.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `product_name` | string | ≤40 | product name |
| `spec_chip` | string | ≤40 | processor spec |
| `spec_battery` | string | ≤40 | battery / charging spec |
| `spec_screen` | string | ≤40 | display spec |
| `spec_weight` | string | ≤40 | form factor spec |
| `verdict` | string | ≤80 | hardware summary |

---

## frame-radar-rating-star
**Role:** body / review (scorecard). 5-criterion star rating scorecard with aggregated overall score badge.
**Best for:** app reviews, restaurant reviews, course reviews, product teardowns.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | title |
| `crit_1` | string | ≤40 | criterion 1 rating |
| `crit_2` | string | ≤40 | criterion 2 rating |
| `crit_3` | string | ≤40 | criterion 3 rating |
| `crit_4` | string | ≤40 | criterion 4 rating |
| `overall_badge` | string | ≤60 | overall score badge |

---

## frame-discount-coupon-tear
**Role:** outro / e-commerce (special offer). Serrated discount coupon voucher tearing in half with promo code.
**Best for:** special discount CTAs, limited time offers, conversion promos.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `headline` | string | ≤40 | offer headline |
| `discount` | string | ≤20 | discount tag e.g. "-50% OFF" |
| `code` | string | ≤30 | promo coupon code |
| `condition` | string | ≤60 | eligibility condition |
| `cta` | string | ≤80 | call to action link instruction |

---

## frame-meme

**Role:** body / change of energy. A meme as the whole scene, in its own colours.
**Best for:** breaking the rhythm. A run of text frames and stock B-roll is one tone for
ninety seconds; a meme costs one scene and resets the viewer's attention.
**Needs a `media` block** with `source: "meme"` — see `docs/15-media-sources.md`.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `chip` | string | ≤22 | pill top-left. Emoji fine. Empty removes it |
| `kicker` | string | ≤30 | cyan uppercase label. 28 chars already reaches the right edge |
| `caption` | string | ≤90 | the line under the meme; wraps to 3 lines with room to spare |
| `media_kind` | string | — | set by the pipeline (`image`/`video`). Do not hand-set |

```json
"media": { "kind": "image", "source": "meme", "id": "drake|Viết tay|Dùng agent", "fit": "contain" }
```

> **`"fit": "contain"` is required and the validator enforces it.** `fit` defaults to
> `cover`, which crops the image to fill the frame — and a meme's text runs to its own
> edges, so cover takes the punchline with it. The crop happens in `normalizeImage`, before
> this template sees the file, and the render then succeeds with a full frame: nothing
> downstream can tell.

> **The meme is never filtered or tinted**, unlike `frame-media-inset` which tints its media
> into the palette on purpose. A meme recoloured to match a dark brand palette is no longer
> the meme — its colour is part of how the joke lands. The frame around it is themed; the
> image is not.

> **Keep each meme line short.** memegen fits text to ONE line inside the template's own text
> box; a line that wraps has its second half clipped off. How much fits depends on which meme
> template — `drake` (two half-width panels) wraps at about 15 Vietnamese characters, while
> `afraid` (full-width box) takes 23. There is no number to look up:
> `node scripts/media/meme-search.mjs --render "…" --out /tmp/m.png` and open it.

---

## frame-vox-photo-grid

**Role:** body / visual journalism. Up to four pictures at once, each with its own caption.
**Best for:** the Vox register — showing several pieces of evidence together rather than one
at a time. A satellite frame beside three photographs says more in one scene than four scenes
of one picture each.
**Needs a `media` ARRAY** — this is the only template that draws more than the first entry.

| slot | type | limit | notes |
| --- | --- | --- | --- |
| `kicker` | string | ≤30 | cyan uppercase label |
| `headline` | string | ≤60 | serif headline above the grid |
| `cap_1`…`cap_4` | string | ≤60 | caption per cell; a cell with no picture is **removed**, not left blank |
| `takeaway` | string | ≤110 | the line under the grid, cyan rule |
| `source` | string | ≤50 | citation |
| `media_count` | string | — | set by the pipeline. Do not hand-set |
| `media_kinds` | string | — | set by the pipeline (`video,image,image,…`). Do not hand-set |

```json
"media": [
  { "kind": "video", "source": "geo",    "id": "45.3792,12.3311" },
  { "kind": "image", "source": "pexels", "query": "abandoned hospital corridor" },
  { "kind": "image", "source": "manual", "ref": "ai-ward" }
]
```

> **A cell can be a clip or a still, and it has to be told which.** `media_kinds` exists
> because a grid routinely mixes a satellite flythrough with photographs. Detecting it by
> loading an `<img>` and swapping to `<video>` on error would change the element mid-render —
> and hyperframes seeks frame by frame, so the swapped frame renders blank.

> **Each cell drifts on its own period** (13–19s, alternating) with one slow sheen across the
> grid. The content layer still settles by ~2s so the captions stay readable. See
> `skills/motion-craft/SKILL.md` §"Two layers".
