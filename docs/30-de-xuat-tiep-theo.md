# 30 — Đề xuất làm tiếp / Backlog

Danh sách việc **chưa làm**, gom từ đợt khảo sát [repo.tinix.ai](https://repo.tinix.ai/vi) và
GitHub trending (11/2026) và từ những gì còn dở trong kit. Đây là chỗ để quyết định, không phải lời hứa:
mỗi mục ghi rõ nó là gì, cắm vào kit ở đâu, giấy phép, công sức, và **bước đầu tiên** để thử.

**Cách cập nhật:** sửa cột *Trạng thái* trong bảng tổng quan, ghi ngày và một dòng kết luận vào mục
*Ghi chú* của từng đề xuất. Làm xong thì chuyển xuống phần [Đã xong](#đã-xong); bỏ thì ghi lý do vào
phần [Đã loại](#đã-loại) — để lần khảo sát sau không đề xuất lại đúng thứ đó.

Trạng thái: `chưa làm` · `đang thử` · `xong` · `bỏ`. Công sức: **S** vài giờ · **M** 1–2 ngày · **L** nhiều ngày.

## Tổng quan

| # | Đề xuất | Nhóm | Công sức | Giá trị | Trạng thái |
|---|---|---|---|---|---|
| 1 | Chạy thử `transcribe.mjs` với faster-whisper thật | phụ đề | S | cao | chưa làm |
| 2 | Giọng đọc ZeroTTS qua `openai-speech` | giọng đọc | S–M | cao | chưa làm |
| 3 | Phụ đề tiếng Việt chính xác hơn: PhoWhisper + căn mốc từ | phụ đề | M | cao | chưa làm |
| 4 | Dựng hàng loạt từ một danh sách | video | M | trung bình | chưa làm |
| 5 | Thẻ minh hoạ: kiểu `split` và âm thanh tự động | video | S–M | trung bình | chưa làm |
| 6 | Nhân bản giọng nói với VoxCPM2 | giọng đọc | M | trung bình | chưa làm |
| 7 | agent-browser: chụp và quay cuộn trang web làm B-roll | video | S–M | trung bình | chưa làm |
| 8 | Đo "AI có nhắc tới thương hiệu không" (ý tưởng NiubiGEO) | SEO/GEO | M | trung bình | chưa làm |
| 9 | Nguồn video miễn phí Coverr | video | S | thấp–trung bình | chưa làm |
| 10 | Video thuyết trình 16:9 (garden-skills) | video | S | thấp–trung bình | chưa làm |
| 11 | Scrapling làm crawler dự phòng | thu thập | M | trung bình | chưa làm |
| 12 | Kiểm lại căn cứ pháp lý của `ads-policy-check` | quảng cáo | S | cao | định kỳ |
| 13 | Quyết định về `vibe-motion` (không có giấy phép) | dọn dẹp | S | thấp | chưa làm |
| 14 | Nghe lại chữ "chuyển về" trong transcript demo | dọn dẹp | S | thấp | chưa làm |
| 15 | Kiểm commit ghim của `marketingskills` | dọn dẹp | S | thấp | chưa làm |

---

## Phụ đề và giọng đọc

### 1. Chạy thử `transcribe.mjs` với faster-whisper thật

- **Vì sao:** script mới chỉ được kiểm bằng test đơn vị; chưa chạy với một engine nhận dạng thật.
- **Bước đầu tiên:** `pip install faster-whisper`, rồi
  `node scripts/video/transcribe.mjs <video>.mp4 --from 58 --to 134` trên phóng sự demo và so với
  `examples/talking-head-demo/transcript.json`. Lần đầu tải model khoảng 1,5 GB.
- **Kiểm gì:** số từ có mốc thời gian, độ lệch mốc so với tiếng, chữ tiếng Việt có dấu đúng.
- **Ghi chú:**

### 2. Giọng đọc ZeroTTS qua `openai-speech`

- **Là gì:** [ZeroTTS](https://github.com/zeroweight-ai/ZeroTTS) — giọng tiếng Việt chạy trên CPU,
  MIT (code và weights; codec đi kèm Apache-2.0; bộ dữ liệu benchmark CC-BY-NC — không dùng cho
  sản phẩm thương mại).
- **Vì sao:** tự báo tỉ lệ đọc sai 1,03% so với 4,13% của OmniVoice. **Đây là số của chính nhà phát
  triển, chưa ai kiểm độc lập**; OmniVoice nhỉnh hơn về độ giống giọng.
- **Cắm vào kit:** chạy sau một server có `POST /v1/audio/speech` rồi đặt
  `TTS_PROVIDER=openai-speech` — kit đã có sẵn adapter, không cần sửa code.
- **Bước đầu tiên:** đọc cùng một script bằng hai giọng, nghe A/B rồi mới quyết định đổi mặc định.
- **Ghi chú:**

### 3. Phụ đề tiếng Việt chính xác hơn: PhoWhisper + căn mốc từ

- **Là gì:** [PhoWhisper](https://github.com/VinAIResearch/PhoWhisper) (VinAI, BSD-3) — Whisper
  tinh chỉnh cho tiếng Việt, bản medium sai 4,97% trên VIVOS.
- **Vướng:** không tự cho mốc thời gian từng từ, nên cần thêm bước căn mốc (whisperX hoặc tương tự).
- **Không dùng:** Qwen3-ASR — bộ căn mốc của nó không hỗ trợ tiếng Việt, nên không làm phụ đề từng
  từ được.
- **Ghi chú:**

### 6. Nhân bản giọng nói với VoxCPM2

- **Là gì:** [VoxCPM](https://github.com/OpenBMB/VoxCPM), Apache-2.0, 30 ngôn ngữ có tiếng Việt,
  nhân bản giọng, âm thanh 48 kHz.
- **Vướng:** cần card đồ hoạ (GPU); bản chạy CPU chậm hơn thời gian thực. Hợp cho video "hero"
  theo hồ sơ `profiles/business.json`, không hợp cho hàng đợi hằng ngày.
- **Lưu ý:** nhân bản giọng của người khác cần **sự đồng ý của chính người đó**.
- **Ghi chú:**

## Video

### 4. Dựng hàng loạt từ một danh sách

- **Ý tưởng từ:** [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) (MIT) — chỉ
  mượn ý tưởng, không chép code.
- **Là gì:** một file danh sách (mỗi dòng một `script.json`); dựng lần lượt, **một video lỗi không
  làm dừng cả lô**, cuối cùng báo video nào xong, video nào lỗi. Hiện `render-all-galleries.mjs`
  chỉ làm việc này cho ảnh danh mục.
- **Ghi chú:**

### 5. Thẻ minh hoạ: kiểu `split` và âm thanh tự động

- **Đang có:** thẻ `full` và `pip` trong `talking-head.mjs` (`docs/26-auto-edit.md`).
- **Thêm:** `split` — thẻ ở nửa trên, người nói ở nửa dưới (kiểu bảng trắng của ghost-editor); và
  tự gắn một âm thanh nhẹ (`transition/cc0-paper-flip`) khi thẻ hiện, có thể tắt.
- **Ghi chú:**

### 7. agent-browser: chụp và quay cuộn trang web

- **Là gì:** [agent-browser](https://github.com/vercel-labs/agent-browser), Apache-2.0 — trình duyệt
  điều khiển bằng dòng lệnh, giữ phiên đăng nhập, có lệnh quay màn hình.
- **Cắm vào kit:** thêm vào `skills/registry.json`, hoặc làm engine phụ cho `screenshot.mjs`; quay
  cuộn một trang web thành B-roll cho `research-and-capture`.
- **Ghi chú:**

### 9. Nguồn video miễn phí Coverr

- **Cắm vào kit:** thêm một nguồn trong `scripts/media/lib/sources/`, cạnh Pexels và Pixabay.
- **Bước đầu tiên:** đọc điều khoản giấy phép của Coverr trước khi viết code.
- **Ghi chú:**

### 10. Video thuyết trình 16:9

- **Là gì:** [garden-skills](https://github.com/ConardLi/garden-skills), MIT — biến bài viết thành
  bộ slide có lời đọc dạng 16:9. Kit hiện mạnh ở video dọc, còn thiếu dạng dài này.
- **Cắm vào kit:** một mục trong `skills/registry.json`.
- **Ghi chú:**

## SEO, thu thập và quảng cáo

### 8. Đo "AI có nhắc tới thương hiệu không"

- **Ý tưởng từ:** [NiubiGEO](https://github.com/Albert-Weasker/niubigeo), Apache-2.0 — hỏi các mô
  hình AI những câu khách hay hỏi, đếm xem thương hiệu và đối thủ được nhắc bao nhiêu lần, nguồn
  nào được trích.
- **Cắm vào kit:** đặt cạnh `scripts/geo-audit.mjs` (skill `geo-optimize`).
- **Vướng:** cần OpenRouter (trả phí) hoặc Ollama chạy trên máy (miễn phí).
- **Ghi chú:**

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
- **Ghi chú:** lần kiểm gần nhất 2026-11-11.

## Dọn dẹp

### 13. Quyết định về `vibe-motion`

- `skills/registry.json` có `vibe-motion/skills` với giấy phép "NONE". Kit không đóng gói nó, chỉ
  cho tải về máy người dùng (xem `NOTICE.md` §2), nhưng nên cân nhắc **bỏ hẳn** hoặc ghi "chỉ tham khảo".
- **Ghi chú:**

### 14. Nghe lại chữ "chuyển về" trong transcript demo

- `examples/talking-head-demo/transcript.json`, giây 66,8: cả hai model đều nghe là "chuyển viện";
  đã sửa thành "chuyển về" theo ngữ cảnh nhưng **chưa nghe lại để xác nhận**.
- **Ghi chú:**

### 15. Kiểm commit ghim của `marketingskills`

- `coreyhaines31/marketingskills` (MIT) đang trending trở lại — kiểm mục trong `skills/registry.json`
  còn trỏ tới bản mới, và skill còn cài được (`node scripts/install-skills.mjs --list`).
- **Ghi chú:**

---

## Đã xong

Chuyển mục xuống đây khi làm xong, kèm ngày và commit.

- 2026-11-11 — `openai-speech`: adapter giọng đọc cho mọi server tương thích OpenAI (`scripts/video/lib/tts.mjs`).
- 2026-11-11 — `transcribe.mjs`: tạo transcript có mốc từng từ (mới kiểm bằng test — xem mục 1).
- 2026-11-11 — `watch-video` (claude-video, MIT) trong `skills/registry.json`.
- 2026-11-11 — thẻ minh hoạ `cards` cho video người nói, demo `examples/talking-head-demo/hoan-chinh/`.

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
| Các mục "Vietnamese trending" khác trên TiniX | lạc chủ đề, hoặc là bản mod/auto-click không nên dùng |
