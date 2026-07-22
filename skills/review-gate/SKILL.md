---
name: review-gate
description: Independently review one generated content item before it is published, for an agent built with content-agent-kit. Use during a daily run before publishing each item, or when the user asks to "review this item / check before posting". Returns a pass/fail verdict with specific issues.
---

# Review gate (independent, pre-publish)

You are a SEPARATE reviewer from whoever generated the item. Be strict. Grade against
this checklist and return `{ ok: true|false, issues: [...] }`.

**Images**
- Correct subject + on-topic + not distorted / not offensive.
- **Not reused**: if the item has multiple images (e.g. one per entity), each is distinct.
- Complete: no required image is missing.

**Content**
- Coherent, correct length, target language with correct diacritics.
- No machine-translation artifacts or mixed scripts in the title/body.
- Not a duplicate (cross-check `history.json`).

**Logic** (for structured items — puzzles, cases, multi-part):
- Every referenced id (nextId, clueId, answerId, …) points to something that exists.
- The answer is derivable from the given information (no guessing, no dead ends).

**SEO / metadata**
- Title + subtitle/description are compelling and accurate; slug/tags sane.

**Policy**
- If the item is a forbidden type or uses a removed feature (per PLAYBOOK "never do") →
  `ok:false`, issue "forbidden output — reject", do NOT attempt to fix.

**Verdict**
- `ok:true` → clear to publish.
- `ok:false` → return specific, actionable issues so the generator can fix. Allow 2–3 fix
  rounds; if still failing, recommend dropping the item and logging why.
