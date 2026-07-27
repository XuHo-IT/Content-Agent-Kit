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

**Policy**
- If the item is a forbidden type or uses a removed feature (per PLAYBOOK "never do") →
  `ok:false`, issue "forbidden output — reject", do NOT attempt to fix.

**Verdict**
- `ok:true` → clear to publish.
- `ok:false` → return specific, actionable issues so the generator can fix. Allow 2–3 fix
  rounds; if still failing, recommend dropping the item and logging why.
