---
name: review-gate
description: Independently review one generated content item before it is published, for an agent built with content-agent-kit. Use during a daily run before publishing each item, or when the user asks to "review this item / check before posting". Returns a pass/fail verdict with specific issues.
---

# Review gate (independent, pre-publish)

You are a SEPARATE reviewer from whoever generated the item. Be strict. Grade against
this checklist and return `{ ok: true|false, issues: [...], fixes: [...] }`.

**Craft comes first.** If the project has a `WRITING_CRAFT.md`, score its **§7 rubric**
before anything else — those criteria are measurable, so count them:

| # | Criterion | FAIL threshold |
|---|---|---|
| 1 | Cliché phrases from the banned list (§4) | > 1 per 1000 words |
| 2 | Consecutive paragraphs opening with the same structure | > 2 |
| 3 | Concrete sensory details per major scene | < 3 |
| 4 | POV / forms of address | changes mid-piece |
| 5 | Peak moments | told (stated emotion) instead of shown |
| 6 | Character voices | main characters sound identical |
| 7 | Cheap transitions ("suddenly"…) | > 2 per 1000 words |
| 8 | Register hard rule (e.g. mystery fair-play: every clue needed for the solution appears in the body) | violated |

**FAIL IMMEDIATELY** on: register hard rule violated · POV/address broken · cliché density at
double threshold · nothing shown, only told.

Every issue must **quote the offending sentence**; every fix must propose a concrete rewrite.
Never return vague feedback like "make the prose better".

**Images**
- Correct subject + on-topic + not distorted / not offensive.
- **Not reused**: if the item has multiple images (e.g. one per entity), each is distinct.
- Complete: no required image is missing.

**Video** (items with a `script.json` — score the project's `VIDEO_CRAFT.md` §7 rubric)

Run the machine checks yourself before judging by eye:
```bash
node scripts/video/validate-script.mjs <dir>/script.json --strict
```

| # | Criterion | FAIL threshold |
|---|---|---|
| 1 | Validator | any error → **fail immediately**; any warning at `--strict` |
| 2 | Hook | first sentence is context or a greeting instead of the surprise |
| 3 | Pacing | any body scene outside 25–40 words |
| 4 | Total length | outside 270–360 words (≈90–120s) |
| 5 | Narration clean | any digit, emoji, URL or `→ & % $ # + =` in `voiceText` → **fail immediately** |
| 6 | Numbers spoken | read each `voiceText` aloud — any figure that comes out wrong |
| 7 | Template variety | one template used > 2× |
| 8 | Template fit | a list scene not on a list template; a 2-way compare not on the comparison template |
| 9 | On-screen text | any `inputs` field over its limit in `video-templates/CATALOG.md` |
| 10 | Outro | wrong brand / wrong URL / not the last scene → **fail immediately** |

Also check the **rendered file** when one exists: `video.mp4` is 1080×1920, its duration is
roughly `voice.mp3` + 3s, and no scene is visually empty (a template whose required slot was
left blank renders as a blank card).

**Look at the frames. This is not optional.**

```bash
node scripts/video/contact-sheet.mjs <dir>/video.mp4
```

One labelled thumbnail per scene, with `*` marking the ones carrying footage or a screenshot.
Every defect below is invisible to the validator — they are all *plausible* values that render
into a wrong-looking video. Four real ones shipped before this check existed: B-roll of a
coffee cup under a line about an export ban; a headline printed twice because `title` and
`accent` concatenate; a comparison headline repeating both card labels; and a word broken
mid-syllable because it was too long for a char-animated slot.

| # | Criterion | Fails when |
|---|---|---|
| a | B-roll matches the line | the clip shows something unrelated to what is being said → **fail immediately** |
| b | Text readable over footage | a bright clip swallows the headline |
| c | Screenshot is evidence | a generic homepage instead of the page actually being cited |
| d | Screenshot is clean | a cookie/consent wall in frame, or the page headline cropped away → **fail immediately** |
| e | No B-roll under a statistic | a scene whose point is a number uses `frame-broll` |
| f | Footage is seasoning | more than a third of scenes are B-roll — it stops being a news video |
| g | Text fits its slot | any word wrapped or clipped, especially in char-animated slots |
| h | Media host is durable | `media-lock.json` or the post points at `catbox` → the link will die → **fail immediately** |
| i | `media-lock.json` committed | missing → the video cannot be reproduced anywhere else |

**Content**
- Coherent, correct length, target language with correct diacritics.
- No machine-translation artifacts or mixed scripts in the title/body.
- Not a duplicate (cross-check `history.json`).

**Logic** (for structured items — puzzles, cases, multi-part):
- Every referenced id (nextId, answerId, revealsIds, …) points to something that exists.
- The answer is derivable from the given information (no guessing, no dead ends).
- 🔴 **No internal-id leak**: no logic id (`q1`, `o2`, `n3`, `s1`…) appears in any
  reader-visible text (`content`/`revealText`/titles/labels), even as `(q1)`/`[o2]`. Scan
  for `([a-z]\d+)` tokens → any hit is `ok:false` (see `docs/03-conventions.md`).

**SEO / metadata**
- Title + subtitle/description are compelling and accurate; slug/tags sane.
- **Social text is plain text.** Run `node scripts/social/validate-post.mjs <file> --strict`.
  Captions render no Markdown, so a `##` heading, `**bold**` or a `Meta:`/`Slug:` block
  reaches the reader as literal characters. `make-post.mjs` refuses to send text that fails,
  so catching it here is the difference between a rewrite and a blocked publish.

**Policy**
- If the item is a forbidden type or uses a removed feature (per PLAYBOOK "never do") →
  `ok:false`, issue "forbidden output — reject", do NOT attempt to fix.

**Verdict**
- `ok:true` → clear to publish.
- `ok:false` → return specific, actionable issues so the generator can fix. Allow 2–3 fix
  rounds; if still failing, recommend dropping the item and logging why.
