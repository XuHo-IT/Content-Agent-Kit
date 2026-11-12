---
name: creator-start
description: The front door for someone who does not code — finds out what they have (a phone recording, just a voice memo, a link or article, only a topic, an ad to check, their channel's numbers) and what they want out (a short video, a post, a cover, a schedule), asks one question at a time, checks the machine has what that path needs, and hands over to the right skill. Use when the user says "bắt đầu", "tôi muốn làm video", "làm sao dùng kit này", "tôi không biết code", "giúp tôi làm nội dung", or opens the kit without saying what they want.
---

# Bắt đầu — dẫn người mới vào đúng việc

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Đầu mỗi bước báo **"Bước n/N — <tên bước>"**. Người dùng không cần biết EDL, cờ dòng lệnh hay tên template. Việc của skill này: hỏi **từng câu
một**, bằng lời thường, rồi chuyển sang đúng skill và nói trước sẽ mất bao lâu.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Hỏi bạn đang có gì | Một câu, kèm lựa chọn (bảng dưới) | Chọn một |
| 2. Hỏi bạn muốn ra gì | Video ngắn / bài đăng / ảnh bìa / lịch đăng / số liệu | Chọn một |
| 3. Kiểm máy | Chỉ kiểm những gì đường đã chọn cần (bảng "Cần gì") | Cài thêm nếu thiếu — agent nói đúng lệnh |
| 4. Kiểm cập nhật | `freshness-check` nếu sắp đăng hoặc chạy quảng cáo | — |
| 5. Chuyển việc | Gọi đúng skill, nói thời gian ước tính | Làm theo từng bước của skill đó |

### Câu 1 — "Bạn đang có gì trong tay?"

| Người dùng có | Đi tới | Thời gian |
|---|---|---|
| Video **tự quay** (điện thoại, có mặt mình) | `talking-head-edit` | 5–15 phút |
| Chỉ **file ghi âm** giọng nói | `talking-head-edit` (chế độ chỉ có giọng — thẻ thay cho hình) | 5–10 phút |
| Một **link bài viết** hoặc file văn bản | `create-video` (video) hoặc `daily-run` (bài + video) | 5–10 phút |
| Chỉ một **chủ đề** ("hôm nay có gì hot về AI") | `topic-radar` → `daily-topic-video` | 10–20 phút |
| Một **câu chuyện thương hiệu / khách hàng** | `story-video` | 10–15 phút |
| Một **video đã có**, cần đăng | `video-and-post` (ảnh bìa, kiểm file, caption, lịch) | 3–5 phút |
| **Chữ quảng cáo** cần kiểm | `ads-policy-check` | 1–2 phút |
| **Số liệu kênh** (file xuất từ TikTok/Meta/YouTube Studio) | `performance-review` | 2–5 phút |
| Muốn dựng **cả một agent** chạy hằng ngày | `bootstrap-content-agent` | 20–40 phút |

### Câu 2 — "Bạn muốn nhận được gì?"

Video ngắn 9:16 · bài đăng kèm caption · ảnh bìa · lịch đăng tự động · báo cáo video nào hiệu quả.
Nếu câu trả lời đã rõ từ câu 1 (ví dụ đưa file quay → video ngắn) thì **bỏ qua câu này**.

### Cần gì cho từng đường

| Đường | Bắt buộc | Tuỳ chọn |
|---|---|---|
| Mọi video | Node 18+, ffmpeg (`ffmpeg -version`) | — |
| Video từ kịch bản (`create-video`, `story-video`) | Chrome; một giọng đọc (`node scripts/video/tts-check.mjs`) | nhạc nền CC0 |
| Video tự quay / ghi âm | transcript: `transcribe.mjs` cần Python + `faster-whisper` | `--faces`, chữ sau lưng: `mediapipe` (`docs/26` §2d) |
| Đăng bài | biến môi trường đăng bài trong `.env` (`docs/11-social-posting.md`) | — |
| Số liệu YouTube tự động | `YOUTUBE_API_KEY` | TikTok/Facebook: chỉ cần file CSV |

Thiếu thứ gì thì nói đúng **một** lệnh cài, chờ người dùng cài xong rồi kiểm lại — đừng đưa cả danh sách.

**Hay vướng:**
- Người dùng gửi link bị chặn (cần đăng nhập, paywall) → nói thẳng, xin bản văn bản; không bịa nội dung.
- Người dùng muốn "làm hết" → chọn **một** video đầu tiên, làm xong, rồi mới mở rộng.
- Lần đầu chạy, model nhận dạng giọng tải khoảng 1,6 GB — báo trước.

## Quy trình chi tiết (cho agent)

1. Greet in one line; ask Câu 1 with the options as a short list. One question per message.
2. Map the answer to the row above; ask Câu 2 only if the output is not already implied.
3. Check ONLY that path's requirements (table "Cần gì") with the commands given; on a gap,
   give one install command and wait.
4. If the result will be posted or advertised, run `freshness-check` first (it is quick when
   nothing has expired).
5. Hand over: name the skill, the time it takes, and what the user will be asked during it.
   Follow that skill's own step table from there.
6. At the end, offer the one next step that compounds: after the first video →
   `performance-review` in a week; after a few posts → `daily-run` on a schedule.
