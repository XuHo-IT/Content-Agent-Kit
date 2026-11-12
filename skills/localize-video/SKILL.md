---
name: localize-video
description: Make an English (or Japanese, Korean, Thai, Chinese, Indonesian, French, Spanish, German…) version of a video the kit already scripted — extracts every spoken and on-screen string with the character limit of its slot, translates them, refuses anything untranslated or too long for its frame, switches the voice to that language (Google Cloud TTS, Azure Speech or ElevenLabs), and renders the new version into its own folder. Use when the user says "làm bản tiếng Anh", "dịch video sang tiếng Anh", "video cho khách nước ngoài", "lồng tiếng Anh", "bản quốc tế", "translate this video", "English version", "localize".
---

# Bản ngôn ngữ khác của một video

Dịch là việc của agent. Phần dễ hỏng là mọi thứ xung quanh: tiêu đề dịch ra dài hơn khung và bị
cắt, một dòng quên dịch, giọng tiếng Việt đọc chữ tiếng Anh. `localize.mjs` lo phần đó.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng 10–15 phút (phần lớn là render), cần gì (khoá giọng đọc của ngôn ngữ đích). Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Chọn ngôn ngữ và giọng | Hỏi ngôn ngữ; kiểm khoá giọng bằng `providers-check.mjs` | Chọn ngôn ngữ; thêm `GOOGLE_TTS_API_KEY` hoặc `AZURE_SPEECH_*` nếu thiếu |
| 2. Lấy chuỗi cần dịch | `localize.mjs <script.json> --to en` | — |
| 3. Dịch | Điền mọi `translation`, giữ đúng giới hạn `max` | Đọc lại các câu quan trọng (tiêu đề, kêu gọi) nếu muốn |
| 4. Kiểm và ghi | `--apply` — báo câu quá dài, câu chưa dịch | — |
| 5. Kiểm kịch bản | `validate-script.mjs <lang>/script.json --strict` | — |
| 6. Render | `render.mjs <lang>/script.json` — vào thư mục riêng, bản gốc giữ nguyên | Xem video |

**Hay vướng:**
- Câu dịch dài hơn khung → `--apply` từ chối; viết lại ngắn hơn, đừng xoá bớt ý quan trọng.
- Tên riêng, giá, số liệu → giữ nguyên, chỉ đổi đơn vị khi người dùng yêu cầu (VND → USD là việc của họ, không tự quy đổi).
- Chưa có khoá giọng đọc của ngôn ngữ đích → OmniVoice (miễn phí) chỉ đọc tiếng Việt; nói rõ cần khoá nào.

## Quy trình chi tiết (cho agent)

```bash
node scripts/video/localize.mjs brain/video-x/script.json --to en          # → script.en.strings.json
# fill every "translation" (respect "max" = characters on screen; no emoji in voiceText)
node scripts/video/localize.mjs brain/video-x/script.json --to en --apply  # → brain/video-x/en/script.json
node scripts/video/validate-script.mjs brain/video-x/en/script.json --strict
node scripts/video/render.mjs brain/video-x/en/script.json
```

- **Translate for the screen, not word for word.** On-screen slots carry a `max`; English often
  runs longer than Vietnamese — shorten, keep the meaning. `voiceText` has no limit but should
  stay about the same length so scene timing holds.
- **Rows inside one string** (`"Lượt xem:10000|Xem hết:1200"`) keep their `label:number|…`
  shape — translate the labels only.
- **Voice.** `--provider google` (default) or `azure` picks a default voice per language
  (`lib/localize.mjs` `VOICES`); `--voice-id` picks another; `elevenlabs` keeps the script's
  multilingual voice. Check the key with `node scripts/providers-check.mjs --live` (free).
- **Re-running `--to en`** keeps translations already written, so a script edit does not wipe work.
- **Fonts:** templates load Latin + Vietnamese glyphs (`font-check.mjs` guards the Vietnamese
  subset). Japanese, Korean, Chinese or Thai text may fall back to another face or render as
  boxes — render, then LOOK at `node scripts/video/contact-sheet.mjs <lang>/video.mp4` before
  posting. Western languages are safe.
- The published post goes through `review-gate` like any other; captions for the new audience
  come from `video-and-post`.

## Output

`<video folder>/<lang>/script.json` and, after rendering, `<lang>/video.mp4` beside it. The
strings file `script.<lang>.strings.json` is kept so the next edit only needs the changed lines.
