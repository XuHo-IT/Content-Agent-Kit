# Example — AI News Social Agent

A complete worked agent built with this kit: it **discovers** AI-news sources, **writes**
original Vietnamese articles, generates a 16:9 image, **publishes** (optional web) and
**posts to social** via Make.com, on a **cron** schedule. Env-only, no hardcoded secrets.

> Ví dụ hoàn chỉnh: agent tin tức AI — tự **tìm nguồn** → **viết bài nguyên tác** → **ảnh**
> → **đăng web + Make.com social** → chạy **cron**. Env-only, không hardcode secret.

## The loop

```
[cron: GitHub Actions]                 (daily)
      │
      ▼
crawl.py (crawl4ai) ── reads sources.yaml ── GET /api/queue?known=1 (dedup)
      │  → crawl new AI-news index pages → excerpt(≤1500)+link → POST /api/queue {items}
      ▼
[agent daily-run per PLAYBOOK.md]
   GET /api/queue?status=new  → for each idea:
      write ORIGINAL 800–1500-word VN article (Meta/Slug hidden) + engagement comment
      generate 16:9 image
      → REVIEW gate (independent subagent)
      → (optional) publish.mjs to web
      → build-queue.mjs (random times) → make-post.mjs → Make.com {mediaUrl,image_url,post,comment}
      → PATCH /api/queue mark posted
   report → brain/<id>/daily_content_report.md
```

## Files here
- `PLAYBOOK.md` — the daily SOP (cadence, format rules, review gate, publish, cron).
- `KNOWLEDGE.md` — API + webhook contracts + article schema.
- `sources.yaml` — AI-news index pages to crawl.
- `schedule-prompt.md` — the daily trigger prompt.
- `.github/workflows/daily.yml` — cron that runs the crawl (+ can trigger the run).

## Uses the kit's generic scripts (no duplication)
Run from the repo root (env in `.env`):
```bash
# discovery (usually via cron)
python scripts/crawl/crawl.py --limit 6

# a run (usually via the daily-run skill / scheduled prompt)
node scripts/queue-client.mjs pull
# … agent writes items.json + images …
node scripts/scheduler/build-queue.mjs items.json --out queue.json --windows 4
node scripts/scheduler/run-item.mjs 1 --queue queue.json     # or register-tasks / cron
node scripts/queue-client.mjs posted "<source_url>"
```

## Setup
1. `cp .env.example .env` and fill `SITE_URL`, `INGEST_API_TOKEN`, `MAKE_WEBHOOK_URL`,
   Cloudinary (or `IMAGE_HOST=catbox`).
2. Point `sources.yaml` at real AI-news index pages; tune each `link_pattern`
   (`python scripts/crawl/crawl.py --dry-run`).
3. Add the same secrets to GitHub repo Settings → Secrets for the cron workflow.
4. Trigger a run: `/daily-run` (Claude Code) or paste `schedule-prompt.md` into your scheduler.
