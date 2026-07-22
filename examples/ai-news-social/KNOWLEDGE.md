# AI News Social Agent — KNOWLEDGE

## Social webhook (Make.com) — primary channel
`POST $MAKE_WEBHOOK_URL`
```json
{ "mediaUrl": "<image url>", "image_url": "<same url>", "post": "<article>", "comment": "<comment>" }
```
Non-2xx → treat as failed; the queue item is marked `failed` with the error and can retry.

## Image host
`IMAGE_HOST=cloudinary` (unsigned preset `$CLOUDINARY_UNSIGNED_PRESET`, cloud
`$CLOUDINARY_CLOUD_NAME`, optional `$CLOUDINARY_FOLDER`) or `IMAGE_HOST=catbox`.
Local PNG → `uploadImage()` in `scripts/lib/http.mjs` → public URL → `mediaUrl`.

## Crawl idea queue — `/api/queue` (Bearer `$INGEST_API_TOKEN`)
- `GET ?known=1` → `{ urls: string[] }` (dedup memory).
- `GET ?status=new&limit=N` → `{ items:[{source_url,title,source_name,lang,excerpt}] }`.
- `POST { items:[…] }` → upsert unique `source_url`; GC `new` > 7 days; keep `posted`.
- `PATCH { source_url, status:"posted" }` → mark done.

## Optional web publish — `/api/ingest`
`POST` full article JSON with `title`, `content`/`post`, `image`. `201 {id}` / `409` dup.

## Article rules (SEO)
800–1500 words, VN with diacritics, hidden `Meta:` (150–160 chars) + `Slug:` header lines,
outro `Thế bạn nghĩ sao về: …?`, ≤5 hashtags in the comment, links only in the comment.

## Required env
`SITE_URL`, `INGEST_API_TOKEN`, `MAKE_WEBHOOK_URL`, `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_UNSIGNED_PRESET` (or `IMAGE_HOST=catbox`).
