#!/usr/bin/env python3
"""crawl.py — generic crawl4ai discovery → idea queue.

Reads `sources.yaml`, crawls each source's INDEX page, extracts article links by
`link_pattern`, drops URLs the server already knows (dedup), crawls the NEW
articles, and pushes {source_url,title,source_name,lang,excerpt} to your queue API.

COPYRIGHT-SAFE: stores an EXCERPT only (<=1500 chars) + the source link. Never the
full text. Your publishing agent then writes ORIGINAL content from the idea.

Usage:
    python crawl.py [--limit N] [--dry-run] [--sources sources.yaml]

Env: INGEST_API_TOKEN (required to fetch-known/push), SITE_URL (required),
     QUEUE_PATH (optional, default /api/queue).
Deps: see requirements.txt, then run `crawl4ai-setup` once (installs Chromium).
"""
import argparse
import os
import re
import sys
from urllib.parse import urljoin, urlsplit, urlunsplit

import requests
import yaml


def env(name, default=None, required=False):
    v = os.environ.get(name, default)
    if required and not v:
        sys.exit(f"Missing required env var {name} (env-only; no fallback).")
    return v


SITE_URL = (env("SITE_URL", required=True) or "").rstrip("/")
TOKEN = env("INGEST_API_TOKEN", required=True)
QUEUE_PATH = env("QUEUE_PATH", "/api/queue")
AUTH = {"Authorization": f"Bearer {TOKEN}"}


def norm_url(u: str) -> str:
    """Normalize for dedup: drop fragment, lowercase host, strip trailing slash."""
    try:
        s = urlsplit(u.strip())
        path = s.path.rstrip("/") or "/"
        return urlunsplit((s.scheme.lower(), s.netloc.lower(), path, s.query, ""))
    except Exception:
        return u.strip()


def fetch_known() -> set:
    """The SERVER is the dedup memory (CI runners are ephemeral)."""
    known, page = set(), 1
    while True:
        r = requests.get(f"{SITE_URL}{QUEUE_PATH}?known=1&page={page}", headers=AUTH, timeout=60)
        r.raise_for_status()
        urls = r.json().get("urls", [])
        if not urls:
            break
        known.update(norm_url(u) for u in urls)
        if len(urls) < 1000:
            break
        page += 1
    return known


def push_queue(items):
    r = requests.post(f"{SITE_URL}{QUEUE_PATH}", json={"items": items}, headers=AUTH, timeout=120)
    r.raise_for_status()
    return r.json()


async def crawl_all(sources, total_limit, dry_run):
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig  # lazy import (heavy)
    from crawl4ai.content_filter_strategy import PruningContentFilter
    from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

    cfg = CrawlerRunConfig(
        markdown_generator=DefaultMarkdownGenerator(
            content_filter=PruningContentFilter(threshold=0.5)
        )
    )
    known = set() if dry_run else fetch_known()
    picked = []

    async with AsyncWebCrawler() as crawler:
        for src in sources:
            if src.get("enabled") is False:
                continue
            cap = src.get("max_per_run", total_limit)
            pat = re.compile(src["link_pattern"])
            index = await crawler.arun(url=src["list_url"], config=cfg)
            hrefs = [l.get("href") for l in (index.links or {}).get("internal", []) if l.get("href")]
            hrefs += re.findall(r'href=["\']([^"\']+)["\']', index.html or "")
            seen, links = set(), []
            for h in hrefs:
                absu = urljoin(src["list_url"], h)
                nu = norm_url(absu)
                if nu in seen or nu in known:
                    continue
                if not pat.search(absu):
                    continue
                seen.add(nu)
                links.append(absu)
                if len(links) >= 200:
                    break

            per = 0
            for link in links:
                if len(picked) >= total_limit or per >= cap:
                    break
                if dry_run:
                    print(f"  [{src['name']}] {link}")
                    picked.append(link)
                    per += 1
                    continue
                art = await crawler.arun(url=link, config=cfg)
                md = (getattr(art.markdown, "fit_markdown", "") or "").strip()
                if len(md) < 120:
                    continue
                picked.append({
                    "source_url": link,
                    "title": (art.metadata or {}).get("title", "").strip()[:300],
                    "source_name": src["name"],
                    "lang": src.get("lang", "en"),
                    "excerpt": md[:1500],
                })
                known.add(norm_url(link))
                per += 1
    return picked


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--sources", default=os.path.join(os.path.dirname(__file__), "sources.yaml"))
    args = ap.parse_args()

    conf = yaml.safe_load(open(args.sources, encoding="utf-8"))
    total = args.limit or conf.get("max_per_run", 6)
    sources = conf.get("web", [])

    import asyncio
    picked = asyncio.run(crawl_all(sources, total, args.dry_run))

    if args.dry_run:
        print(f"[dry-run] {len(picked)} new link(s) found. Nothing pushed.")
        return
    if not picked:
        print("[crawl] no new articles.")
        return
    res = push_queue(picked)
    import json
    with open("queue_raw.json", "w", encoding="utf-8") as f:
        json.dump(picked, f, ensure_ascii=False, indent=2)
    print(f"[crawl] pushed {len(picked)} → queue: {res}")


if __name__ == "__main__":
    main()
