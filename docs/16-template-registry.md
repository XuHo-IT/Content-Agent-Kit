# 16 — Template registry / Kho template

## English

The kit ships 14 scene templates. The upstream **HyperFrames registry**
([heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), Apache-2.0) publishes
**146 more** — pull any of them without hand-copying files:

```bash
node scripts/video/add-template.mjs --list                    # everything available
node scripts/video/add-template.mjs --list --grep transition  # filter
node scripts/video/add-template.mjs transitions-blur caption-kinetic-slam
node scripts/video/add-template.mjs --preset news             # a curated set
```

### Three kinds of item — and only one is a scene template

| Type | Count | What it is |
|---|---|---|
| `example` | 8 | complete templates: vignelli, kinetic-type, swiss-grid, nyt-graph, play-mode, warm-grain, product-promo, decision-tree |
| `block` | 113 | 13 transition families · `news-ticker` · 10 lower-thirds (`lt-*`, `yt-lower-third`) · `data-chart` `world-map` `flowchart-vertical` · `x-post` `reddit-post` · ~25 code-snippet themes · `light-leak` `glitch` `cinematic-zoom` · device mockups |
| `component` | 25 | 16 animated caption styles · `grain-overlay` `vignette` `motion-blur` `parallax-zoom` `shimmer-sweep` |

**Only a folder with a root `index.html` becomes a scene template.** Blocks and components
ship `compositions/` only, so they land in `video-templates/` as building material and never
clutter the list a `script.json` can choose from. That separation is automatic — the
validator reads the folder, so nothing needs registering.

### The catch nobody mentions

**Seven of the eight `example` templates are 1920×1080 landscape.** Only `vignelli` is
1080×1920. This pipeline renders 9:16, so a landscape example is *not usable as a scene*
until someone writes a `compositions/portrait.html` for it — the same work the kit's
vendored templates already had done for them.

`add-template.mjs` flags this on fetch (`⚠ landscape`) and writes it into the item's
`NOTICE.md`. **Blocks and components are mostly overlays and effects and do not care about
aspect ratio — that is where the easy wins are.**

### `--preset news`

Aspect-independent picks that earn their keep on a vertical tech-news channel:

- **Transitions** — `transitions-blur` `-dissolve` `-push` `-radial` `-light`.
  The biggest single lift: scenes currently hard-cut.
- **Captions** — `caption-kinetic-slam` `-gradient-fill` `-glitch-rgb` `-neon-glow` `-highlight`
- **Polish** — `grain-overlay` `vignette` `motion-blur` `parallax-zoom` `light-leak`
- **Broadcast furniture** — `news-ticker` `lt-clean-bar` `lt-kicker-name` `yt-lower-third`
- **Data** — `data-chart` `flowchart-vertical` `world-map`
- **Quotes** — `x-post` `reddit-post`

`--preset code` adds the code-snippet family for a programming channel.

### What a fetch does

Reads `registry.json`, then the item's `registry-item.json`, and copies each declared file
to its declared target. Those targets already match the `paths` the kit's `hyperframes.json`
uses, so nothing is rewritten. It then generates `meta.json`, `hyperframes.json` and a
`NOTICE.md` carrying the Apache-2.0 attribution, the description, the native size and the
landscape warning.

**Render an item before trusting it.** The registry targets a newer HyperFrames than the
version this kit pins (`0.6.94`), and some items are marked `experimental`. If one renders
wrong, delete the folder — no other cleanup needed.

### Licensing

Apache-2.0: attribution must travel with the work and modifications must be stated. That is
what the generated `NOTICE.md` is for — **do not delete it**. See the root `NOTICE.md`.

---

## Tiếng Việt

Kit có sẵn 14 template cho scene. Kho **HyperFrames registry**
([heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), Apache-2.0) có thêm
**146 mục** — kéo về bằng lệnh, không phải chép tay. Xem các lệnh ở bản EN.

### Ba nhóm — chỉ một nhóm là template cho scene

`example` (8) là template đầy đủ; `block` (113) gồm 13 họ chuyển cảnh, `news-ticker`, 10 kiểu
lower-third, biểu đồ, bản đồ, `x-post`/`reddit-post`, ~25 theme code-snippet, hiệu ứng;
`component` (25) gồm 16 kiểu caption động và các lớp phủ điện ảnh.

**Chỉ thư mục có `index.html` ở gốc mới thành template chọn được cho scene.** Block và
component chỉ có `compositions/` nên nằm trong `video-templates/` như vật liệu dựng, không
làm rối danh sách mà `script.json` chọn. Phân tách này tự động — validator đọc thư mục thật.

### Điều không ai nói trước

**Bảy trong tám `example` là 1920×1080 ngang.** Chỉ `vignelli` là 1080×1920. Pipeline này
render 9:16, nên một example ngang **chưa dùng được làm scene** cho tới khi có người viết
`compositions/portrait.html` cho nó — đúng phần việc mà các template sẵn có đã được làm hộ.

`add-template.mjs` cảnh báo ngay khi kéo (`⚠ landscape`) và ghi vào `NOTICE.md` của mục đó.
**Block và component phần lớn là lớp phủ/hiệu ứng, không phụ thuộc tỉ lệ khung — lợi ích tức
thì nằm ở đó.**

### Bộ tuyển `--preset news`

Xem danh sách ở bản EN: chuyển cảnh (thắng lớn nhất — hiện các scene đang cắt cứng), caption
động, lớp phủ điện ảnh, đồ hoạ kiểu bản tin, biểu đồ/bản đồ, và khung trích dẫn bài đăng.
`--preset code` thêm nhóm code-snippet cho kênh lập trình.

### Kéo về xong nên làm gì

**Render thử trước khi tin dùng.** Registry nhắm bản HyperFrames mới hơn bản kit đang ghim
(`0.6.94`), và một số mục đánh dấu `experimental`. Cái nào render sai thì xoá thư mục đó là
xong, không cần dọn gì thêm.

### Giấy phép

Apache-2.0: phải giữ ghi công kèm theo và nêu rõ thay đổi. Đó là việc của `NOTICE.md` được
sinh tự động — **đừng xoá**. Xem `NOTICE.md` ở gốc repo.
