# 26 · Tự động dựng: cắt khoảng lặng, punch-in, caption từng từ (Auto-edit)

> 🇻🇳 Tiếng Việt trước · English below.

Hai việc mà trước đây phải mở CapCut: cắt các khoảng ngập ngừng trong một đoạn quay nói
chuyện, và làm phụ đề kiểu "từng từ sáng lên". Cả hai giờ là một lệnh, chỉ cần ffmpeg.

Phương pháp port từ [kurbaitaev/ghost-editor](https://github.com/kurbaitaev/ghost-editor)
(MIT) — chỉ lấy ý tưởng và các con số mặc định đã được kiểm chứng, viết lại bằng Node, không
Python, không Whisper, không tải model.

## 1. Cắt khoảng lặng — `autocut.mjs`

```bash
node scripts/video/autocut.mjs quay-tho.mp4                          # → quay-tho.cut.mp4
node scripts/video/autocut.mjs quay-tho.mp4 --vertical --punch 0.12  # 9:16 + zoom xen kẽ
node scripts/video/autocut.mjs quay-tho.mp4 --dry-run                # chỉ in danh sách cắt
node scripts/video/autocut.mjs giong-doc.wav                         # chỉ âm thanh cũng được
```

| bước | mặc định | vì sao con số đó |
| --- | --- | --- |
| tìm khoảng lặng (`silencedetect`) | -35 dB, ≥ 0.28 s | ngắn hơn ~0.28 s là hơi thở giữa các từ — cắt sẽ nghe như ghép |
| chừa đệm mỗi bên vết cắt | 0.10 s | giữ đuôi của từ trước và tiếng bật của từ sau |
| bỏ "đảo" tiếng quá ngắn | < 0.20 s | 60 ms giữa hai khoảng lặng là tiếng click / chép miệng |
| fade âm thanh mỗi mép | 12 ms | không có thì mọi vết cắt đều "tách" vì sóng bị cắt giữa chu kỳ |
| punch-in xen kẽ (`--punch`) | tắt (0.12 là hợp lý) | jump-cut trên khung không đổi trông như lỗi; đổi khung trông như dựng |
| chuẩn hoá loudness | -16 LUFS, -1.5 dBTP | mức các nền tảng tự đưa về — đưa trước thì không bị nén lần hai |

Kết quả kèm `<file>.cuts.json`: danh sách đoạn **giữ lại** theo thời gian gốc. Hai công dụng:
người duyệt xem được chính xác cái gì đã bị cắt trước khi tin; và mốc thời gian làm trên bản
gốc (b-roll, ghi chú) chuyển được sang bản đã cắt bằng `remapTime()`.

Phòng ồn? Nếu báo `more than 60% removed`, hạ ngưỡng: `--noise -42`.

## 2. Caption từng từ — `--caption-style active`

```bash
node scripts/video/render.mjs brain/<slug>/script.json --captions burn --caption-style active
```

| | `box` (mặc định cũ) | `active` (mới) |
| --- | --- | --- |
| mỗi lần hiện | một câu ngắn | 2–3 từ |
| nền | hộp mờ | không hộp — viền đen + bóng |
| nhấn | không | từ **đang được đọc** đổi màu và to hơn 12% |
| màu nhấn | — | lấy theo hue của `theme` → caption cùng bảng màu với khung hình |
| vị trí | đáy khung | 1/3 dưới — dưới cằm người nói, tránh thanh like/comment của app |

Thời gian từng từ được chia theo mật độ âm tiết bên trong mỗi câu; ranh giới scene thì chính
xác tuyệt đối (render.mjs tự dựng track âm thanh). Không bao giờ để một nhóm vắt qua dấu chấm
câu. Dấu tiếng Việt và chữ HOA (`ĐỪNG`, `LỠ`) được test.

## 3. Template "trend" — ngữ pháp dựng 2026 cho scene

`frame-trend-word-pop` mang đúng kiểu caption từng từ vào *thiết kế khung* (cho hook 2 giây
đầu). Bộ 13 template `frame-trend-*` thay thế 27 template cũ — xem `video-templates/CATALOG.md`.

---

## English

`autocut.mjs` removes pauses from a talking-head take with ffmpeg alone — silencedetect at
-35 dB / ≥0.28 s, 0.10 s padding each side, sub-0.2 s islands dropped, 12 ms audio fades at
every edge, optional alternating punch-in (`--punch 0.12`) cropped back to the exact frame
size, `--vertical` 1080×1920, and loudnorm to -16 LUFS. It writes a `.cuts.json` edit list in
source time. `render.mjs --caption-style active` writes active-word ASS captions: 2–3 words
per card, no box, the spoken word recoloured in the theme's accent hue and scaled 112%.
Method and defaults ported from kurbaitaev/ghost-editor (MIT) — ideas only, no code copied.
Tests: `tests/autocut.test.mjs`, `tests/active-captions.test.mjs`.
