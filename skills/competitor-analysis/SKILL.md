---
name: competitor-analysis
description: Analyse competitors' recent content — YouTube channels and any blog or news site with a feed — to see what is breaking out, which title devices they use, when they post, and which topics they cover that the user has not. Keyless. Use when the user says "phân tích đối thủ", "đối thủ đang làm gì", "kênh X đang viral cái gì", "so sánh với kênh Y", "tìm khoảng trống nội dung", "competitor analysis", "what is working for <channel>", or when planning a content calendar and wanting evidence instead of guesses. Writes brain/competitors/<date>.md + .json.
---

# Competitor analysis

The user names competitors. You come back with **three things they can act on this week** —
not a data dump. The numbers are computed in code so they are the same every time; your job
is the part code cannot do: watch the breakouts and say *why* they worked.

> Antigravity / Gemini: same steps, run the commands directly.

## Step 1 — Collect the targets

Accept any of: `@handle`, a YouTube channel URL, a `UC…` id, a website, or — with
`APIFY_TOKEN` set — `tiktok:@handle` / `instagram:@handle` / a TikTok or Instagram profile URL. Vietnamese news
sections work as-is (`https://vnexpress.net/so-hoa`, `https://tuoitre.vn/cong-nghe.htm`) — the
script finds their `/rss/<section>.rss` feed itself.

If the user has more than three, save them once so the next run is one command:

```json
// brain/competitors.json
["@kenh-doi-thu-1", "@kenh-doi-thu-2", "https://blog-doi-thu.vn"]
```

## Step 2 — Run the scan

```bash
node scripts/research/competitor-scan.mjs --file brain/competitors.json --history brain/history.json
# or ad hoc:
node scripts/research/competitor-scan.mjs --channel @Fireship --channel https://vnexpress.net/so-hoa --dry-run
```

It prints `REPORT=<path>`. `--history` is what turns on the **topic-gap** table (phrases the
competitors use that never appear in the user's own published titles) — always pass it when
the project has one.

| flag | when |
| --- | --- |
| `--breakout 1.5` | a small or very consistent channel where nothing reaches 2× |
| `--tz 7` | default — posting times are shown in Vietnam time |
| `--lang en` | the user wants the report in English |
| `--json` | you want to post-process the numbers yourself |

## Step 3 — Read it like an editor, not a spreadsheet

The report has five sections. What to take from each:

1. **Overview** — posts/week and median views tell you the *bar*. A channel posting 5×/week
   with 20K median is a different competitor from one posting weekly with 2M.
2. **Breakouts** — `outlier` (≥2× the channel's own median) is the signal. `rising` is a
   young video gaining fast — note it, do not build a strategy on it yet.
   **Open the top 2–3 outliers and watch the first 5 seconds.** Write down the hook in one
   line each. That line is worth more than the whole table.
3. **Title patterns** — the device that shows up *in breakouts* more than in the channel's
   average is the one the audience rewards. Fireship's trailing "…" is a real example.
4. **Posting schedule** — only matters if the user's slots are random today.
5. **Topic gaps** — the shortlist for new content. A gap that also appears in a breakout is
   the strongest candidate.

YouTube's public feed carries the **15 most recent uploads only**. Say so when you report —
this is "what is working lately", not a channel history. RSS sites have no view counts: for
them the report compares cadence and topics, never performance, and it says so itself.

## Step 4 — Hand back three moves

```
1. Làm: <topic from the gap table> — vì <breakout evidence>
2. Thử: <title device from breakouts> trên video tới — ví dụ: "<a title for OUR topic>"
3. Đổi: <schedule or format change> — vì <what the numbers showed>
```

Then offer the next step: `topic-radar` on the chosen topic, or `create-video` directly.

## Rules

- **Never copy a title or a script.** Take the device (number, question, trailing "…",
  versus), write the user's own words. Copyright and the review gate both care.
- **Evidence or nothing.** Every recommendation names the breakout or the number behind it.
- **TikTok / Instagram need `APIFY_TOKEN`** (optional, paid): `tiktok:@kenh`, `instagram:@kenh`.
  Tell the user it costs a little per run before you add them to a daily list. Facebook is not
  supported — use their own exports or the ad-library MCP servers (`docs/18-ads-and-marketing.md`).
  Never a scraper that needs the user's password.
- Do not run this more than once a day per competitor list; the numbers do not move faster.

Method and caveats: `docs/24-competitor-analysis.md`.
