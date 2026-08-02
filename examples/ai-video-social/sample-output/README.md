# Video mẫu — đầu ra thật của `ai-video-social`

> Đây là **video thật đã render**, không phải mockup. Giọng Vbee thật, B-roll thật tải từ
> Pexels, ảnh chụp thật của trang công bố gốc.
>
> Cùng nguồn này còn được viết thành bài — xem
> [`examples/ai-news-social/sample-output/`](../../ai-news-social/sample-output/).
> **Một nguồn, hai định dạng.**

## ▶️ Xem video

**[Tải `claude-fable-5-sample-1080x1920.mp4` (15,5 MB)](https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.1.0)**
— kèm cả `voice.mp3` riêng cho CapCut.

File mp4 nằm ở Release chứ không commit vào repo: 15,5 MB là quá nặng cho git history, và
**mọi thứ cần để tái tạo lại đúng video đó đều nằm trong thư mục này**.

| | |
|---|---|
| Thời lượng | 2 phút 12 giây (132,6 s) |
| Khung hình | 1080 × 1920 (9:16) — TikTok / Reels / Shorts |
| Số scene | 15 · 497 từ lời đọc |
| Giọng | Vbee `hn_female_ngochuyen_full_48k-fhg` |
| Media | 3 clip Pexels + 1 ảnh chụp `anthropic.com` |
| Nguồn | https://www.anthropic.com/news/claude-fable-5-mythos-5 |

## 15 scene trong một ảnh

![Contact sheet — 15 scene của video mẫu](contact-sheet.jpg)

Ảnh này do `contact-sheet.mjs` sinh ra, và **nó là bước review bắt buộc**, không phải trang trí.
Dấu `*` đánh dấu scene có media. Bốn lỗi từng lọt vào video hoàn chỉnh mà validator không bắt
được — B-roll lạc đề, tiêu đề in hai lần, headline lặp nhãn, một từ vỡ dòng — và **cả bốn đều
lộ ra ngay trong một cái nhìn vào ảnh này**.

```bash
node scripts/video/contact-sheet.mjs <thư-mục>/video.mp4
```

## Trong thư mục này có gì

| File | Là gì |
|---|---|
| `script.json` | **Đầu vào.** Toàn bộ thứ AI viết ra: lời đọc, chọn template, chữ trên màn hình, khối `media` |
| `media-lock.json` | Ghim đúng clip Pexels nào đã dùng — cùng lúc là **sổ ghi nguồn** (tác giả, giấy phép, link) |
| `script.txt` | Lời đọc thuần, để CapCut tự tạo phụ đề |
| `contact-sheet.jpg` | Ảnh trên |

## Tự render lại

Nhờ có `media-lock.json`, lệnh này cho ra **đúng video đó** — không tìm kiếm lại, không tải clip
khác:

```bash
node scripts/video/validate-script.mjs examples/ai-video-social/sample-output/script.json --strict
node scripts/video/render.mjs          examples/ai-video-social/sample-output/script.json
```

Cần trên máy: FFmpeg + ffprobe, Chrome, và một giọng đọc (`TTS_PROVIDER` + key, hoặc server
OmniVoice local). Muốn dùng giọng khác thì sửa khối `voice` trong `script.json` — lời đọc sẽ tự
sinh lại vì nó được đánh vân tay theo provider/giọng/tốc độ/nội dung.

Chưa có API key Pexels? Xoá `media-lock.json` rồi thêm key của bạn, pipeline sẽ tự tìm lại clip
theo `media.id` đã ghim.

## Kịch bản này đúng luật ở đâu

`validate-script.mjs --strict` chấm sạch. Vài luật đáng nói:

- **Không một chữ số nào trong `voiceText`.** TTS tiếng Việt đọc `GPT 5.5` thành "năm rưỡi", nên
  mọi con số đều viết ra chữ: *"năm mươi triệu dòng"*, *"chín mươi phần trăm"*, *"mười đô la"*.
  Trong khi `inputs` (chữ trên màn hình) vẫn giữ `50 triệu`, `90%`, `$10 / $50` cho dễ đọc.
- **15 scene, mỗi scene body 25–40 từ** — mỗi scene chỉ một ý, ở trên màn hình 6–10 giây.
- **B-roll là gia vị, không phải món chính.** Chỉ 4/15 scene có media; scene nào có số liệu đều
  dùng template chữ, vì cảnh quay làm con số không đọc được.
- **Có scene nói mặt trái** — playbook bắt buộc: video chỉ khen là video mất uy tín.

## Đăng nó đi đâu

Payload gửi tới Make.com nằm ở [`../sample-post/post.json`](../sample-post/post.json):

```bash
node scripts/social/make-post.mjs --json examples/ai-video-social/sample-post/post.json --dry-run
```

## Giấy phép của clip trong video

`media-lock.json` lưu nguồn, tác giả và giấy phép từng clip. Cả ba đều từ Pexels — **cho dùng
thương mại, không bắt buộc ghi nguồn**, nên không có dòng ghi công nào hiện trong video. Sổ vẫn
được giữ để truy được về sau.
