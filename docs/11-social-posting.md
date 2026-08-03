# 11 — Social posting (Make.com) / Đăng social (Make.com)

## English

Push finished posts — **image or video** — to social platforms through an automation webhook
(**Make.com** / n8n / Zapier). The webhook scenario handles the platform APIs; the kit just
sends a normalized payload.

**Payload** (`scripts/social/make-post.mjs` → `MAKE_WEBHOOK_URL`)

```json
{
  "kind":         "video",                      // "image" | "video"
  "mediaUrl":     "https://…/video.mp4",        // the thing to publish
  "image_url":    "https://…/thumb.jpg",        // image post: the image; video post: the cover
  "post":         "full post text",
  "comment":      "first-comment / engagement text",

  "video_url":    "https://…/video.mp4",        // video only — alias of mediaUrl
  "thumbnailUrl": "https://…/thumb.jpg",        // video only — alias of image_url
  "aspect":       "9:16",                       // video only
  "durationSec":  96,                           // video only, when known

  "title":        "title for platforms that need one (YouTube)",
  "hashtags":     "#ai #coding",
  "platforms":    ["tiktok", "youtube_shorts", "facebook_reels", "instagram_reels"]
}
```

**`post` and `comment` are PLAIN TEXT.** No caption on Facebook, Instagram, TikTok or YouTube
renders Markdown, so a heading arrives as the literal characters `### Heading`, `**bold**`
keeps its asterisks, and a metadata block a writer left at the top of the draft becomes the
first thing anyone reads:

```
Meta: Claude Fable 5 đạt điểm cao nhất ở gần như mọi bài kiểm tra…
Slug: claude-fable-5-ra-mat-roi-bi-go-sau-ba-ngay
```

That is not hypothetical — it is what this repo's own reference sample shipped with until it
was fixed. Metadata is useful; it just belongs in its own fields (`title`, `metaDescription`,
`slug`), never inside the body.

`make-post.mjs` refuses to send text that fails this check. To inspect or repair it:

```bash
node scripts/social/validate-post.mjs post.json            # what a reader would see wrong
node scripts/social/validate-post.mjs post.json --strict    # ambiguous cases fail too
node scripts/social/validate-post.mjs post.json --fix       # writes post.clean.json, never overwrites
node scripts/social/make-post.mjs --json post.json --no-validate   # publish as is anyway
```

Errors block the send. Warnings do not, because they cover text that is ambiguous in
Vietnamese prose — a line beginning `- ` is a bullet in Markdown and a dialogue dash in a
story, and a gate that fails on dialogue is a gate people switch off.

**Back-compatible.** An image post still carries exactly `{mediaUrl, image_url, post, comment}`
with the same meanings as before — `kind`, `title`, `hashtags` and `platforms` are additions.
An existing scenario reading the old four keys keeps working untouched.

**Media flow.** Pass a local file and the script uploads it first, then puts the resulting URL in
the payload. `MEDIA_HOST` picks the host (`cloudinary` | `catbox`); the older `IMAGE_HOST` is
still read as a fallback. Cloudinary uses the right resource endpoint per kind
(`/image/upload` vs `/video/upload`) — posting a video to the image endpoint fails. Pass a URL
to skip the upload. Files over the host's ceiling (Cloudinary ~10 MB image / ~100 MB video on
the free tier, Catbox 200 MB) fail fast with a clear message rather than a doomed POST.

**Platforms.** `--platforms a,b,c` or the `SOCIAL_PLATFORMS` env default. The kit does not talk
to any platform itself — it just tells the scenario where the post is meant to go.

| value | Make module | notes |
|---|---|---|
| `tiktok` | TikTok | 9:16 native; the pipeline's output format |
| `youtube_shorts` | YouTube → Upload a video | needs `title`; under 60s auto-becomes a Short |
| `facebook_reels` | Facebook Pages | Reels or a plain Page video post |
| `instagram_reels` | Instagram for Business | requires a **publicly reachable** video URL |

### Building the Make scenario, step by step

The kit sends the payload; the scenario does everything else. Roughly ten minutes:

1. **New scenario → Webhooks → Custom webhook → Add.** Copy the URL into `MAKE_WEBHOOK_URL`
   in your `.env` (never into a file you commit).
2. **Let Make learn the shape.** With the webhook listening, run a dry-run's worth of real
   payload at it:
   ```bash
   node scripts/social/make-post.mjs --json brain/<slug>/post.json --dry-run   # read it first
   node scripts/social/make-post.mjs --json brain/<slug>/post.json             # then send
   ```
   Make captures the structure and every field becomes mappable by name. Skipping this leaves
   you hand-typing field names.
3. **Add a Router** after the webhook, one route per platform.
4. **Filter each route** on `platforms[]` — condition *Array contains* `tiktok`,
   `youtube_shorts`, `facebook_reels`, `instagram_reels`. One payload, only the routes you
   asked for fire.
5. **Add the platform module on each route** and map:

   | Field | From |
   |---|---|
   | video / file URL | `video_url` (or `mediaUrl`) |
   | caption / description | `post` |
   | title (YouTube — required) | `title` |
   | cover / thumbnail | `thumbnailUrl` (or `image_url`) |

