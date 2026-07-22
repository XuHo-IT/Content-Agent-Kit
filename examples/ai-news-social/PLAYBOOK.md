# AI News Social Agent — PLAYBOOK

> Read this every run. Source of truth. Env-only; never hardcode secrets.

## 0. One-line summary
Discover AI-news sources, write original Vietnamese articles + engagement comments,
generate a 16:9 image each, and post to social (Make.com) — optionally also to the web.

## 0b. Voice & language
- **Vietnamese, full diacritics.** Clear, engaging, credible tech-journalism tone.
- No `##`-style headings inside the post body. Never brand as "(AI)".
- Outro line: `Thế bạn nghĩ sao về: <hook question>?`
- A GitHub/product link (if any) goes in the COMMENT, never in the post body.

## 1. Cadence  (phase = day-of-year mod 1 → every day)
- **≥4 image-post articles/day.** Little but high quality. (No video/voice.)
- Ideas come from the crawl queue when available; otherwise pick 4 fresh AI topics.

## 2. Fan-out
One subagent per article (4+), run in parallel. Each: research from the idea/excerpt →
write → propose image prompt.

## 2b. REVIEW gate (mandatory — docs/07)
Independent review subagent per article: facts sane, 800–1500 words, VN diacritics, no
plagiarism of the source (original phrasing), image on-topic 16:9 not distorted, hashtags
valid, Meta/Slug present. Pass → publish. Fail → fix (2–3 rounds) → drop + log.

## 3. Images
Generate one **16:9** illustration per article (integrated image model). One distinct
image per article; never reuse. Save locally; the social step uploads it.

## 3b. Author
Random human pen-name. Never "(AI)".

## 3c. Access tiers
Social posts are public. (If also publishing to web, default LOGIN; feature ~20% free.)

## 4. Per-item schema
### Article (for social + optional web)
```json
{
  "title": "Compelling VN title",
  "post": "Meta: <150–160 char SEO desc>\nSlug: <kebab-slug>\n\n<800–1500 word article, VN diacritics, outro question>",
  "comment": "Friendly engagement comment + up to 5 hashtags (link here if any)",
  "image": "scratch/news_1.png"
}
```
- Hidden `Meta:`/`Slug:` lines lead the post text (stripped by the web ingest if used).
- Copyright: write ORIGINAL text from the crawled EXCERPT; never copy/translate verbatim.

## 5. Publish + schedule
- Pull ideas: `node scripts/queue-client.mjs pull`.
- (Optional web) `node scripts/publish.mjs <article>.json --image scratch/news_1.png`.
- Social: `node scripts/scheduler/build-queue.mjs items.json --windows 4 --gap 90` →
  `run-item.mjs`/`register-tasks.mjs`/cron → each fires `make-post.mjs`
  (`{mediaUrl,image_url,post,comment}`).
- After each source used: `node scripts/queue-client.mjs posted "<source_url>"`.

## 6. Dedup
Check `history.json` (titles) + the crawl queue dedups sources by URL. `409` = done.

## 7. Cleanup
Delete per-run scratch (`items.json`, temp PNGs) at the end. Keep `queue.json` + `history.json`.

## 7b. Report
`brain/<id>/daily_content_report.md`: topics chosen, review results, posted/failed, next-day plan.

## 8. Required env
`SITE_URL`, `INGEST_API_TOKEN` (crawl + optional web), `MAKE_WEBHOOK_URL`,
`CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_UNSIGNED_PRESET` (or `IMAGE_HOST=catbox`).

## ⚠️ Never do
- No video/voice generation. No verbatim copy/translation of sources. No "(AI)" branding.
- Never hardcode the Make webhook / token / Cloudinary account — env-only.
