# 27 — Storytelling video / Video kể chuyện

## Tiếng Việt

Video liệt kê thông tin được xem đến khi người xem nắm ý chính. Video kể chuyện được xem đến
hết, vì người xem muốn biết kết cục. Kit đã có rất nhiều khung hình **trông** hiện đại (bộ
`frame-trend-*`); phần này thêm những khung hình **làm một việc trong câu chuyện**: bước ngoặt,
đi xuống tận gốc rễ, bằng chứng, mở chương, ký ức, cao trào, và "chúng ta đang ở đâu".

### Có gì mới

| | |
| --- | --- |
| 15 template `frame-story-*` | sinh bởi `scripts/video/lib/build-story-templates.mjs` — sửa file đó, không sửa HTML |
| 4 thể loại trong `VIDEO_GENRES.template.json` | `brand-story`, `customer-story`, `legend`, `case-breakdown` |
| skill `story-video` | tìm câu chuyện → dựng mạch 6 nhịp → chọn khung theo nhịp → âm thanh → kiểm duyệt |
| `scripts/video/sfx-cc0.mjs` | 27 âm thanh CC0 (lật trang, sting, boom, riser…) — dùng thương mại, không cần ghi công |
| 2 kiểu dựng mới cho `talking-head.mjs` | `--style launch` và `--style meme` |

### Mạch truyện

```
hook ─▶ bối cảnh ─▶ trở ngại ─▶ BƯỚC NGOẶT ─▶ bằng chứng ─▶ kết / kêu gọi
```

Mỗi nhịp là một scene 25–40 từ đọc, nên mạch truyện cũng chính là danh sách scene. Hook hé lộ
kết cục hoặc cái giá phải trả, không chỉ nêu chủ đề. Câu hỏi mở ở hook phải được trả lời ở
cuối bằng đúng những chữ đó. Nếu phải cắt, cắt bối cảnh — không bao giờ cắt bước ngoặt.

### 15 khung kể chuyện

| template | nhịp | thiết bị kể chuyện | ý tưởng từ |
| --- | --- | --- | --- |
| `frame-story-one-line` | hook | một nét bút không nhấc vẽ cả hành trình | Opus 5.5 survey |
| `frame-story-world-pan` | điều không ai thấy | một thế giới, một máy quay lặn từ ngọn xuống rễ | ghost-editor · explainer-vector |
| `frame-story-page-turn` | bước ngoặt | trang giấy lật theo nhịp 8 hình/giây | ghost-editor · tactile-paper |
| `frame-story-halftone-case` | bằng chứng | hồ sơ in lưới, chữ lệch màu, con dấu đập | ghost-editor · halftone-dossier |
| `frame-story-comic-panels` | hook / 3 nhịp | ba khung truyện tranh, khung cuối nổ chữ | Opus 5.5 survey |
| `frame-story-swiss-chapter` | mở chương | lưới Thuỵ Sĩ, số chương khổng lồ, ô đỏ thoát lưới | ghost-editor · swiss-grid |
| `frame-story-step-numeral` | bài học | số nghiêng khổng lồ thu về góc | ghost-editor · step-deck |
| `frame-story-letter` | giọng khách hàng | phong bì mở, lá thư tự viết, sáp niêm | Opus 5.5 survey |
| `frame-story-sand` | ký ức | tranh cát trên bàn đèn | Opus 5.5 survey |
| `frame-story-telestrator` | khoảnh khắc quyết định | dừng hình, khoanh tròn, dán nhãn như bình luận bóng đá | ghost-editor · telestrator |
| `frame-story-pencil-chart` | bằng chứng số | biểu đồ vẽ bút chì, cột theo đúng tỉ lệ | ghost-editor · data-story |
| `frame-story-frieze` | sử thi 4 hồi | câu chuyện vẽ quanh chiếc bình xoay | Opus 5.5 survey |
| `frame-story-silent-film` | chuyển cảnh | thẻ chữ phim câm, iris, nhấp nháy | Opus 5.5 survey |
| `frame-story-kinetic-floor` | cao trào / outro | mỗi câu là một tầng, chữ cuối đứng trên cùng | Opus 5.5 survey |
| `frame-story-rundown` | đang ở đâu | danh mục bản tin, gạch dần các ý đã nói | ghost-editor · news-package |

