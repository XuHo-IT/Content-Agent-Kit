---
name: talking-head-edit
description: Edit someone's own on-camera footage into a finished 9:16 short the way a human editor would — cut fillers, repeated words and retakes by what was SAID (not only the pauses), pick illustration cards from what each sentence says and land them on the spoken word, add a music bed that ducks under the voice and a sound per card, then burn word-by-word captions in one of seven styles. Use when the user says "dựng video này", "edit video tự quay", "cắt chỗ vấp", "cắt chữ ờ à", "bỏ đoạn nói lại", "chèn hiệu ứng theo lời nói", "chèn số liệu khi nói tới", "thêm nhạc nền nhỏ dưới giọng", "làm như CapCut", "talking head", "edit my recording", "cut the ums", or hands over a video of a person speaking.
---

# Talking-head edit

The editing know-how for footage of a real person speaking, in one place. `talking-head.mjs`
does the cutting, framing, cards, sound and captions in one command; this skill is the order
to work in and the rules a good editor follows, so the result looks edited, not processed.

Everything here runs on the kit's own scripts — ffmpeg plus the template renderer. Speech to
text is the one outside step (`transcribe.mjs` talks to a Whisper server or local
faster-whisper; docs/26).

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu (5–10 phút cho một video 1 phút, mỗi thẻ minh hoạ thêm ~1 phút), cần người dùng chuẩn bị gì (file video; nhạc nền nếu muốn). Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Nghe lời | `transcribe.mjs <video>` → transcript có mốc từng từ | Cho biết tên riêng, thuật ngữ hay bị nghe nhầm |
| 2. Duyệt chỗ cắt | `speech-cuts.mjs` → file review: từ đệm, chữ lặp, câu nói lại | Xem danh sách, nói chỗ nào **không** được cắt |
| 3. Chọn đoạn + khung | Viết `edl.json`: đoạn nào giữ, crop dọc tránh logo, B-roll | — |
| 4. Thẻ minh hoạ | `suggest-cards.mjs` gợi ý; điền chữ cho thẻ **chỉ từ lời đã nói** | Duyệt nội dung thẻ (số liệu, tên) |
| 5. Âm thanh | `sfx-cc0.mjs` (một lần); chọn nhạc nền có giấy phép | Đưa file nhạc, hoặc đồng ý nhạc CC0 |
| 6. Dựng | `talking-head.mjs … --cut-words --music … --style … --faces --cover` | — |
| 7. Kiểm + duyệt | Xem khung hình, ảnh bìa, độ to, rồi qua `review-gate` | Duyệt video + ảnh bìa trước khi đăng |

**Hay vướng:**
- Thẻ hiện chữ lạ ("CHỈ TRONG 24 GIỜ") → một slot bị bỏ trống, template hiện chữ mẫu. Điền **mọi** slot trong `video-templates/CATALOG.md`, hoặc chọn thẻ khác.
- `"at": "tăng" is not a word in the transcript` → dùng đúng chữ Whisper nghe được (xem transcript), hoặc thêm `"near": <giây>`.
- Cắt mất chữ cần giữ → chạy lại với `--keep-words <số thứ tự>` lấy từ file review.

## 1. Words first

```bash
node scripts/video/transcribe.mjs take.mp4                      # → take.transcript.json
```

Read it before anything else. Names and rare terms are where speech-to-text fails; fix them
for the captions with `"fix"` in the EDL (`[["^cờ-lốt$", "Claude"]]`, a regex per word) —
and match card anchors to what the transcript **says**, misspelling included.

## 2. Cut by ear, then by silence

```bash
node scripts/video/speech-cuts.mjs take.transcript.json --from 58 --to 134   # → take.transcript.cuts.txt
```

| it finds | rule | why |
| --- | --- | --- |
| filler | "ờ", "ừm", "uh" as a whole word | they are the first thing a viewer hears as "unedited" |
| repeat | the same 1–6 words twice in a row → the **first** goes | people repeat to correct themselves; the second is the one they meant |
| retake | a sentence whose start the next sentence says again → the earlier one goes | the classic "let me say that again" |
| kept on purpose | "từ từ", "rất rất", "dần dần" … unless there is a pause between | Vietnamese doubles words for meaning |

