# 15 — Media sources / Nguồn hình ảnh

## English

Real footage and real screenshots, so a video stops looking like a slideshow. Three kinds
of media can go into a scene:

| kind | what it is | template |
|---|---|---|
| `video` | a stock clip | `frame-broll` (full bleed) or `frame-media-inset` (framed) |
| `screenshot` | a captured web page | `frame-screenshot` (browser chrome) |
| `image` | a still, used like footage | `frame-broll` / `frame-media-inset` |

### Which sources actually work

Probed 2026-08 — the picture is not what the marketing pages suggest:

| Source | Status | Notes |
|---|---|---|
| **Pexels** | ✅ working | Real API. **Has `orientation=portrait`** → true 1080×1920 sources. The default. |
| **Pixabay** | ✅ working | Real API, but its video renditions are **landscape only** — every clip is cropped into 9:16. |
| Coverr | 🔑 `401` | API exists, needs a key. Adapter stub present, enable with `COVERR_API_KEY`. |
| Unsplash | 🔑 `401` | API exists, needs a key — and it serves **photos, not video**. |
| Videvo | ❌ `403` | No public API. |
| Mixkit · Videezy | ❌ `404` | No public API. |
| Lifecoach | ❌ | No API found. |

For the last four, use the **`manual`** source: download the clip from the site yourself
(their licences allow it), list its URL in `stock-sources.yaml`, and the pipeline treats it
like any other source. The kit does **not** scrape those sites — it would break their terms
and their markup.

```bash
node scripts/media/stock-search.mjs --sources     # what is configured right now
```

### Picking a clip

```bash
node scripts/media/stock-search.mjs --query "data center servers" --limit 6
```

Output includes **what each clip actually shows**, taken from the contributor's own
description. Read it. Stock search relevance is loose — a query for `breaking news screen`
cheerfully returns a cup of coffee, and that is exactly how off-topic B-roll gets into a
finished video.

**Describe the picture, not the concept.** `"data center servers"` returns usable footage;
`"artificial intelligence"` returns generic blue swirls.

### Putting it in a scene

```json
{
  "id": "hook",
  "templateId": "frame-broll",
  "voiceText": "…",
  "inputs": { "kicker": "…", "headline": "…" },
  "media": { "kind": "video", "source": "pexels", "id": "28709421" }
}
```

| field | meaning |
|---|---|
| `kind` | `video` \| `screenshot` \| `image` (default `video`) |
| `source` | `pexels` \| `pixabay` \| `manual` (default `$STOCK_SOURCE`) |
| `id` | pin an exact clip — **reproducible** |
| `query` | search instead; resolved once, then pinned in `media-lock.json` |
| `ref` | a `ref` from `stock-sources.yaml` (manual source) |
| `url` | the page to capture, for `kind: "screenshot"` |
| `fit` | `cover` (default) or `contain` |

### `media-lock.json` — reproducibility and the credits ledger

A bare `query` would break the kit's core promise that the same `script.json` produces the
same video: today it finds clip A, next week clip B. So the first render resolves the query,
downloads the clip, and **writes the choice to `media-lock.json`** next to the script — the
same idea as a package lockfile. Later renders read the lock and make no network calls.

```json
{ "hook": { "source": "pexels", "id": "28709421",
            "author": "Kuiyibo Campos", "license": "Pexels License",
            "pageUrl": "https://www.pexels.com/video/…",
            "file": "media/hook.mp4", "resolvedAt": "…" } }
```

That file is also the **credits ledger**. Pexels and Pixabay do not require attribution, so
nothing appears on screen — but every clip stays traceable to its source, author and licence
if it is ever questioned. **Commit `media-lock.json`**; the downloaded media itself is
git-ignored.

To change a clip: edit the `id` (the lock notices and re-resolves), or run with
`--refresh-media`.

### Screenshots

```bash
node scripts/media/screenshot.mjs --url "https://…" --out shot.png --width 1280 --height 860
```

Headless Chrome, no new dependency — the binary is found via `CHROME_PATH`, then the
puppeteer cache that rendering already populated, then the system install.

**Known limitation:** Chrome's `--screenshot` gives no hook for injecting CSS, so a cookie
or consent wall **will** appear if the site shows one. There is no flag that removes it.
Raise `--wait` (some auto-dismiss), pick a page without the wall, or capture that one by hand.

Use screenshots as **evidence** — the page being talked about — not decoration.

### Where finished media is hosted

A social platform does not receive your file — it receives a **URL and fetches from it**,
sometimes days later, and again whenever it re-encodes. A link that dies is a broken post.
So the upload host matters as much as the clip.

