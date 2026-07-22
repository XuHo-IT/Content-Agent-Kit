# 11 — Social posting (Make.com) / Đăng social (Make.com)

## English

Push finished posts to social platforms through an automation webhook
(**Make.com** / n8n / Zapier). The webhook scenario handles the platform APIs; the kit
just sends a normalized payload.

**Payload** (`scripts/social/make-post.mjs` → `MAKE_WEBHOOK_URL`)
```json
{
  "mediaUrl":  "https://…/image.jpg",
  "image_url": "https://…/image.jpg",   // alias of mediaUrl (some scenarios read this key)
  "post":      "full post text",
  "comment":   "first-comment / engagement text"
}
```

**Image flow.** If you pass a local file, the script uploads it first (Cloudinary
unsigned preset or Catbox — set `IMAGE_HOST`) and puts the resulting URL in
`mediaUrl`/`image_url`. Pass a URL to skip upload.

**Queue integration.** `make-post.mjs --queue queue.json --id 3` sends one queued item
and flips its `status` to `posted` (with `postedAt`) or `failed` (with `error`) — so a
scheduled run is safe to retry.

**Set up the Make scenario:** Webhook (custom) → parse `post`/`comment`/`mediaUrl` →
your social module(s). Put the resulting webhook URL in `MAKE_WEBHOOK_URL`.

---

## Tiếng Việt

Đẩy bài hoàn chỉnh lên mạng xã hội qua webhook automation (**Make.com**/n8n/Zapier).
Kịch bản webhook lo API nền tảng; kit chỉ gửi payload chuẩn hoá.

**Payload** (`scripts/social/make-post.mjs` → `MAKE_WEBHOOK_URL`): xem khối JSON bản EN
— `{mediaUrl, image_url (alias), post, comment}`.

**Luồng ảnh:** truyền file local → script upload trước (Cloudinary unsigned / Catbox,
đặt `IMAGE_HOST`) rồi gắn URL vào `mediaUrl`. Truyền sẵn URL thì bỏ qua upload.

**Tích hợp queue:** `make-post.mjs --queue queue.json --id 3` gửi 1 item và đổi `status`
→ `posted` (kèm `postedAt`) hoặc `failed` (kèm `error`) — chạy lịch retry an toàn.

**Dựng kịch bản Make:** Webhook (custom) → đọc `post`/`comment`/`mediaUrl` → module
social. Dán URL webhook vào `MAKE_WEBHOOK_URL`.
