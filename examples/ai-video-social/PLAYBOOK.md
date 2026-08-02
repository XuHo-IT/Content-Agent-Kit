# AI Video Social Agent — PLAYBOOK

> Read this every run. Source of truth. Env-only; never hardcode secrets.

## 0. One-line summary
Discover AI/tech news, turn each story into a **9:16 short** (Vietnamese narration + SFX),
review it, then post to TikTok / YouTube Shorts / Facebook Reels / Instagram Reels via Make.com.

## 0b. Voice & language
> 📖 **BẮT BUỘC đọc `VIDEO_CRAFT.md` trước khi viết `script.json`** — §1 hai kênh chữ,
> §2 bảng đọc số tiếng Việt, §3 nhịp, §4 chọn template, §5 giọng kênh + sáo rỗng cấm, §6 tự kiểm.
> Review chấm theo **§7**.

- **Tiếng Việt, đủ dấu.** Giọng nói chuyện với **một người**, không phải "các bạn".
- **Lời đọc (`voiceText`) tuyệt đối không có chữ số** — viết ra chữ. Không emoji, không URL.
- **Chữ trên màn hình (`inputs`) giữ số đẹp** (`200MP`, `82%`) và được dùng emoji vừa phải.
- Mỗi video phải có **ít nhất một scene nói về mặt trái / giới hạn**. Video chỉ khen = mất uy tín.
- Caption bài đăng viết theo giọng riêng, **không phải** chép lại lời đọc.

## 1. Cadence  (phase = day-of-year mod 1 → every day)
- **1–2 video/ngày.** Ít mà chất. Render tốn 3–5 phút/video nên đừng tham số lượng.
- Ý tưởng lấy từ crawl queue; không có thì chọn 1–2 chủ đề AI/công nghệ đang nóng.

## 2. Fan-out
Một subagent cho mỗi video. Mỗi subagent: đọc ý tưởng/excerpt → đọc `VIDEO_CRAFT.md` +
`video-templates/CATALOG.md` → viết `brain/<slug>/script.json` → chạy validator `--strict`
→ chỉ nộp khi sạch lỗi.

## 2a. Render — làm ngay trong lượt chạy, KHÔNG để đến giờ đăng
```bash
node scripts/video/validate-script.mjs brain/<slug>/script.json --strict
node scripts/video/render.mjs brain/<slug>/script.json          # ~3–5 phút
```
Giữ lại đường dẫn `VIDEO=` in ra. Render idempotent theo scene — sửa chữ thì xoá đúng
`clips/scene-<id>.mp4` rồi chạy lại, không phải render lại cả video.

## 2b. REVIEW gate (bắt buộc — docs/07)
Subagent review độc lập cho mỗi video, chấm theo `VIDEO_CRAFT.md` §7:
- Validator sạch ở `--strict` · hook ăn tiền trong 3 giây đầu · nhịp 25–40 từ mỗi scene ·
  tổng 270–360 từ · lời đọc không chữ số/emoji/URL · số đọc lên nghe đúng · template đa dạng ·
  chữ không tràn khung · outro đúng brand + URL.
- **Bắt buộc nhìn khung hình:** `node scripts/video/contact-sheet.mjs brain/<slug>/video.mp4`
  — một ảnh, mỗi scene một ô có nhãn. Validator không nhìn được hình: clip lạc đề, chữ lặp
  đôi, chữ vỡ dòng đều chỉ lộ ở đây.
- **FAIL NGAY:** validator có error · lời đọc bẩn · thiếu scene mặt trái · sai sự thật ·
  B-roll lạc đề · media host là `catbox` (link sẽ chết).
- `fixes` phải **trích đúng câu sai**.

Pass → đăng. Fail → sửa (2–3 vòng) → bỏ + ghi log lý do.

## 3. Hình ảnh
Template lo phần nhìn cơ bản, nhưng scene nào cần **hình thật** thì thêm khối `media`:

- `frame-broll` — cảnh quay phủ kín, một câu đè lên. Cho scene kể chuyện, chuyển không khí.
- `frame-media-inset` — cảnh quay trong khung, chữ vẫn dẫn dắt.
- `frame-screenshot` — ảnh chụp trang gốc, dùng làm **bằng chứng** cho con số/tuyên bố.

Luật: **tả hình ảnh chứ đừng tả khái niệm** khi tìm clip (`"data center servers"` được,
`"artificial intelligence"` ra hình vô nghĩa) · **đọc mô tả clip trước khi ghim id** —
`stock-search.mjs` in ra clip đó quay gì · **không đặt cảnh quay dưới số liệu** · **không quá
1/3 số scene** là B-roll. Chi tiết: `VIDEO_CRAFT.md` §4b và `docs/15-media-sources.md`.

