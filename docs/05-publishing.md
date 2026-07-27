# 05 — Publishing / Đăng bài

## English

The kit assumes your site exposes an **ingest API** with (up to) three endpoints,
protected by a Bearer token (`INGEST_API_TOKEN`). Adapt paths via flags/env.

| Action | Script | Default endpoint | Body |
|---|---|---|---|
| Create | `publish.mjs` | `POST /api/ingest` | full item JSON (`title`, `content[]`, `image`, `category`, tier flags…) |
| Append | `append.mjs` | `POST /api/ingest/append` | `{ id, parts:[{title,content[]}], targetParts }` |
| Update | `update.mjs` | `POST /api/ingest/update` | `{ id, ...changed fields }` |

**Status codes** (recommended contract): `201` created (respond with the new `id`),
`409` duplicate (title/content/source already exists — client treats as done), `400`
validation error (client should NOT retry blindly).

**Images — the re-host pipeline.** Recommended end-to-end path so URLs stay stable and on
your own domain: **local file → temp image host (Cloudinary unsigned preset / Catbox) →
ingest API downloads it → your storage bucket (e.g. Supabase `covers`) → permanent URL** on
the item. If you pass `--image local.png`, the script does the upload and sets the returned
URL; a well-built ingest API then re-hosts that URL into your bucket (an already-bucket URL
is left as-is). Why via a temp host at all: **fan-out subagents can't call the native
image-gen tool** (sandbox), so the parent generates/uploads — see `13-permissions.md`.

**No ingest API?** Point `publish.mjs --path` at whatever POST endpoint you have, or
skip web publishing entirely and use only the social step (`make-post.mjs`).

---

## Tiếng Việt

Kit giả định site có **ingest API** tối đa 3 endpoint, bảo vệ bằng Bearer
(`INGEST_API_TOKEN`). Chỉnh path qua flag/env.

| Việc | Script | Endpoint mặc định | Body |
|---|---|---|---|
| Tạo | `publish.mjs` | `POST /api/ingest` | JSON item đầy đủ |
| Nối kỳ | `append.mjs` | `POST /api/ingest/append` | `{id, parts:[...], targetParts}` |
| Sửa | `update.mjs` | `POST /api/ingest/update` | `{id, ...trường sửa}` |

**Mã trạng thái:** `201` tạo mới (trả `id`), `409` trùng (coi như xong), `400` lỗi
validate (đừng retry mù).

**Ảnh:** `--image local.png` → script upload lên image host rồi gán URL vào payload.

**Không có ingest API?** Trỏ `publish.mjs --path` sang endpoint POST bất kỳ, hoặc bỏ
đăng web, chỉ dùng bước social (`make-post.mjs`).
