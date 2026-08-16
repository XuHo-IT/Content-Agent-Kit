---
name: daily-topic-video
description: One topic in, one finished short out — research today's hottest story on that topic, verify it, script it, render it and publish it, for an agent built with content-agent-kit. Use when the user names a subject and wants the whole thing — "hôm nay làm video về X", "tạo video tin nóng X", "make me today's video about X", "topic X → video" — or when a scheduled daily run is given a topic instead of a queue. Chains topic-radar → research-and-capture → create-video → review-gate → video-and-post.
---

# Daily topic video

The whole morning in one ask: the user names a topic, and a published 9:16 short comes out the
other end, about something that is actually news today and has not been covered before.

This skill **orchestrates**; it does not reimplement. Every step below is another skill doing
its own job properly. What this adds is the order, the handover between them, and the state
that stops tomorrow being a repeat of today.

> Antigravity / Gemini: same steps, run the commands directly.

## The chain

```
topic
 ├─1─► topic-radar             ranked shortlist, already de-repeated
 ├─2─► pick one                yours, or the user's if it is close
 ├─3─► research-and-capture    primary sources, screenshots, B-roll
 ├─4─► create-video            script.json → validate --strict → render
 ├─5─► review-gate             mandatory. no exceptions
 └─6─► video-and-post          Make.com webhook
```

## Step 1 — Radar

```bash
node scripts/research/topic-radar.mjs --topic "<topic>" --top 8
```

Capture `RADAR=<path>`. Follow **`topic-radar`** for how to read it and what the `## Sources`
block is telling you.

**Empty `RADAR=` means nothing new today.** Stop and say so. Offer a wider `--days`, a
neighbouring topic, or a different item. Do not make a video about week-old news and call it
today's, and do not make one up.

## Step 2 — Pick

Read the primary source of the top 3 before choosing (Step 2 of `topic-radar`). Then:

- **One clear winner** — take it and say why in one line.
- **Top 3 within ~0.05 of each other, or pulling in different directions** — show the three
  with their angles and ask. A scored tie is a genuine editorial choice, and it is the user's.
- **The winner has no primary source** — drop it, take the next. Engagement is not truth.

Note the item's `sources` array. A story only Reddit carried is a community story; one Reddit
*and* Hacker News *and* the wire carried is an event. They want different hooks.

## Step 3 — Evidence

Follow **`research-and-capture`** in full: primary sources read, 2–4 pages worth showing
captured, B-roll chosen by what the clip actually *shows*.

Pick an output directory now — `brain/<slug>/`, `<slug>` ASCII with diacritics stripped
(đ→d), ≤40 chars. Everything downstream writes there.

**If the story is about a place**, the `geo` media source flies a real map down onto it:

```json
"media": { "kind": "video", "source": "geo", "query": "Aokigahara, Japan" }
```

Free and keyless — stitched from OpenStreetMap-derived tiles. Run it with `--dry-run` first:
it reports whether a font was found for the **attribution** (a tile carries no credit of its
own, and that credit is a licence condition) and whether street-level imagery exists there.
See `docs/15-media-sources.md`.

**Give the run one meme.** News videos are the format most likely to be eight text frames in
a row, and a `frame-meme` scene around the two-thirds mark is the cheapest change of energy
available — free, keyless, one scene. It has to carry that beat's point, not decorate it, and
the lines must be short enough to fit one rendered line each. See `create-video` for the
rhythm rule and the `fit: "contain"` requirement.

**If a social clip is genuinely the story** — the post everyone is reacting to — the `social`
source fetches it, but the scene must declare `rights`. For a daily run that is usually the
wrong trade: it is a legal question per clip, every day, on a schedule. Prefer
`social-fetch.mjs --analyze` to study the post and B-roll from Pexels to show it.

## Step 4 — Video

Follow **`create-video`** without shortcuts. The parts this chain gets wrong most often:

- **`voiceText` is spoken.** Every number written out in Vietnamese words. A radar item's
  title is full of digits, versions and `%` — none of that survives into narration.
- **The hook carries the "why today".** `frame-liquid-bg-hero`, and the line is what changed,
  not what the topic is.
- **Vary the body templates**, max twice each.
- Validate, render, and **look at the contact sheet**. Every time.

```bash
node scripts/video/validate-script.mjs brain/<slug>/script.json --strict
node scripts/video/render.mjs          brain/<slug>/script.json
node scripts/video/contact-sheet.mjs   brain/<slug>/video.mp4
```

## Step 5 — Review gate

Invoke **`review-gate`** as an independent subagent. Not optional, not "it looks fine", not
skipped because the render already took four minutes.

On top of its usual rubric, this chain has two failure modes of its own — check both:

1. **Is the claim in the video actually in the primary source?** Aggregator headlines
   overstate. If the video says a number the source does not, that is a fail.
2. **Is the "why today" real?** A story that broke three weeks ago and resurfaced is not
   news. The radar's `age` column is right there in the brief.

Fail → fix → re-review, 2–3 rounds. Still failing → drop it, log why, take the next radar item.

## Step 6 — Publish

Follow **`video-and-post`**. Treat `409` as already-done.

Then record it, so tomorrow knows:

- The radar already wrote the story's keys to `brain/radar-seen.json` when it handed it out.
- Add the title to `history.json` and the id to `ledger.json` per the project PLAYBOOK.
- If you **dropped** the top item at Step 2 or 5, that is worth a line in the run report —
  it was still consumed from the radar's ledger and will not come back on its own.

## Step 7 — Report

```markdown
✓ Topic:  <topic>
✓ Story:  <headline>   (score 0.69 · 1d · hn+reddit)
✓ Source: <primary url>
✓ Video:  brain/<slug>/video.mp4   (1080×1920, XX.Xs)
✓ Posted: <platforms>   |  ✗ Dropped: <why>
```

## Notes

- **Render during this run, not at the posting slot.** A render is 3–5 minutes; the scheduled
  post should be instant. Same rule as `daily-run` §4b.
- **Running twice on one topic in a day** returns different stories — the ledger sees to it.
  That is the feature, not a bug to work around with `--no-dedup`.
- **In a `daily-run`**, this replaces steps 3–7 for a topic-driven agent; the PLAYBOOK's
  phase logic still decides *whether* today is a video day.
- Nothing here needs an API key except publishing. The research layer is entirely keyless.

## What not to do

- Do not skip the review gate because the radar "already vetted" the story. The radar ranks
  attention. It has no opinion on whether your script is accurate.
- Do not let the radar's ranking pick the story on its own. It has not read anything.
- Do not run the radar twice in one chain — the second run's ledger write would consume a
  second story you never used.