Ảnh bìa (`--thumbnail`) tuỳ chọn; bỏ trống thì nền tảng tự lấy khung đầu.

## 3b. Author
Kênh đứng tên thương hiệu, không phải cá nhân. Không bao giờ gắn nhãn "(AI)".

## 3c. Access tiers
Video công khai toàn bộ.

## 4. Per-item schema
### Video item
```json
{
  "slug": "iphone-17-camera-200mp",
  "scriptPath": "brain/iphone-17-camera-200mp/script.json",
  "videoPath":  "brain/iphone-17-camera-200mp/video.mp4",
  "post":     "Caption cho bài đăng — giọng riêng, có emoji + hashtag",
  "comment":  "Comment đầu tiên: nguồn + link",
  "title":    "Tiêu đề cho YouTube (≤100 ký tự)",
  "hashtags": "#ai #congnghe #iphone",
  "platforms": ["tiktok", "youtube_shorts", "facebook_reels", "instagram_reels"]
}
```
`script.json` theo `templates/VIDEO_SCRIPT.template.json`. Bản quyền: viết lời đọc GỐC từ
excerpt đã crawl, **không dịch/chép nguyên văn**; link nguồn để ở comment.

## 5. Publish + schedule
- Lấy ý tưởng: `node scripts/queue-client.mjs pull`.
- Soi payload trước (miễn phí): `node scripts/social/make-post.mjs --video ... --dry-run`.
- Xếp lịch: `node scripts/scheduler/build-queue.mjs items.json --windows 2 --gap 240` →
  `register-tasks.mjs` → đến giờ `run-item.mjs` chỉ upload + gọi webhook (vài giây).
- Item trong queue để `type: "video"` kèm `videoPath` — xem `templates/state/queue.example.json`.
- Xong mỗi nguồn: `node scripts/queue-client.mjs posted "<source_url>"`.

## 6. Dedup
`history.json` (theo tiêu đề) + crawl queue dedup theo URL. `409` = đã xong.

## 7. Cleanup
Xoá scratch mỗi lượt (`items.json`, `video-silent.mp4`, `voice-raw.mp3`).
**Giữ lại** `script.json`, `video.mp4`, `voice.mp3`, `script.txt`, và cả `voice/` + `clips/`
nếu còn định sửa — xoá chúng là mất tính idempotent, lần sau phải render lại từ đầu.

## 7b. Report
`brain/<slug>/report.md`: chủ đề, kết quả review, thời lượng video, đăng đi đâu, kế hoạch mai.

## 8. Required env
`MAKE_WEBHOOK_URL` · `TTS_PROVIDER` + giọng (xem §8b) · `MEDIA_HOST` + `CLOUDINARY_*`
(hoặc `MEDIA_HOST=catbox`) · `SOCIAL_PLATFORMS` · `SITE_URL` + `INGEST_API_TOKEN` (nếu có crawl).

## 8b. Giọng đọc
Chọn một: `elevenlabs` / `vbee` / `fptai` (chỉ cần API key) hoặc `omnivoice` (miễn phí nhưng
phải dựng server local). Ghi luôn vào `script.json` để video tái tạo được ở máy khác:
```json
"voice": { "provider": "elevenlabs", "voiceId": "…", "speed": 1.0 }
```
**Nghe thử trước khi render:** `node scripts/video/tts-check.mjs`.
Đổi giọng thì **không cần xoá cache tay** — vân tay tự bắt và chỉ đọc lại scene bị ảnh hưởng.
Provider cloud tính tiền theo ký tự: `node scripts/video/render.mjs <script> --estimate`.

## 9. Máy chạy — đọc kỹ
Render **phải** chạy trên máy có FFmpeg + ffprobe và Chrome/Chromium. Giọng thì tuỳ: provider
cloud chỉ cần API key, `omnivoice` thì cần server local. **GitHub Actions không làm được** —
`.github/workflows/daily.yml` ở đây chỉ crawl. Phần render + đăng chạy local qua `schtasks`
(xem `docs/06-scheduling.md`).

## ⚠️ Never do
- Không để chữ số trong `voiceText`. Không emoji trong `hero` của `frame-build-minimal`.
- Không render lúc đến giờ đăng — bài sẽ lên trễ 3–5 phút.
- Không dịch/chép nguyên văn nguồn. Không gắn nhãn "(AI)".
- Không hardcode webhook / token / tài khoản Cloudinary — env-only.
- Không xoá các file `NOTICE.md` trong `video-templates/` — đó là điều kiện giấy phép.
