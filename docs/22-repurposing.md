# 22 — Repurposing / Tái sử dụng nội dung

## English

The kit is good at making things. Until now it had no answer for **making more from what you
already made** — and for one person that is the difference between three posts a week and
twelve. Not writing more. Getting more out of what is written.

The capability was already here: `examples/ai-video-social/` holds the same Claude Fable 5
source as both an article and a video. Nothing connected "I made this once" to "make five more
from it".

```bash
# in Claude Code
/repurpose            # or just: "make more from this post"
```

### An angle is a different thing the source says

Not the same thing said differently. Rewording one idea five ways is spam; five ideas from one
piece of research is a week of content. The skill pulls angles out of the source rather than
inventing them: the counterintuitive bit, the number, the cost, the how, the disagreement, the
aside.

Four to six from a substantial piece, fewer if the source is short. **It does not pad to hit a
number.**

### It refuses when the source does not deserve it

Repurposing a weak piece multiplies the weakness: five variants of something nobody engaged
with is five times the work for the same silence. The skill is told to say "this one is not
worth it, write something new" — which is the answer people least want and most often need.

### Why a new state file

`brain/repurposed.json` records which angles have gone out, per source.

`history.json` cannot answer that. It is a flat list of published **titles** and dedups by
identity — it knows the source went out, not which angle you used. Its shape is load-bearing:
`append.mjs` and every generated agent read it, so changing it would break running projects for
a feature they may not use.

A separate file costs one more thing to read and breaks nothing.

```json
{
  "rerank-rag-tieng-viet": {
    "sourceTitle": "Rerank trong RAG tiếng Việt",
    "angles": ["counterintuitive", "cost"],
    "lastRepurposedAt": "2026-08-03"
  }
}
```

An angle is recorded **only after it publishes**. Recording at draft time means a rejected
draft burns that angle forever.

### The same gates apply

`validate-post.mjs`, `WRITING_CRAFT.md`, `review-gate`. A repurposed post is a post; the words
existing already is not a reason to skip the checks.

---

## Tiếng Việt

Kit làm ra nội dung rất tốt. Nhưng đến giờ nó không có câu trả lời cho việc **lấy thêm từ thứ
đã làm** — mà với một người làm một mình, đó là khác biệt giữa 3 bài/tuần và 12 bài/tuần.
Không phải viết nhiều hơn. Là lấy được nhiều hơn từ thứ đã viết.

Khả năng vốn đã có sẵn: `examples/ai-video-social/` là cùng một nguồn Claude Fable 5 ra hai
định dạng, bài viết và video. Chỉ là không có gì nối "tôi làm cái này một lần" với "làm thêm
năm cái từ nó".

### Góc nhìn là một điều KHÁC mà nguồn nói ra

Không phải cùng một điều nói theo cách khác. Viết lại một ý năm kiểu là spam; rút năm ý từ một
lần nghiên cứu là nội dung cho cả tuần. Skill lấy góc nhìn **từ chính nguồn**: chỗ phản trực
giác, con số, cái giá phải trả, cách làm, chỗ gây tranh cãi, chi tiết bên lề.

Bốn đến sáu góc cho một bài dày. Ít hơn nếu nguồn ngắn — **không độn cho đủ số**.

### Nó từ chối khi bài gốc không đáng

Tái sử dụng một bài yếu chỉ nhân cái yếu lên: năm biến thể của thứ không ai tương tác là gấp
năm lần công sức cho cùng một sự im lặng. Skill được yêu cầu nói thẳng "cái này không đáng,
viết bài mới đi" — câu trả lời người ta ít muốn nghe nhất và thường cần nhất.

### Vì sao thêm file trạng thái mới

`history.json` không trả lời được câu hỏi này: nó là danh sách **tiêu đề** đã đăng, dedup theo
danh tính — biết nguồn đã ra, không biết bạn đã dùng góc nào. Hình dạng của nó lại đang gánh
việc: `append.mjs` và mọi agent sinh ra đều đọc nó, đổi shape là phá dự án đang chạy vì một
tính năng họ có thể không dùng.

Một file riêng chỉ tốn thêm một lần đọc và không phá gì cả.
