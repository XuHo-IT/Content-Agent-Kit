---
name: crawl-and-queue
description: Run the crawl4ai discovery pipeline to fill the idea queue for an agent built with content-agent-kit. Use when the user says "crawl for ideas / news", "refresh the idea queue", or when setting up scheduled discovery. Crawls sources.yaml, dedups against the queue API, pushes fresh excerpts.
---

# Crawl → idea queue

1. **Check `sources.yaml`** exists and each source has a `list_url` + a tuned
   `link_pattern`. Loose patterns catch navigation links — verify with a dry run:
   `python scripts/crawl/crawl.py --dry-run` (prints found links only, pushes nothing).
2. **Ensure deps** (once): `pip install -r scripts/crawl/requirements.txt && crawl4ai-setup`
   (installs Chromium — run in CI or on a real machine, not serverless).
3. **Ensure env**: `SITE_URL`, `INGEST_API_TOKEN` (+ `QUEUE_PATH` if not `/api/queue`).
4. **Run**: `python scripts/crawl/crawl.py [--limit N]`. It:
   - GETs `?known=1` to skip URLs the server already has (server = dedup memory),
   - extracts new article links, crawls them, keeps **excerpt ≤1500 chars + link only**,
   - POSTs `{ items }` to the queue (upsert, unique on `source_url`).
5. **Copyright**: never store or republish full source text. The publishing agent writes
   ORIGINAL content from the idea. Prefer public-domain / permitted sources.
6. For automation, install the cron workflow from `templates/workflows/crawl.yml.template`
   and add `SITE_URL` + `INGEST_API_TOKEN` to repo secrets.

> Antigravity: same steps, run the commands directly.
