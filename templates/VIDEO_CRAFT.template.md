# {{AGENT_NAME}} — VIDEO CRAFT

> **Write this file in {{LANGUAGE}}** — the scripting subagent reads it as instructions.
> **Mandatory read before writing `script.json`.** Writer reads §1–§5.
> Reviewer scores by **§7**. Machine-checkable parts are enforced by
> `node scripts/video/validate-script.mjs`. See `docs/14-video-generation.md` for the method,
> and `video-templates/CATALOG.md` for every template's slots and character limits.

The split that makes this work: **you write text only.** The template owns every pixel of
design, layout and motion. Never try to art-direct through the text.

---

## §1. THE TWO TEXT CHANNELS — never mix them

Each scene carries two kinds of text, and they follow **opposite** rules:

| | `voiceText` (spoken) | `inputs` (on screen) |
|---|---|---|
| Read by | OmniVoice TTS, out loud | nobody — it is rendered |
| Numbers | **spelled out in words** — see §2 | keep pretty formatting: `5.5`, `82%`, `200MP` |
| Emoji / icons | **forbidden** | allowed, 0–1 per field |
| URLs | **forbidden** | fine |
| `→ & % $ # + =` | **forbidden** | fine |
| Ends with | `.` or `?` (gives TTS a natural pause) | no trailing punctuation needed |

The same fact appears in both channels, formatted differently. That is intended:

```
voiceText: "Camera hai trăm megapixel, sắc nét hơn hẳn thế hệ trước."
inputs.headline: "200MP"
```

> ⚠️ Emoji in a field that animates **character by character** shatters the animation.
> Today that means `hero` in `frame-build-minimal`. The validator fails on this.

---

## §2. VIETNAMESE TTS — spell every number out

Vietnamese TTS engines read numerals literally and get them wrong. `GPT 5.5` comes out as
*"năm rưỡi"* (five and a half) — simply the wrong words for a version number.
So in `voiceText`, **there is never a digit**.

> This applies to **every** provider, not just one. They fail on different numbers and in
> different ways, which is worse than failing consistently — a script that sounds fine on one
> voice can be wrong on the next. Spelling numbers out is what makes a script portable across
> providers, so the validator treats a digit in `voiceText` as an error, never a warning.

| Form | ✗ TTS misreads | ✓ write this |
|---|---|---|
| Decimal version | `GPT 5.5` → "năm rưỡi" | `GPT năm chấm năm` |
| Decimal figure | `82.7%` | `tám mươi hai phẩy bảy phần trăm` |
| Integer version | `iPhone 17` | `iPhone mười bảy` |
| Dotted version | `iOS 18.2` | `iOS mười tám chấm hai` |
| Spec | `200MP` | `hai trăm megapixel` |
| Battery | `5000mAh` | `năm nghìn miliampe giờ` |
| Tokens | `1M tokens` | `một triệu token` |
| Price VND | `21 triệu đồng` | `hai mươi mốt triệu đồng` |
| Price USD | `$5` | `năm đô la` (or `năm đô`) |
| Multiplier | `2x` | `gấp đôi` (more natural than "hai lần") |
| Percent | `30%` | `ba mươi phần trăm` |
| Duration | `60 giây` | `sáu mươi giây` |
| Ratio | `3:1` | `ba trên một` / `ba so với một` |

- Decimal separator: say `chấm` (natural) or `phẩy` (formal) — pick one and stay consistent.
- English acronyms: `AI` / `GPT` usually read fine. If one comes out wrong, write it
  phonetically: `API` → `ây pi ai`.
- Brand names (Apple, OpenAI, TikTok) stay as they are.

> **Changing voice?** Run `node scripts/video/tts-check.mjs` first and listen to the sample —
> different providers mispronounce different things. The narration is re-generated
> automatically when you change provider or voice, so you never have to clear a cache by hand.

> Adapting this kit to another language? Replace this whole section with that language's
> TTS failure modes, and update the digit rule in `scripts/video/lib/validate.mjs`.

---