The review shows every word with its `#index`; dropped ones are `~~struck~~(index,reason)`.
Show the user the struck words, not the whole file. Then `talking-head.mjs --cut-words`
(with the same `--remove-words` / `--keep-words`) applies it **together with** the pause cut
(-35 dB, ≥ 0.28 s, 0.10 s breath kept each side, 12 ms fades).

Never cut what changes the meaning: a "không" that was a real "no", a number said twice to
stress it. When unsure, keep it — a stumble is cheaper than a lie.

## 3. Pick the takes and the frame

`edl.json` — times in source seconds (docs/26 has the full shape):

- **Segments**: the best 2–5 answers, not the whole interview. Each gets its own 9:16 `crop`
  that stays clear of burned-in TV bars, tickers and logos — check a frame, every crop.
- **B-roll** from the same licensed footage, laid over while the voice runs: ≤ 35% of the
  runtime (refused above). The face is the content.
- **Hook**: the first 3 seconds are the speaker's face and a `--hook` title (≤ 2.6 s on
  screen). No card in the hook.

## 4. Cards: earned by a sentence, landed on a word

```bash
node scripts/video/suggest-cards.mjs take.transcript.json --edl edl.json --out edl.json
```

It prints one row per sentence (the top-3 fitting templates and why a sentence got none) and
drafts `cards` with `at` set to the **spoken trigger word** — talking-head resolves it to the
moment the word is said, 0.15 s early so the card is up as the word lands. `"near": 80` picks
the right one when a word is said twice. Every draft has `_said` (the sentence) and `_fill`
(what the template wants). Fill `inputs` from `_said` only, then delete both notes.

Pacing an editor keeps (the script enforces most of it, the validator the rest):

- ≤ 6 cards a minute, ≥ 4 s apart; never the same template twice within ~12 s
- `full` (voice-over: the card replaces the picture) and `pip` (speaker kept in a corner box)
  alternate — use `pip` whenever the face matters: a person telling their own story.
  `split` (card on the top half, speaker on the bottom) is the third option: the face stays
  big and the card gets real room — good for a checklist or steps while someone explains.
  `"speakerY"` (0–960) picks the speaker's band; `--faces` picks it for you
- `inputs` are checked against the slots the template reads before anything renders — a
  wrong slot name would otherwise show the template's own sample text
- text BEHIND the speaker: `"behind": [{ "at": "gấp", "dur": 2.5, "text": "GẤP 3" }]` (≤ 24
  characters, 1–6 s, not under a `full` card, not under the `--hook`). Best on a medium shot —
  in a close-up the head hides most of it. Needs the vision setup (below)
- the speaker is hidden ≤ 55% of the runtime, B-roll + cards together (pip counts half)
- a card is ≥ 1.5 s, inside one segment, never on top of a B-roll
- **content only from the words**: no number, price, quote or name the speaker did not say.
  A quote or a chat on a card needs the person's permission.

Common effect names users bring (from CapCut tutorials or keyword lists) and the kit
template that does that job:

| they say | use |
| --- | --- |
| glass counter, số chạy, odometer | `frame-trend-stat-odometer` |
| graph, biểu đồ tăng | `frame-chart-bars` |
| compare, trước/sau, so sánh | `frame-trend-compare-wipe` |
| task list, checklist | `frame-checklist` |
| step, bước 1-2-3 | `frame-story-step-numeral` |
| messages, chat bubble | `frame-chat-bubbles` |
| bank notify, thông báo tiền về | `frame-trend-phone-notifs` |
| comment pop, trả lời bình luận | `frame-trend-comment-reply` |
| poll, bình chọn | `frame-trend-live-poll` |
| price tag, giá sale | `frame-trend-price-drop` |
| search bar | `frame-trend-search-morph` |
| timeline, mốc thời gian | `frame-timeline` |
| terminal, câu lệnh | `frame-terminal` |
| glass quote, trích dẫn | `frame-quote-testimonial` |
| kinetic pop, word slam | `frame-trend-word-pop` (as a card or the hook) |

Not in the kit yet — they need the speaker cut out of the frame or a face tracker: text
behind the person, face scan / locked-on frames, clone crowds, thumbnails orbiting the head.
Say so and offer the nearest card; they are on the backlog (docs/30).

## 5. Sound

```bash
node scripts/video/sfx-cc0.mjs                                   # once: 27 CC0 sounds → assets/sfx/
node scripts/video/music-search.mjs --query "lofi calm" --get 1 --out bed.mp3   # CC0 unless --license by
```

