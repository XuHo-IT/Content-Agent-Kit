---
name: research-and-capture
description: Research a topic, capture real evidence (web screenshots) and stock B-roll, then build the media blocks for a video script, for an agent built with content-agent-kit. Use when the user says "tìm tư liệu cho video", "research rồi làm video", "chụp màn hình trang này đưa vào video", "thêm B-roll", or a video needs footage instead of text-only slides. Produces a script.json whose scenes carry `media` blocks.
---

# Research and capture

Turn a topic into *evidence on screen*: the real announcement page, and footage that shows
what the narration is describing. Without this a video is text slides read aloud.

> Antigravity / Gemini: same steps, run the commands directly.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Tìm nguồn gốc | Tìm và đọc thông báo, bài báo, changelog gốc | Đưa chủ đề hoặc link nếu có |
| 2. Chụp bằng chứng | Chạy `screenshot.mjs --url "<trang>" --out brain/<slug>/shots/<tên>.png` | — |
| 3. Chọn B-roll | Chạy `stock-search.mjs --query "<hình cần có>"` và đọc mô tả từng clip | Duyệt clip nếu muốn |
| 4. Gắn vào scene | Viết khối `media` vào `script.json` | — |
| 5. Kiểm tra và render | `validate-script.mjs --strict` (vài giây) rồi `render.mjs` (3–5 phút) | — |
| 6. Xem khung hình | Trích ảnh từng scene có tư liệu và xem tận mắt | Xác nhận đúng hình |

**Hay vướng:**
- Ảnh chụp dính bảng cookie → tăng `--wait` hoặc chọn trang khác.
- B-roll lạc đề (tìm "tin nóng" ra cốc cà phê) → mô tả hình cụ thể, không mô tả khái niệm.
- Sửa chữ trong scene mà video không đổi → xoá `clips/scene-<id>.mp4` rồi render lại.

## 1. Research the topic first

`WebSearch` for the primary source, then `WebFetch` it. Prefer the announcement, the paper,
the changelog — not a blog summarising them. Pull out **concrete, quotable facts**: dates,
figures, prices, names. Those become the script; everything else is filler.

For deep academic or technical topics:
- Pair with **`academic-deep-research`** to explore scientific literature, verify methodology, and extract empirical datasets without hallucinations.
- Pair with **`academic-writing-flow`** to run evidence verification contracts, cross-checking every claim against peer-reviewed citations before scripting.

Note the 2–4 URLs worth *showing*. A page is worth showing when the narration makes a claim
a viewer might doubt.

## 2. Capture the evidence

```bash
node scripts/media/screenshot.mjs \
  --url "https://www.example.com/announcement" \
  --out brain/<slug>/shots/announce.png --width 1280 --height 860 --wait 8000
```

You don't need to run this by hand for a scene — a `media` block with
`kind: "screenshot"` makes the render step do it. Run it manually when you want to *look*
at the result first, which is worth doing for any page you haven't captured before.

**Screenshots are evidence, not decoration.** Capture the page being talked about, at the
moment it's talked about. A generic homepage adds nothing.

**Known limitation:** a cookie/consent wall will appear in the image if the site shows one —
Chrome offers no way to suppress it. Raise `--wait`, choose a different page, or capture
that one by hand.

## 3. Choose B-roll

```bash
node scripts/media/stock-search.mjs --query "data center servers" --limit 6
```

The output tells you **what each clip actually shows**. Read it before pinning an id.
Stock relevance is loose: a query for `breaking news screen` will happily return a cup of
coffee, and that is exactly how off-topic footage ends up in a finished video.

Rules that decide whether B-roll helps or hurts:

- **Describe the picture, not the concept.** `"data center servers"` → usable.
  `"artificial intelligence"` → generic blue swirls.
- **Never put B-roll behind a number.** A statistic needs `frame-pentagram-stat` or
  `frame-vignelli` — footage makes it unreadable.
- **Alternate.** B-roll on every scene turns a news video into a perfume advert. Two or
  three footage scenes in a twelve-scene piece is plenty.
- **Pin the id, don't ship a query.** `"id": "28709421"` is reproducible. A bare `query` is
  resolved once and written to `media-lock.json` — fine, but commit that file.

## 4. Write the media blocks

```json
{ "id": "hook", "templateId": "frame-broll",
  "media": { "kind": "video", "source": "pexels", "id": "28709421" },
  "inputs": { "chip": "🔥 Tin nóng", "kicker": "…", "headline": "…", "subheadline": "…" } }

{ "id": "body-4", "templateId": "frame-screenshot",
  "media": { "kind": "screenshot", "url": "https://…", "width": 1280, "height": 860 },
  "inputs": { "kicker": "Nguồn gốc", "headline": "Công bố chính thức",
              "url": "example.com/announcement", "caption": "…", "source": "example.com" } }

{ "id": "body-11", "templateId": "frame-media-inset",
  "media": { "kind": "video", "source": "pexels", "id": "5495899" },
  "inputs": { "kicker": "Kết luận", "headline": "…", "caption": "…" } }
```

Which template:

| The footage… | Template |
|---|---|
| **is** the scene, one line over it | `frame-broll` |
| **illustrates** a point the words carry | `frame-media-inset` |
| is a web page you're citing | `frame-screenshot` |

Sites with no public API (Mixkit, Videezy, Videvo, Coverr) go through `source: "manual"` —
list the clip in `stock-sources.yaml` first. See `docs/15-media-sources.md`.

## 5. Validate and render

```bash
node scripts/video/validate-script.mjs brain/<slug>/script.json --strict
node scripts/video/render.mjs brain/<slug>/script.json
```

The render resolves each `media` block, caches it in `media-lock.json`, and reuses it on
every later run. Changing an `id` re-resolves that scene by itself; `--refresh-media`
re-resolves everything.

**Editing a scene's `inputs` does NOT re-render its clip** — delete
`clips/scene-<id>.mp4` first. (Narration is different: it re-generates by itself when the
text or voice changes.)

## 6. Check what you made

Extract a frame from each media scene and **look at it**:

```bash
ffmpeg -y -ss 3 -i video.mp4 -frames:v 1 -vf scale=405:720 check.png
```

Nobody previewed that footage, and a clip whose description sounded right can still be
wrong. This step is what catches it.

## Notes

- Pexels and Pixabay allow commercial use with no attribution required. `media-lock.json`
  keeps source, author and licence on file anyway — commit it.
- More visual variety: `node scripts/video/add-template.mjs --preset news` pulls
  transitions, animated captions and broadcast furniture from the upstream registry.
  See `docs/16-template-registry.md`.
