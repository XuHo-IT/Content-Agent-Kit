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
