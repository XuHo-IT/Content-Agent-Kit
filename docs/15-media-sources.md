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

### `geo` — a real place, not a stock clip of a place

The fifth source is not a catalogue. It **builds** its clip: raster map tiles stitched at four
zoom levels falling from the whole world onto the coordinates, then optional street-level
imagery, each still given a slow Ken Burns push and cross-faded into the next.

**It is free and needs no account.**

```bash
node scripts/video/geo-flythrough.mjs --sources                              # what's available
node scripts/video/geo-flythrough.mjs --place "Aokigahara, Japan" --dry-run  # what it will fetch
node scripts/video/geo-flythrough.mjs --place "Aokigahara, Japan" --out geo.mp4
```

```json
"media": { "kind": "video", "source": "geo", "query": "Aokigahara, Japan" }
"media": { "kind": "video", "source": "geo", "id": "35.4694,138.6206" }
```

| source | tile | what it is |
|---|---|---|
| `carto-dark` (default wide) | 512px @2x | CARTO Dark Matter — suits this kit's dark templates |
| `carto-light` · `carto-voyager` | 512px @2x | Positron / Voyager, for a `paper-*` theme |
| `esri-satellite` (default close) | 256px | Esri World Imagery — real satellite |
| `osm` | 256px | The OSMF's own servers. Read their [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before scaling up |
| `opentopo` | 256px | Terrain and contours — a forest, a mountain, a pass |

**Why stitched tiles.** No API renders a video flythrough, and there is no free static-map API
worth depending on. Tiles are the raw material every map on the web is made of, the projection
maths is public, and stitching them is a dozen requests and an ffmpeg filtergraph.

**Cost: $0.** About 54 tile requests for the default four-still clip — twelve per @2x still,
fifteen per 256px one. Built clips are cached by request hash in `.cache/geo/`, so a re-render
fetches nothing. There is a deliberate 80ms pause between requests: these are donated and
free-tier servers, not a CDN to hammer.

