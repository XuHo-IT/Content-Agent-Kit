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

**Chỉ đốt phụ đề khi scene là cảnh quay thật** (B-roll, quay màn hình, người nói). Template
`frame-trend-*` đã có chữ chạy riêng; đốt thêm phụ đề lên đó thì hai lớp chữ đè nhau — đã thử
trên 8 video mẫu theo ngành và bỏ. Khi đốt qua `render.mjs`, phụ đề có nền tối mờ để từ nhấn
không trùng màu với khung bên dưới.

## 2b. Video người nói thật — `talking-head.mjs`

```bash
node scripts/video/talking-head.mjs quay.mp4 --transcript quay.json --from 96 --to 128 \
     --crop 405:600:438:0 --style pop --theme clinic-sage --hook "Tiêu đề 2 giây đầu" --credit "Nguồn · giấy phép"
```

Một lệnh: cắt đoạn → cắt khoảng lặng + punch-in → crop bỏ thanh chữ/logo cứng → khung 9:16 →
phụ đề theo **mốc thời gian thật** của từng từ (được dời theo các vết cắt) → tiêu đề mở đầu →
dòng ghi nguồn. Transcript (mốc thời gian từng từ) do `transcribe.mjs` làm:

```bash
node scripts/video/transcribe.mjs quay.mp4                  # → quay.transcript.json
node scripts/video/transcribe.mjs quay.mp4 --from 58 --to 134
```

Hai cách chạy: đặt `TRANSCRIBE_ENDPOINT` trỏ tới một server có `POST /v1/audio/transcriptions`
kiểu OpenAI (speaches / faster-whisper-server, LocalAI…), hoặc cài `pip install faster-whisper`
để chạy ngay trên máy. Kit không đóng gói model (giữ nguyên tắc không phụ thuộc). **Đọc lại
transcript trước khi đăng** — tên riêng và từ hiếm hay bị nghe nhầm. whisperX và whisper.cpp
(`-ojf`) xuất ra file cũng đọc được.

### Ghép nhiều đoạn + B-roll + thẻ minh hoạ — `--edl`

Một video ngắn hay thường không phải một câu trả lời liền, mà là vài đoạn ghép lại: người
nói → cảnh minh hoạ có lời dẫn → người nói tiếp. `--edl edl.json` nhận danh sách đó (giây
tính trên video gốc), mỗi đoạn một vùng crop riêng, cộng các cảnh **B-roll phủ lên người
nói trong khi tiếng vẫn chạy**:

```json
{ "segments": [ { "from": 58.5, "to": 73.2, "crop": "315:560:600:0" },
                { "from": 95.4, "to": 120.8, "crop": "315:560:622:0" } ],
  "broll":    [ { "at": 66.9, "src": 40.0, "dur": 2.6, "crop": "315:560:482:0" } ] }
```

**Thẻ minh hoạ (`cards`)** — template bất kỳ của kit, render với chữ của bạn, đặt đè lên đúng
lúc người nói nhắc tới nội dung đó; tiếng vẫn chạy liên tục:

```json
"cards": [ { "at": 77.9, "dur": 3.8, "layout": "full", "templateId": "frame-trend-stat-odometer",
             "inputs": { "value": "30–50", "unit": "hồ sơ", "label": "mỗi ngày" } },
           { "at": 96.6, "dur": 4.6, "layout": "pip", "templateId": "frame-story-step-numeral",
             "inputs": { "number": "1", "title": "Đông khách thì thêm 2–3 cán bộ" } } ]
```

`full` thay hẳn hình (hợp với lời dẫn), `pip` giữ người nói trong khung nhỏ góc trên (hợp khi
gương mặt quan trọng). Màu thẻ theo `--theme`. Thẻ phải nằm trọn trong một đoạn, không chồng
lên B-roll, ít nhất 1,5 giây; B-roll + thẻ che người nói tối đa ~55% (thẻ `pip` tính một nửa).
Mỗi thẻ là một lần render (~1 phút). Ví dụ đầy đủ: `examples/talking-head-demo/hoan-chinh/`.

Phụ đề tự đi theo: mốc từng từ được dời từ video gốc → video đã ghép → video đã cắt khoảng
lặng. B-roll vượt ~35% thời lượng thì lệnh từ chối — người nói mới là nội dung. Ví dụ thật:
[`examples/talking-head-demo/edl.json`](../examples/talking-head-demo/edl.json).

### Phong cách dựng — `--style`

Cùng một đoạn quay, bảy cách hoàn thiện (ý tưởng từ các preset của ghost-editor; giá trị là
của kit, viết bằng filter ffmpeg + thẻ ASS — `scripts/video/lib/edit-styles.mjs`):

| `--style` | phụ đề | hình | nhịp |
| --- | --- | --- | --- |
| `clean` | chữ trắng viền đen, từ đang nói đổi màu | giữ nguyên | zoom 8% |
| `pop` | CHỮ HOA, 2 từ/lần, từ đang nói nằm trong ô màu | tăng bão hoà | zoom 14%, thanh tiến trình |
| `editorial` | chữ thường, mờ dần vào, các từ khác mờ đi | dịu màu, hạt nhẹ | zoom 6%, thanh tiến trình |
| `cinematic` | chữ có chân (Georgia), từ đang nói nghiêng màu vàng | màu phim, viền tối, hạt; B-roll đen trắng | zoom 5% |
| `kinetic-doc` | MỘT TỪ TO giữa khung, đỏ | đen trắng tư liệu | zoom 10%, thanh tiến trình |
| `launch` | 3 từ/lần, từ khác mờ, từ đang nói xanh điện | tối, lạnh, viền tối | zoom 10%, thanh tiến trình |
| `meme` | CHỮ HOA viền đen dày, từ đang nói vàng và nảy | tăng bão hoà nhẹ | zoom 16% |

Màu nhấn lấy từ `--theme` nếu có (bảng màu theo ngành). Chỉnh màu chạy **trước** khi đốt
phụ đề, nên chữ không bị nhiễu hạt. Font nào cũng phải có dấu tiếng Việt — Impact không có.

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

`talking-head.mjs` assembles one range (`--from/--to/--crop`) or an edit decision list
(`--edl`: several source ranges, each with its own 9:16 crop, plus B-roll cut-aways overlaid
while the speaker's audio runs on; refused above ~35% B-roll), then autocuts, burns active-word
captions mapped source → assembled → cut, and finishes in one of seven `--style` looks
(`clean`, `pop`, `editorial`, `cinematic`, `kinetic-doc`, `launch`, `meme` — caption treatment, grade applied
before captions, punch-in amount, hook card, optional progress bar).
Tests: `tests/autocut.test.mjs`, `tests/active-captions.test.mjs`, `tests/edit-styles.test.mjs`.
