# 30 — Đề xuất làm tiếp / Backlog

Danh sách việc **chưa làm**, gom từ đợt khảo sát [repo.tinix.ai](https://repo.tinix.ai/vi) và
GitHub trending (11/2026) và từ những gì còn dở trong kit. Đây là chỗ để quyết định, không phải lời hứa:
mỗi mục ghi rõ nó là gì, cắm vào kit ở đâu, giấy phép, công sức, và **bước đầu tiên** để thử.

**Cách cập nhật:** sửa cột *Trạng thái* trong bảng tổng quan, ghi ngày và một dòng kết luận vào mục
*Ghi chú* của từng đề xuất. Làm xong thì chuyển xuống phần [Đã xong](#đã-xong); bỏ thì ghi lý do vào
phần [Đã loại](#đã-loại) — để lần khảo sát sau không đề xuất lại đúng thứ đó.

Trạng thái: `chưa làm` · `đang thử` · `xong` · `bỏ` · `chờ quyền cài` (cần người dùng cho phép cài gói/model bên ngoài) · `tự động` (freshness-check lo). Công sức: **S** vài giờ · **M** 1–2 ngày · **L** nhiều ngày.

## Tổng quan

| # | Đề xuất | Nhóm | Công sức | Giá trị | Trạng thái |
|---|---|---|---|---|---|
| 1 | Chạy thử `transcribe.mjs` với faster-whisper thật | phụ đề | S | cao | xong |
| 2 | Giọng đọc ZeroTTS qua `openai-speech` | giọng đọc | S–M | cao | chờ quyền cài |
| 3 | Phụ đề tiếng Việt chính xác hơn: PhoWhisper + căn mốc từ | phụ đề | M | cao | bỏ |
| 4 | Dựng hàng loạt từ một danh sách | video | M | trung bình | xong |
| 5 | Thẻ minh hoạ: kiểu `split` và âm thanh tự động | video | S–M | trung bình | xong |
| 6 | Nhân bản giọng nói với VoxCPM2 | giọng đọc | M | trung bình | chờ quyền cài |
| 7 | agent-browser: chụp và quay cuộn trang web làm B-roll | video | S–M | trung bình | xong |
| 8 | Đo "AI có nhắc tới thương hiệu không" (ý tưởng NiubiGEO) | SEO/GEO | M | trung bình | xong |
| 9 | Nguồn video miễn phí Coverr | video | S | thấp–trung bình | chưa làm |
| 10 | Video thuyết trình 16:9 (garden-skills) | video | S | thấp–trung bình | xong |
| 11 | Scrapling làm crawler dự phòng | thu thập | M | trung bình | chưa làm |
| 12 | Kiểm lại căn cứ pháp lý của `ads-policy-check` | quảng cáo | S | cao | tự động |
| 13 | Quyết định về `vibe-motion` (không có giấy phép) | dọn dẹp | S | thấp | xong |
| 14 | Nghe lại chữ "chuyển về" trong transcript demo | dọn dẹp | S | thấp | chưa làm |
| 15 | Kiểm commit ghim của `marketingskills` | dọn dẹp | S | thấp | xong |
| 16 | Thẻ và phụ đề tự tránh khuôn mặt | video | M | cao | xong |
| 17 | Tách người khỏi nền: chữ sau lưng, người bật khỏi khung | video | L | trung bình | xong |
| 18 | Video chỉ có giọng đọc → thẻ trên nền màu | video | M | trung bình | xong |
| 19 | Ảnh bìa + tiêu đề, caption Facebook/TikTok khi dựng xong | video | S | trung bình | xong |
| 20 | Đo hiệu quả sau khi đăng, học ngược vào kế hoạch | vận hành | M | cao | xong |
| 21 | Tự kiểm dữ kiện hết hạn (luật, chính sách, thông số) khi dùng kit | vận hành | M | cao | xong |
| 22 | Màn hình bắt đầu cho người không biết code | vận hành | S | cao | xong |
| 23 | Video AI ra **video hoàn chỉnh**, không chỉ clip rời | video | M | cao | xong |
| 24 | Bản địa hoá: một `script.json` → bản tiếng Anh/Nhật/Thái | quốc tế | M | cao | xong |
| 25 | Chạy thử thật các provider trả phí mới | vận hành | S | cao | đang thử |
| 26 | Đăng lên nền tảng Việt: Zalo OA, TikTok Shop, Shopee Video | đăng bài | M–L | cao | xong (gói đăng tay) |
| 27 | Tổng chi phí theo tháng cho mọi provider | vận hành | S–M | trung bình | xong |
| 28 | Avatar nói / lồng tiếng khớp môi cho kênh không lộ mặt | video | M | trung bình | chưa làm |
| 29 | Video mẫu tiếng Anh trong README.en | quốc tế | S | trung bình | đang thử |
| 30 | Tự kéo số liệu TikTok / Facebook thay vì nhập CSV | vận hành | M | trung bình | chưa làm |

---

## Phụ đề và giọng đọc

### 1. Chạy thử `transcribe.mjs` với faster-whisper thật

- **Vì sao:** script mới chỉ được kiểm bằng test đơn vị; chưa chạy với một engine nhận dạng thật.
- **Bước đầu tiên:** `pip install faster-whisper`, rồi
  `node scripts/video/transcribe.mjs <video>.mp4 --from 58 --to 134` trên phóng sự demo và so với
  `examples/talking-head-demo/transcript.json`. Lần đầu tải model khoảng 1,5 GB.
- **Kiểm gì:** số từ có mốc thời gian, độ lệch mốc so với tiếng, chữ tiếng Việt có dấu đúng.
- **Ghi chú:** 2026-11-11 — xong. large-v3-turbo trên phóng sự 63 s: WER 7,4%, 96% từ lệch < 150 ms. Lần chạy thật lộ 2 lỗi đã sửa (PyAV 16 bỏ tham số; Windows cp1252 vỡ tiếng Việt). `--prompt` làm model bỏ sót 14 s → có bước gác tự báo. Số liệu: docs/26 §2d.

### 2. Giọng đọc ZeroTTS qua `openai-speech`

- **Là gì:** [ZeroTTS](https://github.com/zeroweight-ai/ZeroTTS) — giọng tiếng Việt chạy trên CPU,
  MIT (code và weights; codec đi kèm Apache-2.0; bộ dữ liệu benchmark CC-BY-NC — không dùng cho
  sản phẩm thương mại).
- **Vì sao:** tự báo tỉ lệ đọc sai 1,03% so với 4,13% của OmniVoice. **Đây là số của chính nhà phát
  triển, chưa ai kiểm độc lập**; OmniVoice nhỉnh hơn về độ giống giọng.
- **Cắm vào kit:** chạy sau một server có `POST /v1/audio/speech` rồi đặt
  `TTS_PROVIDER=openai-speech` — kit đã có sẵn adapter, không cần sửa code.
- **Bước đầu tiên:** đọc cùng một script bằng hai giọng, nghe A/B rồi mới quyết định đổi mặc định.
- **Ghi chú:** 2026-11-11 — chờ quyền: cài `zerotts` (pip, ~900 MB weights) bị chặn trong phiên tự động. Hướng đã chốt: một server nhỏ nói `POST /v1/audio/speech` → `TTS_PROVIDER=openai-speech`, không sửa code kit; rồi nghe A/B.

### 3. Phụ đề tiếng Việt chính xác hơn: PhoWhisper + căn mốc từ

- **Là gì:** [PhoWhisper](https://github.com/VinAIResearch/PhoWhisper) (VinAI, BSD-3) — Whisper
  tinh chỉnh cho tiếng Việt, bản medium sai 4,97% trên VIVOS.
- **Vướng:** không tự cho mốc thời gian từng từ, nên cần thêm bước căn mốc (whisperX hoặc tương tự).
- **Không dùng:** Qwen3-ASR — bộ căn mốc của nó không hỗ trợ tiếng Việt, nên không làm phụ đề từng
  từ được.
- **Ghi chú:** 2026-11-11 — **bỏ** sau khi đo: PhoWhisper-medium (BSD-3) qua faster-whisper/CTranslate2 cho WER 17,4% và chỉ 40% từ lệch < 150 ms (mốc từng từ không hợp phụ đề), so với 7,4% / 96% của large-v3-turbo. Xem lại nếu có bản PhoWhisper kèm căn mốc từ riêng.

### 6. Nhân bản giọng nói với VoxCPM2

- **Là gì:** [VoxCPM](https://github.com/OpenBMB/VoxCPM), Apache-2.0, 30 ngôn ngữ có tiếng Việt,
  nhân bản giọng, âm thanh 48 kHz.
- **Vướng:** cần card đồ hoạ (GPU); bản chạy CPU chậm hơn thời gian thực. Hợp cho video "hero"
  theo hồ sơ `profiles/business.json`, không hợp cho hàng đợi hằng ngày.
- **Lưu ý:** nhân bản giọng của người khác cần **sự đồng ý của chính người đó**.
- **Ghi chú:** 2026-11-11 — máy có GPU (RTX 3050 4 GB) nên khả thi; chờ quyền cài model ngoài. Khi làm: bắt buộc sự đồng ý của người được nhân bản + nhãn AI (review-gate → Policy).

## Video

### 4. Dựng hàng loạt từ một danh sách

- **Ý tưởng từ:** [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) (MIT) — chỉ
  mượn ý tưởng, không chép code.
- **Là gì:** một file danh sách (mỗi dòng một `script.json`); dựng lần lượt, **một video lỗi không
  làm dừng cả lô**, cuối cùng báo video nào xong, video nào lỗi. Hiện `render-all-galleries.mjs`
  chỉ làm việc này cho ảnh danh mục.
- **Ghi chú:** 2026-11-11 — xong: `scripts/video/render-batch.mjs` (danh sách hoặc thư mục, bỏ qua video đã dựng, `--validate-only`, báo cáo `<list>.report.json`).

### 5. Thẻ minh hoạ: kiểu `split` và âm thanh tự động

- **Đang có:** thẻ `full` và `pip` trong `talking-head.mjs` (`docs/26-auto-edit.md`). Từ 2026-11-11 thẻ
  nhận `"sfx"` (đặt tay, có kiểm mật độ) — phần còn lại là `split` và tự chọn âm thanh theo template.
- **Thêm:** `split` — thẻ ở nửa trên, người nói ở nửa dưới (kiểu bảng trắng của ghost-editor); và
  tự gắn một âm thanh nhẹ (`transition/cc0-paper-flip`) khi thẻ hiện, có thể tắt.
- **Ghi chú:** 2026-11-11 — xong: `"layout": "split"` (render dọc, cắt dải có nội dung — bản 16:9 chữ quá nhỏ, đã thử) và âm thanh tự động theo template, cách ≥ 3 s, tắt bằng `"sfx": false` / `--no-card-sfx`.

### 7. agent-browser: chụp và quay cuộn trang web

- **Là gì:** [agent-browser](https://github.com/vercel-labs/agent-browser), Apache-2.0 — trình duyệt
  điều khiển bằng dòng lệnh, giữ phiên đăng nhập, có lệnh quay màn hình.
- **Cắm vào kit:** thêm vào `skills/registry.json`, hoặc làm engine phụ cho `screenshot.mjs`; quay
  cuộn một trang web thành B-roll cho `research-and-capture`.
- **Ghi chú:** 2026-11-11 — xong: thêm vào `skills/registry.json` (Apache-2.0, 49,7k ★).

### 9. Nguồn video miễn phí Coverr

- **Cắm vào kit:** thêm một nguồn trong `scripts/media/lib/sources/`, cạnh Pexels và Pixabay.
- **Bước đầu tiên:** đọc điều khoản giấy phép của Coverr trước khi viết code.
- **Ghi chú:**

### 10. Video thuyết trình 16:9

- **Là gì:** [garden-skills](https://github.com/ConardLi/garden-skills), MIT — biến bài viết thành
  bộ slide có lời đọc dạng 16:9. Kit hiện mạnh ở video dọc, còn thiếu dạng dài này.
- **Cắm vào kit:** một mục trong `skills/registry.json`.
- **Ghi chú:** 2026-11-11 — xong: `web-video-presentation` (garden-skills, MIT) trong registry.

## SEO, thu thập và quảng cáo

### 8. Đo "AI có nhắc tới thương hiệu không"

- **Ý tưởng từ:** [NiubiGEO](https://github.com/Albert-Weasker/niubigeo), Apache-2.0 — hỏi các mô
  hình AI những câu khách hay hỏi, đếm xem thương hiệu và đối thủ được nhắc bao nhiêu lần, nguồn
  nào được trích.
- **Cắm vào kit:** đặt cạnh `scripts/geo-audit.mjs` (skill `geo-optimize`).
- **Vướng:** cần OpenRouter (trả phí) hoặc Ollama chạy trên máy (miễn phí).
- **Ghi chú:** 2026-11-11 — xong: `scripts/research/ai-mentions.mjs` (endpoint chuẩn OpenAI: Ollama miễn phí hoặc OpenRouter), tỉ lệ được nhắc, thị phần tiếng nói, nguồn hay trích.

### 11. Scrapling làm crawler dự phòng

- **Là gì:** [Scrapling](https://github.com/D4Vinci/Scrapling), BSD-3 — lấy dữ liệu từ trang không
  phải WordPress, có CLI và MCP.
- **Cẩn trọng:** nó có tính năng vượt Cloudflare. Kit chỉ lấy trích đoạn kèm link và tôn trọng
  bản quyền — nếu dùng, **tắt tính năng đó** và ghi rõ trong `docs/10-crawl-discovery.md`.
- **Ghi chú:**

### 12. Kiểm lại căn cứ pháp lý của `ads-policy-check` (định kỳ)

- **Vì sao:** Luật 75/2025/QH15 (hiệu lực 01/01/2026) và Nghị định 239/2026/NĐ-CP (26/06/2026) đã
  thay đổi quy định; các nguồn còn nói khác nhau về việc trần giảm giá 50% còn hay không, nên kit
  đang để mức "cảnh báo" thay vì "chặn".
- **Bước đầu tiên:** đối chiếu văn bản hợp nhất trên vbpl.vn, cập nhật `RULES` và `LEGAL_CHECKED`
  trong `scripts/ads/policy-lint.mjs`. Nên làm mỗi khi có nghị định/thông tư mới về khuyến mại.
- **Ghi chú:** lần kiểm gần nhất 2026-11-11. Từ 2026-11-11 tự động: mục `vn-ads-law` trong `freshness-check` (hạn 30 ngày) — agent tự tra và đề xuất khi hết hạn.

## Dọn dẹp

### 13. Quyết định về `vibe-motion`

- `skills/registry.json` có `vibe-motion/skills` với giấy phép "NONE". Kit không đóng gói nó, chỉ
  cho tải về máy người dùng (xem `NOTICE.md` §2), nhưng nên cân nhắc **bỏ hẳn** hoặc ghi "chỉ tham khảo".
- **Ghi chú:** 2026-11-11 — **giữ**, như đã ghi ở `docs/17` §3: kit không chứa bản nào, trình cài in rõ "không giấy phép — chỉ dùng trên máy, không phân phối lại" và ghi vào NOTICE. Upstream vẫn hoạt động (cập nhật 11/2026) và tự in lệnh cài.

### 14. Nghe lại chữ "chuyển về" trong transcript demo

- `examples/talking-head-demo/transcript.json`, giây 66,8: cả hai model đều nghe là "chuyển viện";
  đã sửa thành "chuyển về" theo ngữ cảnh nhưng **chưa nghe lại để xác nhận**.
- **Ghi chú:**

### 15. Kiểm commit ghim của `marketingskills`

- `coreyhaines31/marketingskills` (MIT) đang trending trở lại — kiểm mục trong `skills/registry.json`
  còn trỏ tới bản mới, và skill còn cài được (`node scripts/install-skills.mjs --list`).
- **Ghi chú:** 2026-11-11 — còn tốt: repo hoạt động, MIT, `install-skills.mjs --list` liệt kê được. Registry trỏ theo nhánh `main` là có chủ ý — `install-skills` ghim sha vào NOTICE lúc cài (lần kiểm: `3e72962`).

---

### 16. Thẻ và phụ đề tự tránh khuôn mặt

- **Là gì:** dò khung đầu người trong mỗi đoạn, rồi đặt thẻ `pip`, tiêu đề, phụ đề ra ngoài vùng
  đó. Hiện tại người dựng tự chọn crop và kiểu thẻ để chữ không đè mặt.
- **Ý tưởng từ:** MRT Keyword (`face_boxes.py`: OpenCV Haar, lấy 12 khung/đoạn, nới hộp mặt lên
  tóc và xuống cằm). Không có giấy phép → chỉ lấy ý, tự viết.
- **Cắm vào:** `talking-head.mjs` — một bước dò mặt trước khi đặt PIP/phụ đề; `.cuts.json` ghi hộp mặt.
- **Giấy phép:** OpenCV Apache-2.0, nhưng kéo Python vào kit. Thử trước: ffmpeg không có bộ dò mặt;
  MediaPipe Face Detection (Apache-2.0) có bản WASM chạy trong Chrome mà kit đã dùng để render.
- **Bước đầu:** chụp 12 khung của demo `hoan-chinh`, chạy MediaPipe trong Chrome headless, so hộp
  với mắt thường.
- **Ghi chú:** 2026-11-11 — đã kiểm giấy phép (cả mã nguồn lẫn **trọng số model**): OpenCV **YuNet** 2026-11-11 — xong: `face-boxes.mjs` + `talking-head --faces` (YuNet, cửa sổ ~2 s — một hộp cho cả đoạn phình ra hết khung vì một đoạn có nhiều cảnh).
  (`opencv_zoo`, mã Apache-2.0, model MIT, dùng qua `cv2.FaceDetectorYN`) là lựa chọn chính; MediaPipe
  BlazeFace (Apache-2.0) dự phòng. Hướng cắm: như `transcribe.mjs` — Python tuỳ chọn (`pip install
  mediapipe`, kéo theo OpenCV), báo lỗi rõ nếu chưa cài; model tải một lần vào `assets/models/`
  (gitignore), ghim commit. Dùng hộp mặt để dời phụ đề/tiêu đề mở đầu và chọn nửa khung cho thẻ `split` (mục 5).

### 17. Tách người khỏi nền: chữ sau lưng, người bật khỏi khung

- **Là gì:** mặt nạ người theo từng khung → chữ to đặt *sau* người nói, người "bật" ra khỏi thẻ bo
  góc, nhân bản người. Đây là nhóm hiệu ứng người xem nhận ra ngay là "dựng xịn".
- **Ý tưởng từ:** MRT Keyword (`matte.py` dùng RobustVideoMatting). **RVM là GPL-3.0** → không
  đóng gói được; chỉ gọi như công cụ ngoài người dùng tự cài, giống `transcribe.mjs`.
- **Thay thế cần xem:** MediaPipe Selfie Segmentation (Apache-2.0), BiRefNet (MIT).
- **Bước đầu:** xuất WebM có alpha cho 3 giây của demo, ghép chữ sau người bằng ffmpeg `overlay`.
- **Ghi chú:** 2026-11-11 — giấy phép đã kiểm: MediaPipe selfie segmenter (Apache-2.0, cả model), 2026-11-11 — xong phần "chữ sau lưng": `person-matte.mjs` + EDL `"behind"`. Người bật khỏi khung và nhân bản người: chưa làm (mặt nạ đã có, chỉ còn phần ghép). 2026-11-11 — xong nốt "người bật khỏi khung": EDL `popout` (docs/26 §2d). Nhân bản người: chưa — chưa thấy nhu cầu.
  MODNet (Apache-2.0, README ghi rõ gồm cả model), rembg (MIT) với `u2net_human_seg` (Apache-2.0) hoặc
  `birefnet-portrait` (MIT) khi cần viền tóc nét. **Không dùng** RVM (GPL-3.0) và `bria-rmbg` trong rembg
  (phi thương mại). Cách ghép không cần kênh alpha: xuất mặt nạ xám theo timeline đã cắt, trong lượt
  cuối `split` khung đã chỉnh màu → `alphamerge` với mặt nạ → `overlay` lên trên lớp chữ (chữ đốt bằng
  một file ASS riêng) — người và nền cùng một màu grade.

### 18. Video chỉ có giọng đọc → thẻ trên nền màu

- **Là gì:** người dùng chỉ đưa file ghi âm. Mỗi câu thành một thẻ kit trên nền theo `--theme`,
  phụ đề vẫn bám từng từ. Gần với `create-video` nhưng giữ nguyên giọng thật thay vì TTS.
- **Cắm vào:** `talking-head.mjs` nhận đầu vào âm thanh (autocut đã đọc được `.wav`) + `suggest-cards`
  với `maxHidden: 1`.
- **Bước đầu:** dựng 30 giây từ `examples/talking-head-demo/transcript.json` chỉ lấy tiếng.
- **Ghi chú:** không cần thư viện ngoài — nền `color=` của ffmpeg theo `--theme`; `validateEdl` cần một 2026-11-11 — xong: đầu vào âm thanh → nền theo `--theme`; `suggest-cards --voice-only` có thẻ chữ dự phòng cho câu không khớp luật.
  chế độ bỏ luật "che người nói ≤ 55%" và cấm B-roll/`pip` khi không có hình.

### 19. Ảnh bìa + tiêu đề, caption khi dựng xong

- **Là gì:** sau render, chụp một khung có mặt rõ + chữ to làm ảnh bìa; viết tiêu đề ≤ 60 ký tự,
  caption Facebook và TikTok từ transcript. MRT Keyword giao kèm ba thứ này mỗi video.
- **Cắm vào:** `video-and-post` đã viết caption; thiếu ảnh bìa từ video người nói.
- **Bước đầu:** `ffmpeg -ss` lấy khung ở hook, đè `--hook` bằng template `frame-trend-word-pop` 1 khung.
- **Ghi chú:** 2026-11-11 — xong: `cover.mjs` + `talking-head --cover` (khung trước khi đốt phụ đề) + `<out>.post.md` (lời đã nói + giới hạn từng nền tảng; caption vẫn do agent viết).

### Đang dở (cập nhật 2026-11-11, đợt 3)

- **Mục 2, 6 — chờ quyền cài gói/model bên ngoài** (zerotts, VoxCPM). Khi được phép: cài vào
  `.venv-vision`, dựng server `/v1/audio/speech`, tạo cùng 3 câu bằng giọng cũ và mới để nghe A/B.
- **Mục 14:** cả ba model (large-v3-turbo, PhoWhisper, bản cũ) đều nghe "chuyển viện" ở giây
  66,8 — vẫn cần một người nghe lại để chốt.
- **Demo đầu cuối từ file quay điện thoại thật:** cần một clip tự quay (1–2 phút, dọc, chưa cắt).

---

## Thiếu sót nhìn từ người dùng (đánh giá 2026-11-12)

Đánh giá kit từ phía một người làm nội dung — Việt Nam trước, rồi người dùng quốc tế — sau khi
thêm các provider trả phí (Google TTS, Azure, fal.ai, Higgsfield, Ayrshare). Mỗi mục là chỗ người
dùng thật sẽ vấp, kèm bằng chứng trong code.

### 23. Video AI ra video hoàn chỉnh, không chỉ clip rời

> **2026-11-12 — xong:** `backends/finish.mjs` + nguồn media `file`. Sau khi tạo clip, backend viết
> `script.finished.json` (clip → nền `frame-broll`, outro giữ thẻ riêng) và chạy pipeline html. Thử
> với 3 clip giả: ra video 1080×1920 có giọng, phụ đề, outro. `--clips-only` để dừng ở clip.


Các backend `api`, `fal`, `higgsfield` chỉ trả về **một clip cho mỗi cảnh** trong `clips/`; lồng
giọng đọc, phụ đề, nhạc và ghép lại là việc người dùng tự làm ("Stitch and add narration … with
ffmpeg" trong `backends/api.mjs`). Người không code dừng ở đây. **Bước đầu:** cho `render.mjs` dùng
clip AI làm `media` video nền của từng cảnh rồi chạy tiếp pipeline `html` (TTS, phụ đề, nhạc, ghép)
— clip AI thành B-roll, phần còn lại không đổi.

### 24. Bản địa hoá một video sang ngôn ngữ khác

> **2026-11-12 — xong:** `scripts/video/localize.mjs` + skill `localize-video`. Giới hạn ký tự đọc từ
> `CATALOG.md`; thử trên video Marketing: 63 chuỗi, `--apply` bắt 2 câu tiếng Anh dài hơn khung, bản
> sửa qua `validate --strict`. Mẫu: `examples/niche-samples/marketing/en/script.json`.


Giờ đã có giọng 50+/140+ ngôn ngữ (`google`, `azure`, `elevenlabs`), nhưng chưa có quy trình: dịch
`voiceText` và chữ trên khung (giữ giới hạn ký tự của từng slot trong `CATALOG.md`), đổi giọng, kiểm
font có glyph (`font-check.mjs` mới kiểm tiếng Việt), chạy `validate-script --strict`, render bản
thứ hai. **Bước đầu:** skill `localize-video` + `scripts/video/localize.mjs --to en` chỉ làm phần
cơ học (tách chuỗi cần dịch, ghép lại, kiểm độ dài); việc dịch để agent làm.

### 25. Chạy thử thật các provider trả phí mới

> **2026-11-12 — đang thử:** có `scripts/providers-check.mjs --live` (một yêu cầu miễn phí mỗi
> provider: danh sách giọng, báo giá Higgsfield, thông tin tài khoản). Máy phát triển chưa có khoá
> nào — cần người dùng chạy với khoá thật và ghi kết quả vào đây.


`google`, `azure` (TTS), `fal`, `higgsfield` (video), `ayrshare` (đăng bài) đều viết theo tài liệu
chính thức, có test offline và `--dry-run`, nhưng **chưa gọi thử bằng tài khoản thật** từ repo này
(giống `api`/Veo). **Bước đầu:** mỗi provider một lệnh rẻ nhất — `tts-check.mjs` một câu;
`render.mjs --backend higgsfield --estimate` (miễn phí); một cảnh `hailuo-02` 6 giây (~$0,27); một
bài ảnh qua Ayrshare — rồi ghi kết quả vào đây.

### 26. Đăng lên nền tảng Việt

> **2026-11-12 — xong phần làm được:** `scripts/social/upload-pack.mjs` — mỗi nền tảng một thư mục:
> video kiểm/nén theo `delivery-specs.mjs`, caption, ảnh bìa, `HUONG-DAN.md`. Bước bấm đăng vẫn thủ
> công vì không có API công khai. Zalo OA API (bài viết OA) vẫn để ngỏ.


Ayrshare và Make phủ TikTok/Facebook/Instagram/YouTube, nhưng không có **Zalo OA**, **Shopee
Video**, **TikTok Shop** — nơi shop Việt bán hàng. **Bước đầu:** kiểm Zalo OA API (đăng bài viết,
gửi tin cho người quan tâm) và điều khoản; Shopee Video hiện chưa thấy API đăng công khai.

### 27. Tổng chi phí theo tháng

> **2026-11-12 — xong:** `scripts/lib/spend.mjs` (sổ `brain/spend.jsonl`), `scripts/analytics/spend.mjs`,
> `monthlyCeilingUsd` trong profile / `SPEND_MONTHLY_CEILING_USD`. Video AI ghi theo USD báo giá; giọng
> đọc đám mây và Ayrshare ghi số ký tự / số bài (giá tuỳ gói).


Mỗi lệnh trả phí báo giá riêng và dừng ở `costCeilingUsd` của **một** lần render, nhưng không có
chỗ cộng TTS (theo ký tự) + video AI + đăng bài theo tháng. **Bước đầu:** mỗi lần gọi trả phí ghi
một dòng vào `brain/spend.jsonl`; `scripts/analytics/spend.mjs` cộng theo tháng/provider và cảnh báo
khi gần trần tháng trong profile.

### 28. Avatar nói / lồng tiếng khớp môi

Kênh không lộ mặt rất phổ biến; kit có giọng đọc và khung hình nhưng không có người dẫn ảo. Cần
một provider trả phí (HeyGen, D-ID, Hedra… — kiểm điều khoản dùng thương mại, nhãn AI theo Luật
Trí tuệ nhân tạo Điều 11 mà `review-gate` đã kiểm). **Bước đầu:** so 2–3 dịch vụ về API, giá, tiếng Việt.

### 29. Video mẫu tiếng Anh

> **2026-11-12 — đang thử:** kịch bản tiếng Anh đã có (`examples/niche-samples/marketing/en/`), qua
> `--strict`. Còn render: cần `GOOGLE_TTS_API_KEY` (giọng mặc định `en-US-Neural2-F`).


README.en giờ cùng nội dung với README tiếng Việt, nhưng mọi video mẫu đều nói tiếng Việt. Khách
quốc tế không nghe được video làm ra trông thế nào bằng tiếng của họ. **Bước đầu:** làm sau mục 24
— bản tiếng Anh của 2–3 video ngành.

### 30. Tự kéo số liệu TikTok / Facebook

`performance-review` đọc CSV tải tay từ TikTok Studio / Meta Business Suite; chỉ YouTube tự lấy
được. **Bước đầu:** Graph API cho Facebook/Instagram Page Insights (token người dùng tự tạo), TikTok
Display API — kiểm quyền cần xin.

**Ghi chú khác (chưa thành mục):** cài đặt vẫn cần Node + FFmpeg + Chrome (+ Python cho phụ đề) —
chưa có bản cài một nhấp; người dùng vẫn cần trợ lý AI trả phí (Claude Code) để "nói chuyện" với
kit; hầu hết dịch vụ quốc tế cần thẻ Visa/Master — Vbee, FPT AI, Viettel AI là lựa chọn trả bằng VND.

---

## Đã xong

Chuyển mục xuống đây khi làm xong, kèm ngày và commit.

- 2026-11-11 — `openai-speech`: adapter giọng đọc cho mọi server tương thích OpenAI (`scripts/video/lib/tts.mjs`).
- 2026-11-11 — `transcribe.mjs`: tạo transcript có mốc từng từ (mới kiểm bằng test — xem mục 1).
- 2026-11-11 — `watch-video` (claude-video, MIT) trong `skills/registry.json`.
- 2026-11-11 — thẻ minh hoạ `cards` cho video người nói, demo `examples/talking-head-demo/hoan-chinh/`.
- 2026-11-11 (đợt 3) — freshness-check + licence-watch (mục 21, 12 tự động); transcribe chạy thật + transcript-diff (mục 1); `popout` (mục 17); performance-review + perf.mjs (mục 20); ai-mentions (mục 8); creator-start (mục 22); registry: agent-browser, web-video-presentation (mục 7, 10).
- 2026-11-11 — `render-batch.mjs` (mục 4); thẻ `split` + âm thanh thẻ tự động (mục 5); `face-boxes.mjs` + `--faces` (mục 16); `person-matte.mjs` + chữ `behind` (mục 17, một phần); video chỉ có giọng + `suggest-cards --voice-only` (mục 18); `cover.mjs` + `--cover` + bản nháp đăng bài (mục 19); kiểm slot của thẻ trước khi render; test `tests/talking-head-extras.test.mjs`. Mục 13, 15: đã kiểm, giữ nguyên.
- 2026-11-11 — dựng theo lời nói (ý tưởng từ MRT Keyword): `speech-cuts.mjs`, `talking-head.mjs --cut-words`, thẻ neo theo từ, `suggest-cards.mjs`, `--music` tự nhỏ dưới giọng, `"sfx"` trên thẻ; skill `talking-head-edit`.

## Đã loại

Ghi lại để lần khảo sát sau không đề xuất lại:

| Đề xuất | Lý do loại |
|---|---|
| MOSS-TTS-Nano | không có tiếng Việt, giấy phép không rõ |
| speech.cpp (làm nguồn model) | không model nào có tiếng Việt — vẫn dùng được làm server cho mục 2 |
| scenario-labs/skills, elevenlabs/skills | bắt buộc trả phí |
| Open-Generative-AI | dựa vào API model trả phí |
| edge-tts | dịch vụ không chính thức của Microsoft, rủi ro điều khoản |
| VoiceStudio | AGPL-3.0 — không đóng gói được; chỉ nên nhắc trong tài liệu như một cách cài server giọng đọc |
| Qwen3-ASR (cho phụ đề) | bộ căn mốc không hỗ trợ tiếng Việt |
| PhoWhisper-medium qua faster-whisper (mục 3) | đo 2026-11-11: WER 17,4%, 40% từ đúng mốc (< 150 ms) so với 7,4% / 96% của large-v3-turbo |
| Các mục "Vietnamese trending" khác trên TiniX | lạc chủ đề, hoặc là bản mod/auto-click không nên dùng |
| Chép nguyên MRT Keyword (Phucanh-MRT/mrtkeyword) vào kit | không có file LICENSE → mặc định giữ mọi quyền; code Remotion (giấy phép công ty), font, âm thanh và 62 hiệu ứng đều không đóng gói được. Đã lấy **ý tưởng** (mục 16–19 và docs/26 §2c), tự viết lại. Nếu tác giả thêm giấy phép mở, xem lại |