**Street level is optional.** [Mapillary](https://www.mapillary.com/) replaces Street View —
crowd-sourced, CC BY-SA, free token. Coverage is far thinner than Google's, so no coverage is
the normal case rather than an error, and the clip falls back to map stills alone.

> ⚠️ **Attribution is a licence condition, and a tile has none baked in.** This is the one
> real difference from a Google static image, which arrives with its credit already on it.
> The script draws the credit onto every still itself and writes `<clip>.credits.txt` beside
> the output; the `geo` source copies it into `media-lock.json`. If no font can be found it
> says so loudly and prints the exact string you must put on screen instead. Do not publish
> these frames without it.

### Several pictures in one scene

`media` may be an **array** of up to four. Only `frame-vox-photo-grid` draws more than the
first — passing an array to anything else is an error rather than a warning, because that
renders happily while dropping three of your four images.

```json
"media": [
  { "kind": "video", "source": "geo",    "id": "45.3792,12.3311" },
  { "kind": "image", "source": "manual", "ref": "ai-ward" },
  { "kind": "image", "source": "pexels", "query": "venice lagoon water boat" }
]
```

They resolve to `assets/media-1.*` … `media-4.*`, and the first is **also** written to
`assets/media.*` so every template built before this existed keeps working. Every entry goes
through the same rules as a single one — the array form is not a way around the `rights` or
`fit` gates — and each gets its own line in `media-lock.json`, keyed `"<sceneId>#<n>"`.

Mixing kinds is the ordinary case: a satellite clip beside three stills. The template is told
which is which via `media_kinds`; it cannot detect it by loading an `<img>` and falling back,
because hyperframes seeks frame by frame and the swapped frame would render blank.

### `meme` — a change of energy, in its own colours

Free, keyless, ~400 templates ([memegen.link](https://memegen.link), MIT). Renders through
the new `frame-meme` template, which is the only one that **never tints its media** — the
colour is part of how the joke lands.

```bash
node scripts/media/meme-search.mjs --query drake
node scripts/media/meme-search.mjs --render "drake|Viết tay|Dùng agent" --out /tmp/m.png
```

```json
"media": { "kind": "image", "source": "meme", "id": "drake|Viết tay|Dùng agent", "fit": "contain" }
```

**`fit: "contain"` is required** and the validator enforces it — `cover` crops the image to
fill the frame and takes the punchline with it, in `normalizeImage`, before any template can
intervene. Set `"kind": "video"` for an animated meme: the source then asks for a `.gif` and
the pipeline converts it.

Two things that were found by rendering rather than by reading the docs:

- **The font must be `notosans`.** Impact — memegen's own default — has no Vietnamese
  diacritics. `Viết script bằng tay` comes back as `VI T SCRIPT BẰNG TAY`, the API returns
  200, and nothing downstream can tell. The source defaults to notosans; `MEME_FONT` overrides.
- **Each line must fit on ONE rendered line.** memegen sizes text to a single line inside the
  template's own text box; a line that wraps has its second half clipped off the image. How
  much fits depends on which meme — `drake` (two half-width panels) wraps at about 15
  Vietnamese characters, `afraid` (full-width box) takes 23. There is no number to look up,
  which is why `--render` writes a PNG: open it.

### `social` — Douyin / TikTok / Bilibili / Kuaishou

Resolves one post you name. **The kit ships no downloader and vendors nothing** — this is a
thin client for a service you run, the same arrangement as the servers in `.mcp.json`:

```bash
git clone https://github.com/Evil0ctal/Douyin_TikTok_Download_API   # Apache-2.0
cd Douyin_TikTok_Download_API && docker compose up -d
export SOCIAL_API_BASE=http://127.0.0.1:80
node scripts/media/social-fetch.mjs --url "https://www.douyin.com/video/7…" --analyze
```

Cookies live in that service's own `config.yaml`, never here. For bulk archiving of **your
own** account, [jiji262/douyin-downloader](https://github.com/jiji262/douyin-downloader) (MIT,
Python CLI, SQLite dedup) is the better tool; it is not wired in because a batch archiver and
a per-scene resolver are different jobs.

> ⚠️ **The clip is somebody else's work, and removing a watermark does not remove a
> copyright.** Republishing a creator's video inside a monetised short is a copyright and
> platform-ToS risk. The kit does not make that judgement for you — it makes you write it
> down.

```json
"media": {
  "kind": "video", "source": "social",
  "url": "https://www.douyin.com/video/7…",
  "rights": "permitted",
  "rights_note": "author @abc agreed by DM, 2026-08-14"
}
```

| `rights` | means |
|---|---|
| `own` | your own account's video |
| `licensed` | bought or licensed — **needs `rights_note`** |
| `permitted` | the creator agreed — **needs `rights_note`** |
| `public-domain` | out of copyright, or CC0 |

There is deliberately no `unknown` and no `fair-use`: a value that means "I did not check"
turns the field into decoration. `validate-script.mjs` refuses a scene without a declaration —
in seconds, before a 3–5 minute render — and `media-lock.json` records it alongside the
source URL and author. When a takedown arrives, "where did this come from and on what basis"
is then a file rather than a memory.

**`--analyze` is the mode with no legal question attached.** It downloads a post so you can
study its hook, its cut rhythm and its captions, and then you write your own and get the
footage from Pexels. That is also the mode that pairs with `topic-radar` and the
`fb-hook-extractor` registry skill.

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

# source "geo" — free and keyless; these only change what it looks at
GEO_TILE_WIDE=carto-dark       # far shots
GEO_TILE_CLOSE=esri-satellite  # zoom>=10, real satellite imagery
GEO_ZOOM_STEPS=3,6,11,16       # world -> region -> city -> close-up
GEO_GRID=                      # tiles per still, e.g. 3x5
GEO_CLIP_SECONDS=8             # length the source builds; the scene trims it to fit
GEO_CACHE_DIR=                 # default <kit>/.cache/geo — so a re-render refetches nothing
GEO_FONT=                      # .ttf for the burned-in attribution; autodetected otherwise
MAPILLARY_TOKEN=               # optional free token for street-level imagery
GEO_STREET=3                   # street-level images to append; 0 = off

# source "meme" — free and keyless
MEME_API_BASE=https://api.memegen.link
MEME_FONT=notosans             # NOT impact — it has no Vietnamese diacritics

# source "social" — a service you run; the kit ships no downloader
SOCIAL_API_BASE=               # e.g. http://127.0.0.1:80
SOCIAL_WATERMARK=false
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

### `geo` — một địa điểm có thật, không phải clip stock về địa điểm

Nguồn thứ năm không phải kho có sẵn — nó **dựng** clip: ghép tile bản đồ ở bốn mức zoom rơi từ
toàn cầu xuống đúng toạ độ, rồi ảnh mặt đường (tuỳ chọn), mỗi ảnh tĩnh được đẩy Ken Burns chậm
và cross-fade sang ảnh sau.

**Miễn phí, không cần tài khoản.**

```bash
node scripts/video/geo-flythrough.mjs --sources                              # có nguồn nào
node scripts/video/geo-flythrough.mjs --place "Aokigahara, Japan" --dry-run  # sẽ tải gì
```

```json
"media": { "kind": "video", "source": "geo", "query": "Aokigahara, Japan" }
"media": { "kind": "video", "source": "geo", "id": "35.4694,138.6206" }
```

| nguồn | tile | là gì |
|---|---|---|
| `carto-dark` (mặc định, cảnh xa) | 512px @2x | CARTO Dark Matter — hợp template nền tối của kit |
| `carto-light` · `carto-voyager` | 512px @2x | Positron / Voyager, đi với theme `paper-*` |
| `esri-satellite` (mặc định, cảnh gần) | 256px | Esri World Imagery — ảnh vệ tinh thật |
| `osm` | 256px | Máy chủ của chính OSMF. Đọc [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) trước khi dùng nhiều |
| `opentopo` | 256px | Địa hình, đường đồng mức — rừng, núi, đèo |

**Vì sao ghép tile.** Không API nào render sẵn một cú bay, và cũng không có static-map API
miễn phí nào đáng để phụ thuộc. Tile là nguyên liệu thô của mọi bản đồ trên web, công thức
chiếu là công khai, và ghép chúng lại chỉ là hơn chục request cộng một filtergraph ffmpeg.

**Chi phí: $0.** Khoảng 54 request tile cho clip bốn ảnh mặc định — 12 request mỗi ảnh @2x,
15 mỗi ảnh 256px. Clip đã dựng được cache theo hash ở `.cache/geo/` nên render lại không tải
gì thêm. Có nghỉ 80ms giữa các request: đây là máy chủ chạy bằng tiền quyên góp và gói miễn
phí, không phải CDN để dội vào.

**Ảnh mặt đường là tuỳ chọn.** [Mapillary](https://www.mapillary.com/) thay cho Street View —
cộng đồng đóng góp, CC BY-SA, token miễn phí. Độ phủ mỏng hơn Google nhiều, nên **không có ảnh
là chuyện bình thường**, không phải lỗi; clip lùi về chỉ dùng ảnh bản đồ.

> ⚠️ **Attribution là điều kiện giấy phép, và tile thì KHÔNG có sẵn credit.** Đây là khác biệt
> thật so với ảnh Google (vốn đã nung credit vào sẵn). Script tự vẽ credit lên từng ảnh và ghi
> `<clip>.credits.txt` cạnh output; nguồn `geo` chép nó vào `media-lock.json`. Không tìm được
> font thì nó báo to và in ra đúng chuỗi bạn phải đưa lên màn hình. Đừng đăng khi thiếu nó.

### `meme` — đổi nhịp, đổi năng lượng, giữ nguyên màu

Miễn phí, không key, ~400 template ([memegen.link](https://memegen.link), MIT). Hiển thị qua
template mới `frame-meme` — template **duy nhất không nhuộm màu media**, vì màu chính là một
phần của cách cái đùa đó bật ra.

```bash
node scripts/media/meme-search.mjs --query drake
node scripts/media/meme-search.mjs --render "drake|Viết tay|Dùng agent" --out /tmp/m.png
```

```json
"media": { "kind": "image", "source": "meme", "id": "drake|Viết tay|Dùng agent", "fit": "contain" }
```

**Bắt buộc `fit: "contain"`**, validator sẽ chặn nếu thiếu — `cover` cắt ảnh cho đầy khung và
cắt luôn câu chốt, ngay trong `normalizeImage`, trước khi template kịp làm gì. Meme động thì
đặt `"kind": "video"`: nguồn sẽ xin `.gif` và pipeline tự chuyển.

Hai điều dưới đây tìm ra bằng cách **render rồi nhìn**, không phải bằng đọc tài liệu:

- **Font phải là `notosans`.** Impact — mặc định của chính memegen — **không có dấu tiếng
  Việt**. `Viết script bằng tay` trả về `VI T SCRIPT BẰNG TAY`, API vẫn 200, và không chỗ nào
  phía sau phát hiện được. Nguồn mặc định notosans; `MEME_FONT` để đổi.
- **Mỗi dòng phải vừa MỘT dòng khi render.** memegen chỉnh cỡ chữ cho vừa một dòng trong ô
  text của template; dòng nào bị xuống hàng thì nửa sau bị cắt mất khỏi ảnh. Vừa bao nhiêu
  tuỳ template — `drake` (hai panel nửa khung) xuống hàng ở khoảng 15 ký tự tiếng Việt, còn
  `afraid` (ô full-width) chứa được 23. Không có con số để tra, nên `--render` ghi ra file
  PNG: mở nó ra xem.

### `social` — Douyin / TikTok / Bilibili / Kuaishou

Lấy đúng một bài bạn chỉ định. **Kit KHÔNG kèm downloader nào và không vendor gì** — đây chỉ
là client mỏng trỏ tới service bạn tự dựng, giống hệt cách xử lý các server trong `.mcp.json`:

```bash
git clone https://github.com/Evil0ctal/Douyin_TikTok_Download_API   # Apache-2.0
cd Douyin_TikTok_Download_API && docker compose up -d
export SOCIAL_API_BASE=http://127.0.0.1:80
node scripts/media/social-fetch.mjs --url "https://www.douyin.com/video/7…" --analyze
```

Cookie nằm trong `config.yaml` của service đó, không bao giờ ở đây. Muốn archive hàng loạt
tài khoản **của chính bạn** thì [jiji262/douyin-downloader](https://github.com/jiji262/douyin-downloader)
(MIT, CLI Python, dedup SQLite) hợp hơn — không nối dây vào đây vì archive hàng loạt và
resolve từng scene là hai việc khác nhau.

> ⚠️ **Clip đó là công sức của người khác, và gỡ watermark không gỡ được bản quyền.** Đăng lại
> video của một creator trong short có kiếm tiền là rủi ro bản quyền + vi phạm ToS nền tảng.
> Kit không quyết thay bạn — Kit bắt bạn **ghi lại quyết định đó**.

```json
"media": {
  "kind": "video", "source": "social",
  "url": "https://www.douyin.com/video/7…",
  "rights": "permitted",
  "rights_note": "tác giả @abc đồng ý qua DM, 2026-08-14"
}
```

| `rights` | nghĩa |
|---|---|
| `own` | video của chính tài khoản bạn |
| `licensed` | đã mua / có giấy phép — **bắt buộc `rights_note`** |
| `permitted` | tác giả đồng ý — **bắt buộc `rights_note`** |
| `public-domain` | hết bảo hộ, hoặc CC0 |

Cố tình **không có** `unknown` và `fair-use`: một giá trị mang nghĩa "tôi chưa kiểm tra" sẽ
biến cả trường này thành đồ trang trí. `validate-script.mjs` chặn scene chưa khai — trong vài
giây, trước khi render 3–5 phút — và `media-lock.json` ghi lại kèm URL gốc và tác giả. Khi có
takedown, câu "clip này từ đâu, căn cứ nào" nằm trong file chứ không trong trí nhớ.

**`--analyze` là chế độ không vướng câu hỏi pháp lý nào.** Nó tải bài về để bạn *nghiên cứu*
hook, nhịp cắt, caption — rồi bạn tự viết lại và lấy footage từ Pexels. Đây cũng là chế độ đi
cùng `topic-radar` và skill `fb-hook-extractor` trong registry.

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
