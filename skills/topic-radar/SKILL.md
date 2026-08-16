---
name: topic-radar
description: Find what is actually hot and new about one topic today, ranked across Reddit, Hacker News, GitHub and the news wire, for an agent built with content-agent-kit. Use when the user names a subject and wants today's angle — "hôm nay có gì hot về X", "tin mới nhất về X", "what's hot in X", "what should I post about X today" — or when a daily run needs an idea it has not used before. Writes brain/radar/<date>-<topic>.json plus a readable brief, and remembers what it handed out so tomorrow is not a repeat.
---

# Topic radar

The user says a topic. You come back with the two or three things worth making a video about
*today*, each with a reason it is worth making today. Not a search-results dump — a shortlist
you would defend.

The scoring is done for you, in code, so it is the same every morning. Your job is the part
code cannot do: read the primary sources and decide whether the top-ranked thing is actually a
story.

> Antigravity / Gemini: same steps, run the commands directly.

## Step 1 — Run the radar

```bash
node scripts/research/topic-radar.mjs --topic "<what the user said>" --top 10
```

It fans out across four **keyless** sources, merges duplicates, scores, drops anything an
earlier run already handed out, and writes `brain/radar/<date>-<slug>.json` + `.md`.
It prints `RADAR=<path>` — capture that.

Flags worth knowing:

| flag | when |
| --- | --- |
| `--days 7` | the user said "this week" / the topic moves fast |
| `--days 90` | a slow field, or a first run with nothing to show |
| `--half-life 1` | breaking news — punish anything over a day old hard |
| `--no-dedup` | the user asks why yesterday's story is missing |
| `--dry-run` | you want to look before writing state |

**Read the `## Sources` block in the output.** It says what each source returned. A line like
`reddit — 47 items — RSS fallback … no vote counts` is telling you that source's ranking is
weaker than usual, and that is worth knowing before you trust position #1.

## Step 2 — Read the primary sources

The radar ranks *attention*. It cannot tell a launch from a rumour. Take the top 3 and open
what they actually point at:

- `WebFetch` the **primary** source — the announcement, the paper, the changelog, the repo
  README. Not a blog summarising it, and not the aggregator thread.
- Pull out the concrete, quotable facts: numbers, dates, names, what changed.
- If the link is a discussion thread, the item carries `discussionUrl` separately — read
  both. What the thread argues about is usually the better hook.

If a top item turns out to be a rewrite of something with no primary source behind it, **drop
it and say so**. Ranking high on engagement and being true are different properties.

The full method, including screenshot evidence and B-roll, is in **`research-and-capture`**.

## Step 3 — Report

For each story you kept:

```markdown
**<the story in one line>**
Why today: <what changed, with the number or date that proves it>
Source: <primary url>   ·   score 0.69 · 1d old · hn + reddit
Angle: <the specific take — not "an overview of X">
Genre: news
```

Pick `Genre` from `templates/VIDEO_GENRES.template.json` — it decides which frames the script
uses and in what order. `news` fits most radar output; `technical-deepdive` fits a paper or a
release with real internals; `listicle` fits "five things shipped this week".

Sort by your judgement, not by the score. The score got you the shortlist; you rank it.

## Step 4 — Hand off

The user usually wants a video next. That whole chain is **`daily-topic-video`** — do not
re-run the radar for it, pass it the `RADAR=` path you already have.

## When there is nothing

Some mornings a topic has produced nothing new. The script says so and exits with an empty
`RADAR=`. **Say that plainly.** Offer `--days 90`, or a neighbouring topic, or `--no-dedup` to
show what was already used.

Do not widen the window silently and present week-old news as today's. Do not fill the gap
from memory — you do not know what shipped this week. An honest "nothing today" is a usable
answer; a confident wrong one costs a video.

## Notes

- **No API keys.** Reddit, Hacker News, GitHub and Google News all answer without an account.
  `GITHUB_TOKEN` is read if present but only raises a rate limit.
- **Reddit's JSON API 403s** unauthenticated clients on most networks; the source falls back
  to its Atom feed, which has the posts but no vote counts. Reported, not hidden.
- **The news wire is Vietnamese by default** (`NEWS_RSS_LOCALE=vi|VN|VN:vi`). Set
  `en|US|US:en` for an English-market agent.
- **The seen-ledger** lives at `brain/radar-seen.json` and records only what was handed out,
  not everything found — so a story ranked 40th on Monday can still surface on Tuesday.
- To see one source's raw output when a result looks wrong:
  `node scripts/research/hot-sources.mjs --topic "…" --sources hn --json`

## What not to do

- Do not write the video from the radar entry alone. The title is an aggregator's title; the
  facts are in the primary source.
- Do not present a GitHub repo's star count as adoption. `created:` filtering means these are
  weeks old — stars that new measure attention, not use.
- Do not pass `--no-dedup` to make a thin morning look fuller. That is how the same story gets
  posted twice with a different voice.
