# 23 — Topic research / Nghiên cứu chủ đề theo ngày

## English

The kit could always turn *a thing you already had* into a video. What it could not do was
answer the question people actually start the morning with: **"what should today's video be
about?"**

`crawl-and-queue` was the closest thing, and it answers a different question. It crawls a
fixed `sources.yaml` on a schedule, into a queue, for an agent that already knows its beat.
It cannot take a topic somebody says out loud at 8am and come back with what is hot in it.

```bash
# in Claude Code
/topic-radar AI coding agents        # ranked shortlist
/daily-topic-video AI coding agents  # …and the finished, published short
```

### Four sources, no keys

| source | what it is good at | signal |
| --- | --- | --- |
| Reddit | what people are arguing about | upvotes, comments |
| Hacker News | what builders noticed | points, comments |
| GitHub | what got built this month (`created:`, not `pushed:`) | stars |
| Google News | what the wire is carrying | — |

Every one of them answers without an account. That is a deliberate constraint, not a
limitation reluctantly accepted: a research layer that needs five API keys is a research layer
most people never switch on, and the kit's whole premise is that a fresh clone works.

`GITHUB_TOKEN` is read if present, but only to raise a rate limit — never to unlock a source.

### score = heat × freshness × crossSource

Three numbers, each answering something the other two cannot.

**heat** is a percentile *within its own source*, not a raw count. Ten thousand upvotes, ten
thousand stars and ten thousand points are three different things, and normalising by the
maximum lets one runaway post flatten everything beneath it to nearly zero. A source that
carries no engagement numbers at all — an RSS wire — gets a neutral heat rather than the floor,
because *no signal* and *the weakest signal* are not the same claim.

**freshness** halves every three days by default (`--half-life`). Breaking news wants `1`.

**crossSource** multiplies by 1.5 per additional source carrying the same story. This is the
strongest single indicator that something is genuinely happening rather than one community
being loud, and it is the reason dedup runs *before* scoring instead of after.

### The ledger is the point

`brain/radar-seen.json` records what the radar **handed out** — not everything it found. Ask
the same topic two mornings running and the second morning is genuinely different.

Recording everything found would bury a story that ranked 40th on Monday and was never shown
to anyone. Recording nothing gives you the same top story every day until it decays, which is
how a daily channel ends up posting one piece of news three times in a week.

### It says when there is nothing

Some mornings a topic has produced nothing new. The script exits with an empty `RADAR=` and
says so, and the skill is explicit that this is a usable answer rather than a failure to work
around. The alternative — silently widening the window, or filling the gap from memory —
produces a confident video about something that did not happen.

### Reddit's JSON API is gone for unauthenticated clients

It 403s from most networks now; it wants OAuth. The source falls back to Reddit's Atom feed,
which still answers the same query and still carries the posts, but has no vote counts. That
downgrade is **printed in the report**:

```
- `reddit` — 47 items — RSS fallback (JSON API: HTTP 403 Blocked) — no vote counts
```

A ranking that quietly got weaker is much harder to debug than one that says why it did.

### Layers

```
scripts/research/lib/sources.mjs   network. one shape out, never throws the run
scripts/research/lib/rank.mjs      pure. no network, no fs, no clock — `now` is an argument
scripts/research/hot-sources.mjs   raw output from one or more sources
scripts/research/topic-radar.mjs   fetch → dedup → score → drop-seen → write → RADAR=<path>
```

`rank.mjs` takes `now` as a parameter rather than reading the clock. That is what lets the
scoring be tested at all: a ranking test that calls `Date.now()` starts failing three days
after it is written, so it gets deleted, and the most judgement-heavy code in the layer ends
up as the only part with no tests.

See also: `skills/topic-radar/SKILL.md`, `skills/daily-topic-video/SKILL.md`,
`docs/10-crawl-discovery.md` (the scheduled-queue alternative), `docs/15-media-sources.md`.

---

## Tiếng Việt

Kit vốn giỏi biến **một thứ bạn đã có** thành video. Thứ nó chưa làm được là trả lời đúng câu
người ta hỏi mỗi sáng: **"hôm nay làm video về cái gì?"**

`crawl-and-queue` gần nhất với việc đó, nhưng nó trả lời một câu khác. Nó crawl một
`sources.yaml` cố định theo lịch, đổ vào queue, cho một agent đã biết mảng của mình. Nó không
nhận một chủ đề bạn nói ra lúc 8 giờ sáng rồi trả về cái gì đang nóng trong đó.

```bash
/topic-radar AI coding agents        # danh sách rút gọn đã xếp hạng
/daily-topic-video AI coding agents  # …và video hoàn chỉnh đã đăng
```

