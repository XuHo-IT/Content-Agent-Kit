---
name: ads-report
description: Read ad performance from the connected ads MCP servers (Meta, Google, TikTok, Snap, Reddit) and turn it into a decision about what content to make next, for an agent built with content-agent-kit. Use weekly, or when the user asks "how did the ads do", "what should we post next", or "which campaigns are wasting money". Writes a short report and proposes concrete queue items.
---

# Ads report → next week's content

Numbers are not the deliverable. **A decision about what to write next is.** A report that
ends at "CTR was 1.4%" leaves the reader exactly where they started.

This skill closes the loop the kit otherwise leaves open: it publishes content, and it
schedules content, but nothing tells it which content was worth publishing.

## Before you start

You need at least one ads MCP server connected — see `.mcp.json` and
`docs/18-ads-and-marketing.md`. If none is connected, say so and stop. Do **not** invent
plausible numbers to fill the report; a fabricated benchmark is worse than no report,
because someone will spend money on it.

If `mkt-ads-audit` is installed (`node scripts/install-skills.mjs mkt-ads-audit`), read it
first — it covers account-level diagnosis in more depth than this does. This skill's job is
the handoff from that diagnosis to the content queue.

## 1. Read

Pull, for the period the user asked for (default: last 7 days, compared with the 7 before):

- spend, impressions, reach, clicks, CTR, CPC, CPM
- conversions and cost per conversion, **only if** conversion tracking is actually
  configured — if it is not, say that plainly instead of reporting zeros as a result
- per campaign, per ad set, and **per creative**, because the creative is the part this kit
  can change

Record the currency and the timezone the platform reported in. A week boundary in the wrong
timezone moves numbers enough to reverse a conclusion.

## 2. Separate signal from noise

Do this before writing anything.

- **Sample size first.** Under a few hundred impressions, a CTR difference is noise. Say
  "not enough data yet" rather than ranking two creatives that differ by a handful of clicks.
- **Compare like with like.** A creative that ran for two days against one that ran for
  fourteen is not a fair comparison; normalise or exclude it and say which you did.
- **One change at a time.** If budget, audience and creative all changed, the result cannot
  be attributed to any of them. Report it as unattributable rather than guessing.

## 3. Write `brain/ads-report-<YYYY-MM-DD>.md`

Keep it to one screen.

```markdown
# Ads report — <period>   (<currency>, <timezone>)

**Spend:** X  ·  **vs previous period:** ±Y%
**Conversion tracking:** configured | NOT configured — the numbers below stop at clicks

## What worked
- <creative / angle / hook>, <metric with the number>, <how much data it is based on>

## What did not
- <creative>, <metric>, <and what you would change about it — not just that it lost>

## Not enough data
- <anything with too few impressions to judge — listing these stops them being re-tested blindly>

## Recommended for the queue
1. <topic / angle> — because <which number supports it>
2. …

## Do not repeat
- <angle that lost, with the number>
```

## 4. Propose queue items — do not add them

Print the exact `queue.json` entries you would add, then **stop and ask**. This skill can
see ad accounts that spend real money; it does not get to decide the content plan on its own.

If the user approves, append with `scripts/append.mjs` following the schema in
`docs/04-state-and-dedup.md`.

## Writing the recommendations

Every recommendation names the number behind it. "Short hooks did better" is an opinion;
"the three posts opening with a question averaged 2.1% CTR against 0.9% for the rest, over
~40k impressions each" is a reason.

Where the data does not support a recommendation, write that. A short honest report gets
read next week; a long confident one built on forty impressions does not survive contact
with the next set of results.

## Safety

The ads MCP servers are **read and write**. The same connection that reads spend can pause a
campaign or change a budget.

- Never change a budget, pause, or launch anything as part of producing a report.
- If the user asks for a change, state what you are about to do — account, campaign, old
  value, new value — and wait for a yes.
- An irreversible action on a live ad account is spending someone's money. Treat it that way.