### Quy tắc không được phá

- **Không bịa khách hàng, trích dẫn hay lá thư.** Thư và lời chứng thực phải có thật, được
  phép dùng. Không có thì chọn khung khác.
- **Số liệu có nguồn hoặc ghi rõ là minh hoạ** — mỗi template đều có ô để ghi nguồn.
- **Quảng cáo** đi qua `skills/ads-policy-check` trước khi lên Meta — xem `docs/28-facebook-ads.md`.

### Nguồn

Ý tưởng — không chép mã, markup, font, âm thanh hay hình ảnh:
[kurbaitaev/ghost-editor](https://github.com/kurbaitaev/ghost-editor) (MIT; nhiều recipe của nó
port từ các style MIT của LemoLab `lemo-opuscar`) và cụm prompt kể chuyện trong 703 prompt của
[yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) (MIT).
Riêng gói âm thanh: file WAV do ghost-editor cắt sẵn, nguồn gốc CC0 1.0 trên Freesound —
`sfx-cc0.mjs` tải về từ một commit cố định, không đưa vào repo. Ghi công: `NOTICE.md`.

---

## English

A video that lists facts is watched until the viewer has the gist. A story is watched to the
end, because the viewer wants to know how it ends. The kit already had plenty of frames that
**look** current (the `frame-trend-*` set). This adds frames that **do a job in a narrative**: a
turn, a descent to the roots, evidence, a chapter, a memory, a climax, and "where we are".

### What is new

- **15 `frame-story-*` templates**, emitted by `scripts/video/lib/build-story-templates.mjs`
  (definitions in `story-templates-a.mjs` / `story-templates-b.mjs`). Edit those, not the HTML.
- **4 genres** in `VIDEO_GENRES.template.json`: `brand-story`, `customer-story`, `legend`,
  `case-breakdown`.
- **The `story-video` skill**: find the story (who, want, in the way, turn, after) → put it on a
  six-beat arc → pick frames by beat → sound → review gate.
- **`scripts/video/sfx-cc0.mjs`**: 27 CC0 sounds — page turns, stings, booms, risers — free for
  commercial use, no credit required. Reaction sounds land in a `meme` category that
  `lib/sfx.mjs` never picks automatically, so a serious line never gets an "oof" under it.
- **Two more `talking-head.mjs` finishes**: `--style launch` (dark, cool, one electric-blue
  accent) and `--style meme` (thick-outline captions, bouncing yellow active word). Their
  ghost-editor originals were not copied: the launch preset's violet is the palette docs/25 bans.

### The arc

```
hook ─▶ setup ─▶ in the way ─▶ TURN ─▶ proof ─▶ payoff / CTA
```

Each beat is one 25–40-word scene, so the arc is the scene list. The hook gives away the ending
or the stakes, not the topic; the question it opens is answered at the end in the same words;
if something has to go, cut setup, never the turn.

### What was taken from where

ghost-editor ships 18 style recipes for **talking-head** footage, in Python, driving a
renderer with a matte of the speaker. The kit mostly makes videos with **no speaker** — a voice
over designed frames — so each recipe was read for its *device* (the page turn, the stamp, the
freeze-and-ring, the numeral that shrinks, the rundown that ticks off) and rebuilt as a
self-contained HTML scene. Recipes whose device needs a face on screen (clean-os, stan-style,
product-page, pov-montage, seoul-list, caption-news) are served instead by `talking-head.mjs`
and its styles. From awesome-opus5-5-videos the storytelling cluster of its 703 prompts gave
one-line drawing, sand animation, the story painted round a vase, silent film, comic panels,
the love letter and kinetic spoken word.

Ideas only — no code, markup, fonts, audio or imagery was copied. The CC0 sounds are fetched at
run time from a pinned ghost-editor commit and never committed. Attribution: `NOTICE.md`.

### Rules that are easy to break in a story

- **Never invent a customer, a quote or a letter.** Real, with permission, or a different frame.
- **Numbers are sourced or labelled illustrative** — every template has the slot for it.
- **Ads** go through `skills/ads-policy-check` before Meta — see `docs/28-facebook-ads.md`.
