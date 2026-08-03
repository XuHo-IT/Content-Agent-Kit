---
name: repurpose
description: Turn one thing you already published into several more — social variants with different hooks, a short video script, a carousel outline, a newsletter blurb — for an agent built with content-agent-kit. Use when the user says "make more from this", "repurpose this post", "turn this article into a video", or points at something already live. Tracks which angles have been used so the same one is not published twice.
---

# Repurpose one piece into several

The kit is good at making things. It has no answer for **making more from what you already
made** — and for one person, that is the difference between three posts a week and twelve.

Not writing more. Getting more out of what is written.

The capability is already here: `examples/ai-video-social/` holds the same Claude Fable 5
source as both an article and a video. Nothing connected "I made this once" to "make five more
from it". This is that connection.

## Before you start

**Read the source properly.** Not the title — the whole thing. A repurpose written from a
headline produces five posts that all say the headline.

**Then decide whether it deserves it.** Repurposing a weak piece multiplies the weakness: five
variants of something nobody engaged with is five times the work for the same silence. If the
original is thin, say so and stop. The honest output here is sometimes "this one is not worth
it — write something new instead".

Signals it is worth repurposing:

- it has **a number, a result, or a claim someone could disagree with** — those travel
- it took real work to research, so the value is already paid for
- it performed, or it covers something you know people ask about

## 1. Find the angles, do not invent them

An angle is **a different thing the source says**, not the same thing said differently.
Rewording one idea five ways is spam; five ideas from one piece of research is a week of
content.

Pull them from the source itself:

| angle | what to look for |
|---|---|
| the counterintuitive bit | where the result contradicted the expectation |
| the number | the single figure that carries the claim |
| the cost | what it took, what broke, what you would not do again |
| the how | the steps someone could follow tomorrow |
| the disagreement | the part reasonable people would argue with |
| the aside | the small thing you noticed that was not the point |

Four to six angles from a substantial piece. Fewer if the source is short — **do not pad to
hit a number**.

## 2. Check what has already gone out

```bash
cat brain/repurposed.json   # { "<source-id>": { "angles": ["counterintuitive", "cost"], … } }
```

This file exists because `history.json` cannot answer the question. That is a flat list of
published **titles** — it dedups by identity, so it knows the source went out but not which
angle you used. Repurposing without this check is how the same point gets published three
times in a month with different wording.

Skip angles already listed. If every angle is used, say so — that is a finished source, not a
failure.

## 3. Produce, in the format that fits the angle

Match the container to the idea rather than making all five formats every time:

| the angle is… | make |
|---|---|
| one sharp claim | a short social post |
| a number worth seeing | a `frame-chart-bars` scene, or an image |
| a sequence | a `frame-step-list` scene, or a carousel outline |
| a story with a turn | a short video — see `templates/VIDEO_GENRES.template.json` |
| a judgement | a `frame-review-verdict` scene |
| context worth keeping | a newsletter paragraph |

**Vary the hook across variants.** If all of them open with a number, they read as one post
published five times. `fb-hook-extractor` (in `skills/registry.json`) covers this properly if
you want formulas.

## 4. Through the same gates as anything else

No shortcuts because the words already existed:

```bash
node scripts/social/validate-post.mjs brain/<slug>/repurposed/<angle>.json --strict
```

`WRITING_CRAFT.md` applies. `review-gate` applies. A repurposed post is a post.

## 5. Record what you used

Append to `brain/repurposed.json`:

```json
{
  "rerank-rag-tieng-viet": {
    "sourceTitle": "Rerank trong RAG tiếng Việt",
    "angles": ["counterintuitive", "cost"],
    "lastRepurposedAt": "2026-08-03"
  }
}
```

Only record an angle **after it publishes**. Recording at draft time means a rejected draft
burns the angle forever.

## 6. Report

Append to `brain/<slug>/report.md`: which angles were taken, which were left, and why any
were rejected. The left-over list is what makes the next pass fast.

## What not to do

- **Do not republish the same angle in different words.** That is what the state file is for.
- **Do not repurpose across languages by translating.** A translated post reads translated.
  Rewrite it for the new audience or skip it.
- **Do not strip the source.** A repurposed post that removes the number, the caveat and the
  link is a claim with nothing behind it. Keep what makes it checkable.
- **Do not schedule them all for the same week.** Spread them. The point is to fill weeks you
  would otherwise have nothing for.