## §3. PACING & MARKETING RETENTION — the thing that stops a video feeling slow

| Rule | Target |
|---|---|
| Scenes | **8–14** (1 hook + 6–12 body + 1 outro) |
| Total narration | **270–450 words ≈ 90–150 seconds** |
| Each body scene | **25–40 words**, one single idea |
| Time on screen | ~6–10 seconds per scene |

**Keep the total duration, cut it into more scenes.** A 100-second video in 6 scenes is
boring; the same 100 seconds in 10 scenes moves. If a paragraph contains two ideas,
**split it into two scenes** rather than cramming both into one.

### The 4 High-Retention Hook Archetypes (The first 3 seconds)
The hook owns whether someone stops scrolling or swipes away. Lead with one of these 4 proven agency archetypes:

1. **Contrarian / Paradox Hook**: Overturns conventional wisdom immediately.
   - *Example:* *"90% lập trình viên đang dùng AI sai cách mà không nhận ra."*
2. **Negative / Loss-Aversion Hook**: Triggers protection reflex and urgent curiosity.
   - *Example:* *"Đừng nâng cấp phần mềm này trước khi biết 3 rủi ro sau."*
3. **Curiosity Gap / Investigative Mystery**: Creates an open loop that demands payoff.
   - *Example:* *"Tài liệu nội bộ vừa bị lộ tiết lộ sự thật đằng sau con số mười tỷ đô."*
4. **Stat Shock / Proof-First Hook**: Drops an undeniable massive number on screen in second one.
   - *Example:* *"Tốc độ tự động hóa vừa tăng vọt gấp ba lần chỉ trong một đêm."*

### Pattern Interrupts (Every 8–12 seconds)
Never let two identical scene textures sit side-by-side. A viewer's brain tunes out after 8 seconds of continuous slide reading. Alternate between:
- Text statement → Visual Infographic / Stat (`frame-chart-bars` / `frame-vox-data-callout`)
- Claim → Direct Document Evidence (`frame-vox-highlighter` / `frame-screenshot`)
- Data → Real-world Location / Footage (`frame-geo-local-card` / `frame-broll`)

---

## §4. CHOOSING A TEMPLATE PER SCENE

Read `video-templates/CATALOG.md` for the exact slots. **Only use a `templateId` that
exists there** — the validator checks against the folder on disk.

| Scene is… | Use |
|---|---|
| the opening hook (general) | `frame-liquid-bg-hero`, `frame-bold-poster`, or `frame-3d-spotlight` |
| investigative / documentary hook | `frame-vox-collage` (archival document + stamp) |
| breaking news hook | `frame-glitch-title` |
| search query / AI Answer hook | `frame-geo-faq-direct` (search box + instant answer) |
| local place / geography hook | `frame-geo-markers` |
| citing official document / leaked report | `frame-vox-highlighter` (yellow marker sweep) |
| technical stat breakdown with pointer lines | `frame-vox-data-callout` |
| one number / stat to land | `frame-pentagram-stat` (dark neon) or `frame-vignelli` (charcoal + red) |
| multi-region market comparison | `frame-geo-region-stat` (regional choropleth + progress bars) |
| local cafe / business / destination review | `frame-geo-local-card` (rating 4.9⭐, address, highlight pills) |
| a strong multi-line claim + big figure | `frame-bold-poster` |
| a short verdict around one keyword | `frame-build-minimal` (1 big word) |
| a slogan / creative line | `frame-creative-voltage` |
| a **list** of 2–5 things | `frame-aicoding-list` or `frame-step-list` |
| **exactly two** things compared | `frame-aicoding-comparison` or `frame-split-compare` |
| the closing card | `frame-logo-outro` (default) or `frame-statement-outro` |

**Vary them.** Reusing one template for every body beat makes the video look like a
slideshow. The validator warns above {{MAX_SAME_TEMPLATE|2}} uses of the same template.
If several scenes are all numbers, alternate `frame-vignelli`, `frame-vox-data-callout`,
and `frame-pentagram-stat`, and drop a `frame-build-minimal` in between.

---

