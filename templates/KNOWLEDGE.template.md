# {{AGENT_NAME}} — KNOWLEDGE (API & schema reference)

> Technical contracts the scripts + agent rely on. Keep this accurate; the PLAYBOOK
> points here for exact shapes.

## Ingest API
Base: `{{SITE_URL}}` · Auth: `Authorization: Bearer $INGEST_API_TOKEN` on all writes.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `{{/api/ingest}}` | full item JSON | `201 { id }` · `409` duplicate · `400` invalid |
| POST | `{{/api/ingest/append}}` | `{ id, parts:[{title,content[]}], targetParts }` | `200` |
| POST | `{{/api/ingest/update}}` | `{ id, ...fields }` | `200` |

Semantics: **201** created (store the id in ledger/history) · **409** already exists
(treat as done) · **400** validation error (fix, don't blind-retry).

## Queue API (if crawling — see docs/10)
`GET ?known=1` → `{ urls }` · `GET ?status=new&limit=N` → `{ items }` ·
`POST { items:[…] }` → upsert unique `source_url` · `PATCH { source_url, status }`.

## Social webhook
`POST $MAKE_WEBHOOK_URL` body `{ mediaUrl, image_url, post, comment }`.

## Item schemas (canonical)
### {{type A}}
```json
{{full field list with types}}
```
### {{type B}}
```json
{{full field list with types}}
```

## Gotchas
- If the host project is `"type":"module"`, name CommonJS helper scripts `*.cjs`.
- Image host: {{Cloudinary unsigned preset `{{PRESET}}` / Catbox}}; local file → upload → URL.
- {{Any per-project quirks}}.

## Required env
`SITE_URL`, `INGEST_API_TOKEN`{{, MAKE_WEBHOOK_URL, CLOUDINARY_*, SUPABASE_* …}}.
