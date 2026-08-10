---
name: geo-optimize
description: Write so an answer engine can quote you — ChatGPT, Perplexity, Google AI Overviews, Claude. Use when the user says "GEO", "tối ưu GEO", "generative engine optimization", "answer engine optimization", "AEO", "làm sao để AI trích bài mình", "xuất hiện trong AI Overview", or asks why traffic fell while rankings held. Also covers the OTHER thing called GEO — geography, local and market-led content — because the two share an acronym and not much else.
---

# GEO

Two different jobs are called GEO. Say which one out loud before doing anything, because the
work does not overlap.

| the user means | this is about | go to |
|---|---|---|
| Generative Engine Optimization | being **quotable** by an answer engine | §1 onward |
| geography — local, market, "near me" | being **placed** | §6 |

## 1. What changed, in one paragraph

SEO gets a human to click a ranked link. GEO gets a machine to lift a passage out of your page
and cite it, and the reader may never arrive at all. That makes the unit of success different:
not a page that ranks, but **a passage that still means something once it is cut out of its
page**. Everything below follows from that one sentence.

This is why a piece can hold its rankings and lose its traffic. Nothing about it got worse. It
just was not written in a shape anything could quote.

## 2. Run the audit first, not last

```bash
node scripts/geo-audit.mjs --in brain/<slug>/post.md
```

It is rule-based — no key, no network, no model. It exits `1` when a **must** rule fails, so it
works as a gate in the same place `validate-post` sits.

Read the failures before you read the draft. The rules are the shape; the draft is your
opinion about the shape.

| rule | level | what it means |
|---|---|---|
| `answer-first` | must | the sentence under a question heading answers it, in ≤30 words, with no run-up |
| `self-contained` | must | no paragraph opens on "Nó", "Điều này", "However" |
| `sourced-numbers` | must | every number says where it came from **in its own paragraph** |
| `question-headings` | should | at least a third of the H2s match something a person would type |
| `definition` | should | an "X là Y" sentence in the first screen |
| `dated` | should | a real date, not "gần đây" |
| `table` | should | at least one — tables are the most-quoted thing on a page |

## 3. The three musts, and why they are musts

**Answer first.** The paragraph under a question heading is the candidate passage. If it opens
with *"Trong bài này chúng ta sẽ cùng tìm hiểu…"*, that is what gets quoted — an announcement
that an answer exists, in place of the answer. Put the answer in the first sentence and the
reasoning after it. This is the inverted pyramid, and it is worth noticing that the shape
answer engines reward is the one newsrooms settled on a century ago for the same reason:
the reader may stop at any moment.

**Self-contained paragraphs.** A passage is quoted alone. A paragraph beginning "Nó rẻ hơn
68%" is true on the page and meaningless off it — *what* is cheaper? Name the subject again.
Repetition that reads slightly redundant to a human reading top to bottom is what makes the
paragraph survive extraction. Accept the redundancy.

**Numbers carry their source in the same breath.** "Rẻ hơn 68%" and, three paragraphs later,
"số liệu từ RAG-EVAL-VN" are two passages, and only one of them will be quoted. Write "Rẻ hơn
68%, đo trên 500 câu hỏi tiếng Việt" — the claim and its warrant travel together or the claim
travels alone and gets dropped.

## 4. What this kit already gives you, free

- **`docs/12-writing-craft.md`** — the house rules on claims and evidence. GEO does not
  replace them; a quotable lie is worse than an unquotable one.
- **Every number in the video pipeline is measured**, not decorative — `frame-chart-bars`,
  `frame-trend-line`, `frame-review-verdict` all compute their picture from the value. A post
  built off the same `script.json` inherits sourced numbers by construction.
- **`frame-myth-fact`** is a question-heading in video form: the belief, then the correction.

## 5. What NOT to do

- **Do not stuff a FAQ block at the bottom of everything.** An FAQ whose questions nobody
  asked is a list of headings with no traffic behind them. Write the questions you were
  actually asked — support tickets, comments, search console.
- **Do not write for the machine at the human's expense.** Engines quote passages humans
  found useful; the ranking signal underneath has not disappeared.
- **Do not claim a citation you cannot see.** Whether an engine cited you is not observable
  from your own logs in any reliable way. Report what you changed, not what you assume it won.
- **Do not add schema markup and call it done.** Structured data helps a crawler parse; it
  does not make a badly shaped paragraph quotable.

## 6. The other GEO — geography

When the user means *place*, the work is different and the kit has the parts:

```bash
node scripts/geo-audit.mjs --in post.md --place "Đà Nẵng"
```

That turns on one extra **must**: the locality appears in the title or the first paragraph. A
place named for the first time in paragraph nine is not what the piece is about, and both a
local search engine and an answer engine read the opening to decide what it is about.

For video, the genre is **`local`** in `templates/VIDEO_GENRES.template.json`, built on the
two map frames:

- **`frame-geo-markers`** — where you are, or where your customers are. Auto-fits the map to
  the points you give it.
- **`frame-geo-route`** — one place to another: expansion, delivery, a journey.

Both draw from `video-templates/world-path.json`, which is committed — **no map tiles are
fetched, so no attribution or API key is involved.** See `CATALOG.md` for the projection and
the auto-fit trap that produced a map of Indonesia from three Vietnamese cities.

## 7. Done means

- `geo-audit.mjs` exits 0 on the draft
- Every heading you added is a question somebody actually asks
- You can point at each number's source without scrolling
- You did not invent a metric for whether an engine cited you
