# 10 — Crawl & discovery (crawl4ai) / Crawl & tìm nguồn

## English

Optional pipeline to **feed the agent ideas** from the web. The crawler never
publishes — it only fills an **idea queue** that your publishing agent later reads.

**Pipeline**
```
[cron] → crawl.py ─uses→ sources.yaml
   ① GET  /api/queue?known=1        → set of URLs the server already has (dedup)
   ② crawl each source.list_url     → extract article hrefs by link_pattern → drop known
   ③ crawl each NEW article         → { source_url, title, source_name, lang, excerpt≤1500 }
   ④ POST /api/queue { items:[…] }  → upsert (unique on source_url) + GC 'new' > 7d
[agent] → GET /api/queue?status=new → write ORIGINAL content → PATCH mark posted
```

**`sources.yaml`**
```yaml
max_per_run: 6                      # total NEW items per run
web:
  - name: "Source display name"     # used as source_name/author
    list_url: "https://…/index"     # INDEX page to scan for article links
    link_pattern: "/article/[^/]+$" # REQUIRED regex selecting article URLs
    lang: en                        # vi | en | ko | ja
    max_per_run: 2                  # optional per-source cap
    enabled: true                   # optional
```
`link_pattern` is the one knob you must tune per source — loose patterns catch nav links.

**Queue API contract** (implement on your server; backend is swappable):
- `GET ?known=1` → `{ urls: string[] }` — ALL known source_urls (dedup memory).
- `GET ?status=new&limit=N` → `{ items:[…] }` — work to do.
- `POST { items:[{source_url,title?,source_name?,lang?,excerpt?}] }` → upsert, unique on
  `source_url`, ignore duplicates; GC `new` rows older than N days; keep `posted` forever.
- `PATCH { source_url, status }` → mark `posted` (+ `posted_at`). Bearer-token auth on all.

**Copyright.** Excerpt ≤1500 chars + link only. Prefer public-domain sources. The agent
writes original text from the idea — never republish the crawled text.

**Heavy dep.** crawl4ai needs Chromium (`crawl4ai-setup`) → run in CI or on a machine,
**not** serverless/edge.

### WordPress sources — `wp-fetch.mjs` instead

If the source runs WordPress and exposes `/wp-json/`, skip all of the above. One GET per post
beats a headless browser, and there is no Python, no Chromium and no queue API in the path:

```bash
node scripts/crawl/wp-fetch.mjs --base https://example.com --categories        # find the ids
node scripts/crawl/wp-fetch.mjs --base https://example.com --category 93 \
     --limit 2 --state wp-state.json --out sources/ [--dry-run]
```

It writes `<out>/<slug>/source.json` per post — `{id, slug, link, date, title, subtitle,
excerpt, words, text, images[], categories[]}` — and prints `SOURCE=<dir>` for each, the way
`render.mjs` prints `VIDEO=`. Dedup memory is a local `{"fetchedIds":[…]}` file, **keyed on
the WordPress post id**, not the title (see `docs/04-state-and-dedup.md` for why that matters).

Three things it does that a naive read of `content.rendered` does not:

- **Stops at the byline.** A single-post template appends "related posts" widgets carrying
  *other* posts' images and titles. `cutAtByline()` ends the article at its own
  "Written by …" heading, so a cover image can never come from a different article.
- **Collapses responsive variants.** WordPress offers one upload as `photo-300x200.webp`,
  `photo-768x512.webp`, `photo-1024x683.webp` and `photo.webp`. Stripping the `-WxH` suffix
  turns four "images" back into one, and into the largest copy. `srcset` and the
  lazy-loading attributes are read too — a lazy page hides the real file in `data-src` and
  serves a base64 placeholder as `src`.
- **Refuses paywalled posts.** A membership plugin replaces the body with its upsell before
  the REST API ever sees it, so a gated post looks like a very short article rather than an
  error. `isGated()` matches Paid Memberships Pro, MemberPress and Restrict Content. Do not
  substitute a category check: on the site this was built against, a category literally named
  "Free Cases" holds 130 posts of which **51 are gated**.

Same copyright rule as above. `source.json` is *material to write from*, kept in a scratch
folder; what gets published is original text with a credit and a link.

---

## Tiếng Việt

Pipeline tuỳ chọn để **cấp ý tưởng** cho agent từ web. Crawler KHÔNG đăng — chỉ đổ vào
**idea queue** để agent đăng bài đọc sau.

**Pipeline:** `cron → crawl.py` đọc `sources.yaml` → ① `GET ?known=1` (dedup) → ② crawl
`list_url`, bóc link theo `link_pattern`, bỏ URL đã biết → ③ crawl bài mới lấy
`{source_url,title,source_name,lang,excerpt≤1500}` → ④ `POST {items}` (upsert unique
`source_url`, GC `new`>7d). Agent `GET ?status=new` → viết NGUYÊN TÁC → PATCH mark posted.

**`sources.yaml`:** xem khối YAML bản EN. `link_pattern` là "núm" phải chỉnh mỗi nguồn.

**Hợp đồng Queue API** (tự implement, backend swappable): 4 verb `known / pull / push /
mark`, Bearer auth, unique `source_url`, `posted` giữ vĩnh viễn, GC `new` sau N ngày.

**Bản quyền:** chỉ excerpt ≤1500 ký tự + link; ưu tiên public-domain; agent viết nguyên
tác. **crawl4ai nặng** (cần Chromium) → chạy CI/máy, KHÔNG serverless.

### Nguồn WordPress — dùng `wp-fetch.mjs`

Nguồn chạy WordPress và mở `/wp-json/` thì bỏ hết phần trên: một GET/bài, không Python,
không Chromium, không cần Queue API.

```bash
node scripts/crawl/wp-fetch.mjs --base https://example.com --categories        # tra id
node scripts/crawl/wp-fetch.mjs --base https://example.com --category 93 \
     --limit 2 --state wp-state.json --out sources/ [--dry-run]
```

Ghi `<out>/<slug>/source.json` mỗi bài, in `SOURCE=<dir>` (giống `render.mjs` in `VIDEO=`).
Dedup bằng file `{"fetchedIds":[…]}`, **khoá theo post id chứ không theo tiêu đề** —
`docs/04-state-and-dedup.md` giải thích vì sao.

Ba việc nó làm mà đọc thẳng `content.rendered` không có:

- **Cắt tại dòng ký tên.** Template WordPress chèn widget "related posts" sau bài, mang ảnh
  và tiêu đề của bài KHÁC. `cutAtByline()` kết thúc bài ở heading "Written by …" của chính
  nó, nên ảnh bìa không bao giờ lấy nhầm từ bài khác.
- **Gộp các bản responsive.** WordPress phát một ảnh thành `-300x200`, `-768x512`,
  `-1024x683` và bản gốc. Bỏ hậu tố `-WxH` là bốn "ảnh" quay về một, và về bản lớn nhất.
  Đọc cả `srcset` và các thuộc tính lazy — trang lazy giấu file thật ở `data-src` và trả
  base64 placeholder ở `src`.
- **Từ chối bài sau paywall.** Plugin membership thay thân bài bằng lời mời mua trước khi
  REST API nhìn thấy, nên bài bị khoá trông giống bài rất ngắn chứ không phải lỗi.
  `isGated()` bắt Paid Memberships Pro, MemberPress, Restrict Content. **Đừng thay bằng
  cách lọc theo category:** ở site dùng để dựng tính năng này, category tên đúng nghĩa đen
  là "Free Cases" chứa 130 bài mà **51 bài bị khoá**.
