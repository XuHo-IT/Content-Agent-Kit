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

### 2c. Dựng theo lời nói — cắt chỗ vấp, thẻ bám từ, nhạc nền, âm thanh

Cắt khoảng lặng chỉ nghe được *im lặng*. Những thứ người dựng cắt bằng tai — "ờ", "ừm", một
chữ nói hai lần, một câu nói dở rồi nói lại — đều có tiếng, nên `silencedetect` giữ nguyên.
Có transcript từng từ thì tìm được chúng bằng chữ. Cả quy trình: `skills/talking-head-edit/`.

```bash
node scripts/video/speech-cuts.mjs quay.transcript.json                  # file review, chưa cắt gì
node scripts/video/suggest-cards.mjs quay.transcript.json --edl edl.json --out edl.json
node scripts/video/talking-head.mjs quay.mp4 --transcript quay.transcript.json --edl edl.json \
     --cut-words --keep-words 40 --music nen.mp3 --style pop
```

| việc | quy tắc | vì sao |
| --- | --- | --- |
| từ đệm | "ờ", "ừm", "uh"… đứng riêng một từ | là thứ đầu tiên người xem nghe ra "chưa dựng" |
| chữ lặp | 1–6 chữ nói hai lần liền → bỏ **lần đầu** | người ta lặp để sửa; lần sau mới là ý họ |
| nói lại | câu sau mở đầu bằng chính câu trước (≥ 75% chữ trùng) → bỏ câu trước | "để mình nói lại" |
| giữ lại | "từ từ", "rất rất", "dần dần"… trừ khi ngắt giữa hai chữ > 0,3 s | tiếng Việt láy có nghĩa |
| vết cắt | chừa 0,06 s mỗi bên, mảnh < 0,12 s bỏ | nghe giống vết cắt khoảng lặng, không "tách" |
| thẻ bám từ | `"at": "tăng"` (+ `"near": 70` nếu nói nhiều lần) → hiện sớm 0,15 s trước từ | thẻ đã lên khi chữ vừa vang |
| gợi ý thẻ | ≤ 6/phút, cách ≥ 4 s, không lặp template trong ~12 s, full/pip xen kẽ, không trong 3 s đầu | nhịp của reel dựng tay |
| nhạc nền | -26 LUFS, sidechain theo giọng (ratio 6, attack 30 ms, release 450 ms), fade 1 s / 2,5 s | nhạc lùi xuống khi có lời, không "thở" theo từng chữ |
| âm thanh thẻ | `"sfx"` trên thẻ; whoosh sớm 80 ms; ≤ 2 tiếng/3 s, ≤ 0,7 tiếng/s | quá dày thì âm thanh hết nghĩa |
| sửa phụ đề | `"fix": [["^cờ-lốt$", "Claude"]]` — regex trên từng từ | Whisper nghe nhầm tên riêng; chỉ sửa chữ, không sửa mốc |

Mọi quyết định cắt có lý do và số thứ tự từ trong file review — người duyệt ghi đè bằng
`--remove-words` / `--keep-words`. `<out>.cuts.json` ghi lại đã cắt gì, nhạc nào, âm thanh ở
giây nào. Ý tưởng cắt theo lời, thẻ bám từ và luật mật độ học từ MRT Keyword (Phúc Anh MRT) —
repo đó **không công bố giấy phép**, nên không chép dòng nào: quy tắc được viết lại từ đầu
(`scripts/video/lib/speech-edit.mjs`, `lib/card-suggest.mjs`, test `tests/speech-edit.test.mjs`).

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

### 2d. Thẻ `split`, video chỉ có giọng, chữ tránh mặt, chữ sau lưng, ảnh bìa

```bash
node scripts/video/talking-head.mjs quay.mp4 --transcript t.json --edl edl.json --faces --cover --hook "…"
node scripts/video/talking-head.mjs giong.wav --transcript t.json --edl edl.json --theme clinic-sage   # chỉ có giọng
node scripts/video/suggest-cards.mjs t.json --voice-only --out edl.json
node scripts/video/render-batch.mjs tuan-46.txt            # dựng cả danh sách script.json, lỗi một cái không dừng cả lô
```

