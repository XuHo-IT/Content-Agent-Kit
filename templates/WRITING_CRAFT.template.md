# {{AGENT_NAME}} — WRITING CRAFT

> **Write this file in {{LANGUAGE}}** (the language your content is published in) — the
> writing subagent reads it as instructions, so it should speak the same language it writes.
> **Mandatory read before writing.** Writer reads §1 + its register (§2 or §3) + §4 + §6.
> Reviewer scores by **§7**. See `docs/12-writing-craft.md` for the method.

---

## §1. UNIVERSAL PRINCIPLES

**1.1 Show, don't tell.** Never announce an emotion — dramatize the thing that causes it.
> ✗ "{{flat statement of feeling}}" → ✓ "{{action + physical detail that implies it}}"

**1.2 Concrete sensory detail.** Specific nouns + smell / sound / touch / temperature.
One true detail beats three adjectives.

**1.3 Sentence rhythm.** Vary length on purpose: long, clause-stacked sentences to build;
**short. Clipped.** at the peak.

**1.4 Strong verbs over adverbs.** Cap hedge-similes ("like/as if") at ~1 per 1000 words.

**1.5 Consistent POV & forms of address.** {{Language-specific note — e.g. in Vietnamese the
pronoun/address system (tôi/hắn/lão/cô ta…) must match each character's relationship, era and
region, and must NOT change mid-piece.}}

**1.6 Dialogue with a distinct voice.** Each character: own vocabulary, sentence length, verbal
tic. Dialogue carries **subtext** — people evade, trail off, lie — they don't narrate the plot.

**1.7 Enter late, leave early.** Start a scene just before something happens; cut just after.
No walking, door-opening, tea-pouring unless it means something.

---

## §2. REGISTER: {{CONTENT TYPE A — e.g. narrative / horror / feature}}

- **Arc / shape:** {{the beat structure this type must follow}}
- **Core technique:** {{the one move that defines the genre}}
- **Grounding:** {{the concrete, culturally specific texture that makes it real}}
- **Serial rule (if multi-part):** end each installment on tension; don't open with a recap.
- **Must contain:** {{non-negotiable elements}}

## §3. REGISTER: {{CONTENT TYPE B — e.g. investigative / mystery / news}}

- **Voice:** {{how this sounds — and how it differs from §2}}
- **Hard rule:** {{the genre's fairness/accuracy contract, e.g. "every clue needed for the
  solution must appear in the body" or "every claim must trace to the cited source"}}
- **Structure:** {{how information is revealed / ordered}}
- **Must contain:** {{non-negotiable elements}}

> ⚠️ §2 and §3 are **different voices**. Never write both in the same tone.

> 🔴 **NO INTERNAL-ID LEAKAGE (structured/interactive content).** If your items carry machine
> ids for logic entities (options, steps, nodes, cards — e.g. `q1`, `o2`, `n3`…), those ids live
> ONLY in logic fields — NEVER write them, not even as `(q1)`/`[o2]`/`` `n3` ``, in any
> reader-visible text (`content`, `revealText`, titles, labels). In prose, refer to things **by
> name or description**, never by id. A leaked id reads as broken and, for anything with a hidden
> answer, **spoils it step-by-step**. Pre-publish scan: strip any `([a-z]\d+)` token.
> See `docs/03-conventions.md` + `KNOWLEDGE.template.md` (structured content).

---

## §4. BANNED — clichés & "AI smell"

**4.1 Cliché phrases (quote them explicitly):**
{{list the exact overused phrases in your language/genre — 8–12 of them}}

**4.2 All-purpose adjectives** used *instead of* description: {{list}}.

**4.3 Structural tics:**
- Every paragraph the same length; flat, even rhythm.
- Several consecutive paragraphs opening with the same structure.
- Overusing cheap transitions ({{"suddenly", …}}).
- Listing emotions instead of staging a scene.
- Re-explaining what was just shown.
- Ending every paragraph on a clipped dramatic one-liner.
- Tacking a moral/summary onto the end.

---

## §5. BEFORE / AFTER EXAMPLES

> Write **your own** passages (never copy copyrighted prose). 2–3 pairs is enough.
> After each pair, state **what changed** — that note is what the model actually learns from.

### Pair 1 — {{opening scene, type A}}
**✗ BEFORE:** {{a realistic bad version: clichés, told emotions, flat rhythm}}
**✓ AFTER:** {{the rewrite}}
*What changed:* {{name the specific fixes}}

### Pair 2 — {{climax / key beat, type A}}
**✗ BEFORE:** {{…}}
**✓ AFTER:** {{…}}
*What changed:* {{…}}

### Pair 3 — {{a scene in register B}}
**✗ BEFORE:** {{…}}
**✓ AFTER:** {{…}}
*What changed:* {{…}}

---

## §6. SELF-CHECK (writer runs before submitting)

- [ ] Read §1 + my register (§2/§3) + §4.
- [ ] Zero phrases from §4.1; §4.2 adjectives never replace description.
- [ ] ≥3 concrete sensory details per major scene.
- [ ] Peak moments are **shown** (action/sensation), not **told**.
- [ ] No >2 consecutive paragraphs with the same opening structure; paragraph length varies.
- [ ] POV / forms of address consistent throughout.
- [ ] Each main character has ≥1 distinct voice marker.
- [ ] {{Register-specific check A}}
- [ ] {{Register-specific check B — e.g. fair-play clue rule}}
- [ ] (structured content) Zero internal-id token `([a-z]\d+)` in any reader-visible text.

---

## §7. REVIEW RUBRIC (reviewer scores this)

Return `{ "pass": bool, "issues": [...], "fixes": [...] }`. Every issue must **quote the
offending sentence**; every fix must suggest a concrete rewrite.

| # | Criterion (measurable) | FAIL threshold |
|---|---|---|
| 1 | Cliché phrases from §4.1 | > 1 per 1000 words |
| 2 | Consecutive paragraphs, same opening structure | > 2 |
| 3 | Concrete sensory details per major scene | < 3 |
| 4 | POV / address consistency | changes mid-piece |
| 5 | Peak moments | told instead of shown |
| 6 | Character voices | main characters sound identical |
| 7 | Cheap transitions ({{"suddenly"}}) | > 2 per 1000 words |
| 8 | {{Register-B hard rule, e.g. fair-play}} | violated |
| 9 | {{Register-B secondary rule}} | missing |
| 10 | {{Serial rule — installment ends on tension}} | ends on a recap/summary |
| 11 | (structured content) Internal-id token in reader-visible text | ≥ 1 `([a-z]\d+)` present |

**FAIL IMMEDIATELY:** {{list the violations that stop the review — e.g. #8 violated · #4 broken ·
#1 at double threshold · nothing shown, only told}} · **#11 any id leak**.

> Not passing → return specific `fixes`; the writer revises and re-submits. Max 2–3 rounds,
> then drop the item and log why (see `PLAYBOOK.md` §2b).