6. **The first comment is a SECOND module.** `comment` travels in the payload but nothing
   posts it for you — no platform API accepts a post and its first comment in one call. After
   the upload module on a route, add that platform's *create comment* module, feed it the
   post/media id the upload module returned, and map `comment` as the text. **This is the step
   people forget**, and the symptom is a post that goes live with the source link missing.
7. **Run once with the scenario in "Run once" mode** before switching it on, and check the
   post on each platform.

Put the resulting webhook URL in `MAKE_WEBHOOK_URL`. A worked payload lives in
`examples/ai-video-social/sample-post/post.json`.

**Check the payload before spending an operation:** `--dry-run` prints the exact JSON and sends
nothing.

**Queue integration.** `make-post.mjs --queue queue.json --id 3` sends one queued item and flips
its `status` to `posted` (with `postedAt`) or `failed` (with `error`) — so a scheduled run is
safe to retry. A `type: "video"` queue item is rendered ahead of time and posts from its
`videoPath`; see `docs/06-scheduling.md`.

---

## Tiếng Việt

Đẩy bài hoàn chỉnh — **ảnh hoặc video** — lên mạng xã hội qua webhook automation
(**Make.com**/n8n/Zapier). Kịch bản webhook lo API nền tảng; kit chỉ gửi payload chuẩn hoá.

**Payload** (`scripts/social/make-post.mjs` → `MAKE_WEBHOOK_URL`): xem khối JSON bản EN.

**Tương thích ngược:** bài ảnh vẫn gửi đúng `{mediaUrl, image_url, post, comment}` với nguyên
nghĩa cũ — `kind`, `title`, `hashtags`, `platforms` chỉ là bổ sung. Kịch bản Make đang chạy đọc
bốn khoá cũ vẫn hoạt động, không phải sửa gì.

**Luồng media:** truyền file local → script upload trước rồi gắn URL vào payload. `MEDIA_HOST`
chọn nơi lưu (`cloudinary` | `catbox`); vẫn đọc `IMAGE_HOST` cũ để tương thích. Cloudinary dùng
đúng endpoint theo loại (`/image/upload` với ảnh, `/video/upload` với video) — đẩy video vào
endpoint ảnh sẽ lỗi. Truyền sẵn URL thì bỏ qua upload. File vượt hạn mức (Cloudinary free ~10MB
ảnh / ~100MB video, Catbox 200MB) báo lỗi ngay kèm lý do thay vì POST vô vọng.

**Nền tảng:** `--platforms a,b,c` hoặc mặc định từ `SOCIAL_PLATFORMS`. Kit không tự gọi API nền
tảng nào — chỉ báo cho kịch bản biết bài này định đăng đi đâu. Xem bảng bản EN
(`tiktok`, `youtube_shorts` cần `title`, `facebook_reels`, `instagram_reels` cần URL công khai).

### Dựng kịch bản Make từng bước

Kit gửi payload; scenario lo phần còn lại. Khoảng mười phút:

1. **New scenario → Webhooks → Custom webhook → Add.** Dán URL vào `MAKE_WEBHOOK_URL` trong
   `.env` (đừng bao giờ để vào file được commit).
2. **Cho Make học cấu trúc payload.** Bật webhook nghe rồi bắn một payload thật vào:
   `--dry-run` để xem trước, bỏ cờ đó để gửi thật. Make bắt được cấu trúc và mọi field sẽ map
   được theo tên. Bỏ bước này thì phải gõ tay từng tên field.
3. **Thêm Router** sau webhook, mỗi nền tảng một nhánh.
4. **Lọc từng nhánh** theo `platforms[]` — điều kiện *Array contains* `tiktok`,
   `youtube_shorts`, `facebook_reels`, `instagram_reels`. Một payload, chỉ nhánh được chỉ định
   mới chạy.
5. **Thêm module nền tảng vào mỗi nhánh** và map — xem bảng bản EN
   (`video_url` → file, `post` → caption, `title` → tiêu đề YouTube, `thumbnailUrl` → ảnh bìa).
6. **First comment là MODULE THỨ HAI.** `comment` có sẵn trong payload nhưng **không tự thành
   comment** — không API nền tảng nào nhận bài đăng kèm comment trong một lần gọi. Sau module
   upload trên mỗi nhánh, thêm module *tạo comment* của nền tảng đó, truyền id bài/media mà
   module upload trả về, và map `comment` làm nội dung. **Đây là bước hay bị quên nhất**, triệu
   chứng là bài lên mà mất link nguồn.
7. **Chạy "Run once" trước khi bật scenario**, rồi kiểm tra bài trên từng nền tảng.

Payload mẫu đầy đủ: `examples/ai-video-social/sample-post/post.json`.

**Soi payload trước khi tốn operation:** `--dry-run` in đúng JSON sẽ gửi và không gửi gì cả.

**Tích hợp queue:** `make-post.mjs --queue queue.json --id 3` gửi 1 item và đổi `status` →
`posted` (kèm `postedAt`) hoặc `failed` (kèm `error`) — chạy lịch retry an toàn. Item
`type: "video"` được render sẵn từ trước và đăng từ `videoPath`; xem `docs/06-scheduling.md`.
