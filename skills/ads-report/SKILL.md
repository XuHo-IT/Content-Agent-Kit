---
name: ads-report
description: Read ad performance from the connected ads MCP servers (Meta, Google, TikTok, Snap, Reddit) and turn it into a decision about what content to make next, for an agent built with content-agent-kit. Also works with no ad spend at all — paste the numbers the platform shows you and it reports the same way. Use weekly, or when the user asks "how did the ads do", "how did last week do", "what should we post next", or "which campaigns are wasting money". Writes a short report and proposes concrete queue items.
---

# Ads report → next week's content

Numbers are not the deliverable. **A decision about what to write next is.** A report that
ends at "CTR was 1.4%" leaves the reader exactly where they started.

This skill closes the loop the kit otherwise leaves open: it publishes content, and it
schedules content, but nothing tells it which content was worth publishing.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Chọn cách lấy số | Có kết nối quảng cáo (MCP) thì đọc thẳng; không có thì nhờ dán số từ màn hình | Dán số liệu theo từng bài/mẫu, hoặc bật kết nối |
| 2. Chọn kỳ | Mặc định 7 ngày gần nhất so với 7 ngày trước; ghi rõ đơn vị tiền và múi giờ | Đổi kỳ nếu muốn |
| 3. Lọc nhiễu | Bỏ những gì quá ít hiển thị, ghi vào mục "chưa đủ dữ liệu" | — |
| 4. Viết báo cáo | Ghi `brain/ads-report-<ngày>.md`: cái gì hiệu quả, cái gì không, không lặp lại gì — mỗi ý kèm con số | Đọc báo cáo (một màn hình) |
| 5. Đề xuất nội dung tuần tới | In sẵn các mục định thêm vào `queue.json` | Đồng ý mục nào thì nói |
| 6. Dừng — không đụng tài khoản | Không tự đổi ngân sách, tắt hay tạo chiến dịch | Tự thao tác nếu muốn đổi |

**Hay vướng:**
- Chưa cài theo dõi chuyển đổi (pixel) → báo cáo dừng ở lượt click, không ghi "0 đơn" như một kết quả.
- So mẫu chạy 2 ngày với mẫu chạy 14 ngày → agent sẽ loại hoặc quy đổi và nói rõ.
- Không chạy quảng cáo → vẫn dùng được, dán lượt xem, chia sẻ, lưu của từng bài.

## Before you start

Do **not** invent plausible numbers to fill a report. A fabricated benchmark is worse than no
report, because someone will spend money on it. That rule holds in both modes below.

**Paid mode.** At least one ads MCP server connected — see `.mcp.json` and
`docs/18-ads-and-marketing.md`.

**Organic mode.** No ads server, which is where most people start and where this skill used to
simply stop — leaving anyone not yet buying reach with nothing at all, even though they have
the same question. Ask the user to paste what the platform shows them: views, reach, shares,
comments, saves, watch-through, per post, for a period they choose.

Everything below works the same way on pasted numbers, with three differences worth stating in
the report itself:

- **Say the numbers are self-reported.** They came from a screen, not an API. That does not
  make them wrong; it makes them worth labelling.
- **Shares and saves matter more than views here.** Without spend data there is no cost per
  anything, so the useful signal is what people did deliberately rather than what scrolled past.
- **The sample is smaller, so the bar for calling something is higher.** Two posts are not a
  trend. Be readier to write "not enough data" than in paid mode.

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
