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

## frame-bold-poster

**Role:** hook / strong statement. 1970s editorial poster — giant red figure,
3-line tilted headline (middle line auto-red), serif standfirst.
**Best for:** the opening hook, or a punchy single-claim body beat.

| slot           | type     | limit                    | notes                                                |
| -------------- | -------- | ------------------------ | ---------------------------------------------------- |
| `kicker`       | string   | ≤24                      | small uppercase label, top-left (e.g. "AI Coding")   |
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
| `source`  | string | ≤40   | "Nguồn: <domain>"                                                      |

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
| `primary_url` | string | ≤40   | footer URL / source (e.g. "https://aicodingvn.vercel.app/") |

---

## frame-liquid-bg-hero

**Role:** hook / hero (**default hook**). "Aurora Violet" — deep-indigo canvas
with large soft floating colour blobs + faint grid; a centred white headline,
subheadline and a rounded CTA pill.
**Best for:** the opening hook (`type: "hook"`) — a modern, premium intro.

| slot          | type   | limit | notes                                              |
| ------------- | ------ | ----- | -------------------------------------------------- |
| `kicker`        | string | ≤24  | small uppercase label, top-left (e.g. "AI Coding")            |
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

Or pull one from the upstream registry — 146 items, no hand-copying:

```bash
node scripts/video/add-template.mjs --list
node scripts/video/add-template.mjs --preset news
```

Only folders with a root `index.html` become scene templates. Registry *blocks* and
*components* ship `compositions/` only, so they land here as building material without
cluttering the list a script can choose from. See `docs/16-template-registry.md`.

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