```bash
node scripts/media/host-check.mjs --hosts     # what's configured
node scripts/media/host-check.mjs             # upload a probe, READ IT BACK, delete it
node scripts/media/host-check.mjs --selftest  # check the R2 signer, offline
```

| Host | Durable | Needs | Notes |
|---|---|---|---|
| **`r2`** (default) | ✅ | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE` | Cloudflare R2 over its S3 API. You own the bucket, no egress fees, custom domain possible, no size cap in practice. |
| `cloudinary` | ✅ | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UNSIGNED_PRESET` | CDN and transformations included. Free-tier unsigned caps around 10 MB image / 100 MB video. |
| `catbox` | ❌ | nothing | **Testing only.** Anonymous, no account, no storage guarantee. It prints a warning every time. Never point a published post at it. |

**Setting up R2.** Create a bucket, then an API token with object read/write. `R2_PUBLIC_BASE`
is the *public* hostname, which is separate from the S3 endpoint: in the dashboard go to
R2 → your bucket → Settings → **Public Development URL → Enable** (gives
`https://pub-xxxx.r2.dev`), or attach a custom domain, which is what Cloudflare recommends for
production. Object keys are derived from the file's **content hash**, so re-uploading the same
file lands on the same key — no duplicates, and a retry after a network failure is harmless.

> **Verification status.** The R2 signer is checked against AWS's own published SigV4 worked
> example (`host-check.mjs --selftest` reproduces the documented signature exactly). The
> R2-specific wiring — endpoint, `auto` region, bucket path, public URL — and the Cloudinary
> path have **not** been run against live credentials; both are marked `UNVERIFIED` in
> `--hosts` until `host-check.mjs` passes on your account. Catbox is the only one exercised
> end to end so far.

**The check that matters** is the second half of `host-check.mjs`: it fetches the public URL
back. An R2 bucket with public access still switched off accepts uploads happily and only
fails when a platform later tries to read the file — by which time the post is already live
and broken.

### Licensing

Pexels and Pixabay both allow commercial use, modification, and social media, with **no
attribution required**. Both forbid: reselling unaltered copies, implying that people or
brands in the footage endorse you, and redistributing to other stock platforms.

### Env

```env
PEXELS_API_KEY=          # also read as PEXELS_API
PIXABAY_API_KEY=         # also read as PIXABAY_API
STOCK_SOURCE=pexels      # default when a scene doesn't say
STOCK_MIN_DURATION=4     # skip clips shorter than this
STOCK_SOURCES_FILE=      # default <kit>/stock-sources.yaml
CHROME_PATH=             # optional; auto-detected otherwise
```

---

## Tiếng Việt

Cảnh quay thật và ảnh chụp thật, để video thôi trông như trình chiếu. Ba loại media gắn vào
một scene: `video` (clip stock), `screenshot` (ảnh chụp trang web), `image` (ảnh tĩnh dùng
như cảnh quay). Xem bảng template ở bản EN.

### Nguồn nào thật sự dùng được

Đã probe 08/2026 — thực tế khác với những gì trang giới thiệu gợi ý:

**Pexels** ✅ có API thật, **có `orientation=portrait`** nên trả nguồn 1080×1920 đúng chuẩn —
đây là mặc định. **Pixabay** ✅ có API nhưng bản render **chỉ có ngang**, mọi clip đều phải
crop về 9:16. **Coverr** và **Unsplash** trả `401` — có API nhưng cần key (và Unsplash là
**ảnh**, không phải video). **Videvo** `403`, **Mixkit** và **Videezy** `404`, **Lifecoach**
không tìm thấy — **không có API công khai**.

Với bốn cái cuối, dùng nguồn **`manual`**: bạn tự tải clip từ site (giấy phép của họ cho
phép), dán URL vào `stock-sources.yaml`, pipeline coi nó như mọi nguồn khác. Kit **không**
cào các site đó — vừa trái điều khoản của họ, vừa hỏng ngay khi họ đổi HTML.

### Chọn clip

`stock-search.mjs` in ra **clip đó thật sự quay gì**, lấy từ mô tả của chính người đăng.
**Hãy đọc nó.** Độ chính xác tìm kiếm của kho stock rất lỏng — tìm `breaking news screen` có
thể trả về một tách cà phê, và đó chính là cách B-roll lạc đề lọt vào video hoàn chỉnh.

**Tả HÌNH ẢNH, đừng tả KHÁI NIỆM.** `"data center servers"` cho clip dùng được;
`"artificial intelligence"` cho mấy vòng xoáy xanh vô nghĩa.