### Bốn nguồn, không cần key

| nguồn | mạnh ở đâu | tín hiệu |
| --- | --- | --- |
| Reddit | thứ người ta đang tranh cãi | upvote, comment |
| Hacker News | thứ dân dev để ý | point, comment |
| GitHub | thứ vừa được build tháng này (`created:`, không phải `pushed:`) | star |
| Google News | thứ báo chí đang đưa | — |

Cả bốn đều trả lời mà không cần tài khoản. Đây là ràng buộc cố ý: một lớp research cần năm API
key là lớp research đa số người không bao giờ bật, mà tiền đề của kit là clone về là chạy được.

`GITHUB_TOKEN` được đọc nếu có, nhưng chỉ để nâng rate limit — không bao giờ để mở khoá một nguồn.

### điểm = heat × freshness × crossSource

**heat** là percentile **trong chính nguồn đó**, không phải con số thô. Mười nghìn upvote, mười
nghìn star và mười nghìn point là ba thứ khác nhau; chuẩn hoá theo giá trị lớn nhất sẽ khiến
một bài đột biến dìm mọi thứ còn lại về gần không. Nguồn hoàn toàn không có số tương tác — như
RSS — nhận heat trung tính chứ không phải mức sàn, vì *không có tín hiệu* và *tín hiệu yếu nhất*
là hai khẳng định khác nhau.

**freshness** giảm một nửa sau mỗi ba ngày (`--half-life`). Tin nóng thì để `1`.

**crossSource** nhân 1.5 cho mỗi nguồn phụ cùng đưa một chuyện. Đây là chỉ dấu mạnh nhất cho
biết chuyện đó *thật sự* đang xảy ra chứ không phải một cộng đồng đang ồn ào — và cũng là lý do
khử trùng chạy **trước** khi chấm điểm.

### Sổ ghi nhớ mới là mấu chốt

`brain/radar-seen.json` ghi lại thứ radar **đã đưa ra** — không phải mọi thứ nó tìm thấy. Hỏi
cùng một chủ đề hai sáng liên tiếp thì sáng thứ hai thật sự khác.

Ghi hết mọi thứ tìm thấy sẽ chôn luôn một tin xếp thứ 40 hôm thứ Hai mà chưa ai nhìn thấy. Không
ghi gì thì ngày nào cũng ra đúng một tin đầu bảng cho tới khi nó cũ đi — đó là cách một kênh
daily đăng cùng một tin ba lần trong một tuần.

### Nó nói thẳng khi không có gì

Có những sáng một chủ đề không có gì mới. Script thoát với `RADAR=` rỗng và nói rõ điều đó; skill
ghi hẳn rằng đây là một câu trả lời dùng được, không phải một lỗi cần lách. Cách còn lại — âm
thầm nới cửa sổ thời gian, hoặc lấp chỗ trống bằng trí nhớ — sẽ đẻ ra một video tự tin về một
chuyện chưa từng xảy ra.

### JSON API của Reddit đã đóng với client không đăng nhập

Nó trả 403 từ hầu hết mạng, và đòi OAuth. Nguồn tự rơi về Atom feed của Reddit — vẫn trả lời
đúng truy vấn đó, vẫn có bài, nhưng không có số vote. Việc xuống cấp này được **in ra trong báo
cáo**:

```
- `reddit` — 47 items — RSS fallback (JSON API: HTTP 403 Blocked) — no vote counts
```

Một bảng xếp hạng âm thầm yếu đi khó debug hơn nhiều so với một bảng nói rõ vì sao.

### Các tầng

```
scripts/research/lib/sources.mjs   mạng. một shape duy nhất, không bao giờ làm hỏng cả lượt chạy
scripts/research/lib/rank.mjs      thuần. không mạng, không fs, không đồng hồ — `now` là tham số
scripts/research/hot-sources.mjs   dữ liệu thô từ một hoặc nhiều nguồn
scripts/research/topic-radar.mjs   fetch → khử trùng → chấm điểm → bỏ tin đã dùng → ghi → RADAR=
```

`rank.mjs` nhận `now` làm tham số thay vì đọc đồng hồ. Chính điều đó khiến phần chấm điểm test
được: một test xếp hạng có gọi `Date.now()` sẽ bắt đầu fail ba ngày sau khi viết, rồi bị xoá, và
phần nhiều phán đoán nhất của cả lớp này thành phần duy nhất không có test.

Xem thêm: `skills/topic-radar/SKILL.md`, `skills/daily-topic-video/SKILL.md`,
`docs/10-crawl-discovery.md` (hướng queue theo lịch), `docs/15-media-sources.md`.