## §4b. FOOTAGE — when a scene should show something real

A scene can carry a `media` block: a stock clip, or a screenshot of the page you are citing.
Used well it stops the video looking like slides read aloud. Used badly it looks like a
perfume advert with a voiceover.

| The scene… | Use |
|---|---|
| carries a **number** | a text template — always. Footage makes a statistic unreadable. |
| **is** a moment or a mood | `frame-broll` — footage full-bleed, one line over it |
| has a point the **words** carry, and footage illustrates it | `frame-media-inset` |
| **cites a page** the viewer might doubt | `frame-screenshot` — the real page, as evidence |

Three rules that decide whether it helps:

1. **Describe the picture, not the concept.** `"data center servers"` returns usable footage.
   `"artificial intelligence"` returns generic blue swirls. The search engine matches words a
   contributor typed, not your meaning.
2. **Read what the clip actually is before pinning it.** `stock-search.mjs` prints each
   clip's own description. A query for `breaking news screen` will cheerfully return a cup of
   coffee — that exact mistake shipped once.
3. **Seasoning, not the meal.** More than about a third of scenes on footage and the piece
   stops reading as a news video.

**Then look at it.** `node scripts/video/contact-sheet.mjs <dir>/video.mp4` puts one labelled
frame per scene in a single image. Nothing in the validator can tell you a clip is off-topic.

---

## §5. VOICE — how {{AGENT_NAME}} sounds

{{Describe the narration voice in 3–6 bullets: person, energy, sentence length,
what it never does. This is the video equivalent of WRITING_CRAFT §2.}}

- {{e.g. Speaks to one person, not an audience. "bạn", never "các bạn".}}
- {{e.g. Short sentences. One clause each. No sub-clauses stacked up.}}
- {{e.g. Never says "Xin chào" or "Hôm nay chúng ta sẽ".}}

### Banned in narration

{{List the clichés that make a script sound generated. Be specific — quote them.}}

- {{"trong bối cảnh công nghệ phát triển như vũ bão"}}
- {{"mở ra một kỷ nguyên mới"}}
- {{"hãy cùng nhau tìm hiểu"}}

---

## §6. SELF-CHECK (run before handing the script over)

1. `node scripts/video/validate-script.mjs <script.json> --strict` — **zero errors, zero warnings**.
2. No digit anywhere in any `voiceText`. Read each one aloud — does it sound like a person?
3. Hook lands the surprise in the first sentence.
4. Every `inputs` field fits its character limit in `CATALOG.md` — long text overflows the layout.
5. Body templates vary; no template used more than twice.
6. Last scene is the outro, with the right brand name and URL.

Fix silently, up to two passes. If it still fails, say what is wrong rather than shipping it.

---

## §7. REVIEW RUBRIC (the reviewer scores this)

| # | Criterion | Fails when |
|---|---|---|
| 1 | Validator clean | any error, or any warning at `--strict` |
| 2 | Hook strength | first sentence is context/greeting, not the surprise |
| 3 | Pacing | any body scene outside 25–40 words |
| 4 | Total length | outside 270–360 words (≈90–120s) |
| 5 | Narration is clean | any digit, emoji, URL or banned symbol in `voiceText` |
| 6 | Number spelling | any figure read wrong when spoken aloud |
| 7 | Template variety | one template used > 2× |
| 8 | Template fit | a list scene not on a list template, a 2-way compare not on the comparison template |
| 9 | On-screen text fits | any `inputs` field over its CATALOG limit |
| 10 | Clichés | more than one banned phrase from §5 |
| 11 | Outro correct | wrong brand, wrong URL, or not the last scene |
| 12 | Footage matches the line | a clip showing something unrelated to what is said |
| 13 | Footage is seasoning | more than a third of scenes on B-roll, or footage under a statistic |

**FAIL IMMEDIATELY:** #1 (errors) · #5 · #11 · #12.

> Not passing → return specific fixes; the writer revises and re-submits. Max 2–3 rounds,
> then drop the item and log why (see `PLAYBOOK.md`).