### Khối `media` và lockfile

Xem cấu trúc JSON ở bản EN. Vấn đề cốt lõi: `query` tìm trực tiếp sẽ phá vỡ cam kết "cùng
`script.json` cho cùng một video" — hôm nay ra clip A, tuần sau clip B. Nên lần render đầu
giải `query`, tải clip, rồi **ghi lựa chọn vào `media-lock.json`** cạnh script (giống lockfile
của package manager). Các lần sau đọc lock, không gọi mạng.

File đó **đồng thời là sổ ghi nguồn**: Pexels/Pixabay không bắt buộc ghi công nên không có gì
hiện trên màn hình, nhưng mọi clip vẫn truy được về nguồn, tác giả và giấy phép nếu sau này
có tranh chấp. **Hãy commit `media-lock.json`**; còn file media thì gitignore.

Đổi clip: sửa `id` (lock tự phát hiện và tải lại), hoặc chạy với `--refresh-media`.

### Ảnh chụp màn hình

Chrome headless, không thêm dependency — tìm binary theo `CHROME_PATH` → cache puppeteer mà
bước render đã tải sẵn → Chrome hệ thống.

**Hạn chế đã biết:** `--screenshot` của Chrome không có chỗ chèn CSS, nên nếu trang có tường
cookie/consent thì **nó sẽ nằm trong ảnh**. Không có cờ nào bỏ được. Tăng `--wait` (một số
tự tắt), chọn trang khác, hoặc chụp tay riêng cái đó.

Dùng ảnh chụp làm **bằng chứng** — đúng trang đang nói tới — chứ không phải để trang trí.

### Media hoàn chỉnh lưu ở đâu

Nền tảng mạng xã hội **không nhận file của bạn** — nó nhận một URL rồi tự tải về, có khi vài
ngày sau, và tải lại mỗi lần re-encode. Link chết là bài hỏng. Nên chỗ lưu quan trọng ngang clip.

| Host | Bền | Cần | Ghi chú |
|---|---|---|---|
| **`r2`** (mặc định) | ✅ | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE` | Cloudflare R2 qua S3 API. Bucket của bạn, không phí egress, gắn được custom domain, thực tế không giới hạn dung lượng. |
| `cloudinary` | ✅ | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UNSIGNED_PRESET` | Có sẵn CDN và transform. Free tier giới hạn ~10MB ảnh / 100MB video. |
| `catbox` | ❌ | không | **Chỉ để test.** Ẩn danh, không tài khoản, không cam kết lưu trữ. Mỗi lần dùng đều in cảnh báo. Đừng bao giờ trỏ bài đã đăng vào đây. |

**Dựng R2:** tạo bucket, tạo API token có quyền đọc/ghi object. `R2_PUBLIC_BASE` là **hostname
công khai**, khác với endpoint S3: vào R2 → bucket → Settings → **Public Development URL →
Enable** (cho `https://pub-xxxx.r2.dev`), hoặc gắn custom domain — Cloudflare khuyến nghị cách
sau cho production. Key object đặt theo **hash nội dung** nên upload lại đúng file đó ra đúng
key đó: không sinh bản trùng, retry sau lỗi mạng vô hại.

> **Trạng thái kiểm chứng.** Phần ký SigV4 của R2 **đã được xác thực** — `host-check.mjs
> --selftest` tái tạo đúng chữ ký trong ví dụ chính thức của AWS. Nhưng phần đấu nối riêng của
> R2 (endpoint, region `auto`, đường dẫn bucket, URL công khai) và đường Cloudinary **chưa chạy
> với credential thật**; cả hai bị đánh dấu `UNVERIFIED` trong `--hosts` cho tới khi
> `host-check.mjs` chạy được trên tài khoản của bạn. Hiện chỉ catbox là đã chạy đầu-cuối.

**Phần quan trọng nhất** của `host-check.mjs` là nửa sau: nó **tải lại URL công khai**. Bucket R2
chưa bật public vẫn nhận upload bình thường và chỉ lỗi khi nền tảng đi tải — lúc đó bài đã lên
và đã hỏng.

### Giấy phép

Pexels và Pixabay đều cho dùng thương mại, chỉnh sửa, đăng mạng xã hội, **không bắt buộc ghi
nguồn**. Đều cấm: bán lại bản chưa chỉnh sửa, ngụ ý người/thương hiệu trong clip bảo trợ bạn,
và phát tán lại lên kho stock khác.

### Biến môi trường

Xem khối env ở bản EN.