- Voice is normalised to -16 LUFS. `--music` lays a bed at -26 LUFS that a sidechain
  compressor pushes down further whenever the voice speaks (ratio 6, 30 ms attack, 450 ms
  release — slow enough not to pump), 1 s fade in, 2.5 s fade out.
- A card may carry `"sfx": "transition/cc0-paper-flip"`; a whoosh starts 80 ms **before** the
  card (it leads into the cut), anything else lands with it. Level `--sfx-volume` (0.5).
- ≤ 2 sounds in any 3 s, ≤ 0.7 a second over the video — talking-head warns past that. One
  sound per card at most; not every card needs one.
- A card that names no sound gets a soft automatic one (a paper flip; `error-beep` for a
  myth/error template, `tada` for a verdict/result) when the previous sound is ≥ 3 s back.
  `"sfx": false` on a card, or `--no-card-sfx`, turns it off.
- `meme/` sounds are never automatic — only when the user asks for that tone.
- Music licence: CC0, public domain or CC BY. A BY track goes in `--credit`. Never a
  commercial song "because it is short".

## 6. Render

```bash
node scripts/video/talking-head.mjs take.mp4 --transcript take.transcript.json --edl edl.json \
     --cut-words --music bed.mp3 --style pop --theme <preset> --hook "<câu mở 2 giây>" --credit "<nguồn · giấy phép>"
```

Style by what the video is: `clean` (anything), `pop` (tips, shop, energetic), `editorial`
(calm explainer, beauty, lifestyle), `cinematic` (story, brand), `kinetic-doc` (news,
documentary), `launch` (tech, product), `meme` (only when the user asks). Two styles side by
side and letting the user pick is often faster than arguing about one.

Captions: 2–3 words at a time in the lower third, the spoken word lit in the theme colour;
they step aside on `full` cards (the card already says it in big type).

- `--faces` — finds the head every ~2 s and moves captions and the hook off it when there is
  room (below the chin, else above the head); in a close-up that fills the frame they stay put.
- `--cover` — `<out>.cover.jpg`: the clearest early face, taken BEFORE captions were burned,
  with the `--hook` (or `--cover-title`, ≤ 60 characters) on it. Hand it to
  `make-post.mjs --thumbnail`. With `--transcript` it also writes `<out>.post.md` — what was
  said after the cut plus each platform's limit. Write the captions from it; do not paste it.
- **Voice only** — the user sends just a recording: pass the `.wav`/`.mp3` as the input. Every
  segment becomes a flat `--theme` background and the cards are the picture (all `full`; no
  B-roll, `pip`, `split` or `behind`). Draft with `suggest-cards.mjs t.json --voice-only`.

Vision setup for `--faces`, `behind` and `cover.mjs --faces` (once, ≈ 300 MB; tested on Python 3.12 with mediapipe 1.2):
`python -m venv .venv-vision && .venv-vision\Scripts\pip install mediapipe`. Models (YuNet,
selfie segmenter) download on first use into `assets/models/`, pinned by sha256.

## 7. Check before anyone else sees it

- Frames: one still per card at its fullest moment and one in each segment —
  `ffmpeg -ss <t> -i out.mp4 -frames:v 1 f.jpg`, or `node scripts/video/contact-sheet.mjs out.mp4`. Look
  for text off the edge, text on the face, a card covering the captions, a TV logo in the crop.
- Sound: listen to the first 10 s and every card entrance. Loudness:
  `ffmpeg -i out.mp4 -af ebur128 -f null -` → around -16 LUFS, no clipping.
- `<out>.cuts.json` records what was kept, the word cuts, music and sounds — attach it to the
  review so the reviewer can see what was removed.
- Then `review-gate`. Nothing publishes without it. To post: `video-and-post`.

- Cover: open `<out>.cover.jpg` — a face, not mid-blink; the title whole and off the face.

Method and numbers: `docs/26-auto-edit.md` §2c–2d. Code: `scripts/video/lib/speech-edit.mjs`,
`lib/card-suggest.mjs`, `lib/edl.mjs`, `lib/faces.mjs`, `lib/vision.mjs`, `cover.mjs`.
Tests: `tests/speech-edit.test.mjs`, `tests/talking-head-extras.test.mjs`.