| việc | cách làm | vì sao |
| --- | --- | --- |
| thẻ `split` | thẻ ở nửa trên, người nói ở nửa dưới, đường accent 6 px giữa hai nửa; `"speakerY"` chọn dải 960 px của người nói (`--faces` tự chọn) | mặt vẫn to, thẻ có hẳn nửa màn hình |
| khung thẻ `split` | render dọc 9:16, tìm dải có nội dung (khung trừ bản làm mờ của chính nó → `cropdetect`), cắt dải đó nguyên cỡ; dải cao hơn 960 px thì thu nhỏ trên nền mờ | bản 16:9 thu về rộng 1080 thì chữ quá nhỏ trên điện thoại — đã thử |
| chỉ có giọng | đầu vào `.wav/.mp3/.m4a` (hoặc video không hình) → nền phẳng màu theo `--theme`; không punch-in; cấm B-roll, `pip`/`split`, `behind`; bỏ trần "che người nói ≤ 55%" | không có hình thì thẻ *là* hình |
| gợi ý cho giọng đọc | `suggest-cards --voice-only`: toàn `full`, 12 thẻ/phút, cách 1,5 s, câu không khớp luật nào nhận `frame-kinetic-type` / `frame-trend-word-pop` xen kẽ | câu không có thẻ chỉ là nền trơn |
| tránh mặt (`--faces`) | YuNet dò mặt 4 khung mỗi cửa sổ ~2 s; hộp mặt nới lên tóc 45%, xuống cằm 20%; phụ đề và hook dời xuống dưới cằm hoặc lên trên đầu nếu còn chỗ trong vùng an toàn, không thì để nguyên | gộp một hộp cho cả đoạn thì hộp phình ra hết khung (một đoạn có nhiều cảnh) |
| chữ sau lưng | EDL `"behind": [{ "at": "gấp", "dur": 2.5, "text": "GẤP 3" }]` — chữ vẽ lên khung đã chỉnh màu, người được tách bằng mặt nạ (MediaPipe selfie segmenter) rồi đặt lại lên trên | người và nền cùng một màu grade, không cần video có kênh alpha |
| âm thanh thẻ tự động | thẻ không ghi `"sfx"` nhận `transition/cc0-paper-flip` (template kiểu myth/error → `error-beep`, verdict/result → `tada`) nếu tiếng trước đã cách ≥ 3 s; `"sfx": false` hoặc `--no-card-sfx` để tắt | một tiếng lật trang nhẹ là thẻ "đã đến", không thành ồn |
| kiểm slot thẻ | `inputs` của thẻ đối chiếu với slot template thật đọc; sai tên → dừng ngay, gợi ý tên đúng | tên slot sai không làm hỏng render — template âm thầm hiện **chữ mẫu** của nó |
| ảnh bìa (`--cover`) | khung lấy **trước** khi đốt phụ đề, qua cùng grade; mặt to nhất trong 40% đầu, không rơi vào thẻ; tiêu đề ≤ 60 ký tự theo kiểu hook, to hơn 30%, dời khỏi mặt | lưới nền tảng cắt tiêu đề dài; mặt người làm người ta dừng lướt |
| bản nháp đăng bài | `<out>.post.md`: lời đã nói *sau khi cắt*, theo câu; giới hạn Facebook (125 ký tự trước "Xem thêm"), TikTok (≤ 150 đọc hết), YouTube (tiêu đề ≤ 100); dòng ghi nguồn nếu có `--credit` | chất liệu để agent viết caption — không phải caption |

Thị giác máy chạy bằng Python, **tuỳ chọn** như `transcribe.mjs`: cài một lần
`python -m venv .venv-vision && .venv-vision\Scripts\pip install mediapipe` (kéo theo OpenCV).
Model tải lần đầu vào `assets/models/`, ghim URL và kiểm sha256: YuNet (opencv_zoo, model MIT,
code Apache-2.0), selfie segmenter (Apache-2.0). **Không dùng** RobustVideoMatting (GPL-3.0) và
`bria-rmbg` (phi thương mại). Chữ sau lưng đẹp nhất ở cảnh trung; cận cảnh thì đầu che gần hết
chữ — script cảnh báo khi người chiếm > 60% khung. Test: `tests/talking-head-extras.test.mjs`.

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

Editing by the words (§2c): `speech-cuts.mjs` reviews fillers, repeated words (the first copy
goes) and retakes (the earlier sentence goes) in a word-timed transcript; `talking-head.mjs
--cut-words` removes them together with the pauses. Cards may be anchored to a spoken word
(`"at": "tăng"`, `"near"`), `suggest-cards.mjs` drafts them from what each sentence says with
reel pacing rules, `--music` ducks a -26 LUFS bed under the voice with a sidechain compressor,
and a card's `"sfx"` is placed with a density check. Ideas from MRT Keyword (no licence
published — rules re-derived, no code copied). Workflow: `skills/talking-head-edit/`.
Tests: `tests/speech-edit.test.mjs`.

Layouts, voice-only, faces, text behind, covers (§2d): a `split` card puts the card's content
band (found on a portrait render: the frame minus a heavy blur of itself, then cropdetect) at
full size on the top half and the speaker's 960-px band on the bottom. An audio-only input
becomes a flat `--theme` background where the cards are the picture; `suggest-cards
--voice-only` drafts all-`full` cards with text fallbacks for sentences no rule matches.
`--faces` (Python + mediapipe, optional) finds the head per ~2 s window with OpenCV YuNet and
moves captions and the hook off it. `"behind"` text is drawn on the graded frame and the
person, masked with MediaPipe's selfie segmenter, is laid back over it. Cards that name no
sound get a soft automatic one, spaced ≥ 3 s. Card `inputs` are checked against the slots the
template reads — a wrong name otherwise renders the template's sample text. `--cover` writes
a cover from a pre-caption frame plus a post brief (what was said, platform limits);
`cover.mjs` does the cover for any video. `render-batch.mjs` renders a list of script.json
files, skipping finished ones, never stopping on a failure. Tests:
`tests/talking-head-extras.test.mjs`.
