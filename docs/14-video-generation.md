# 14 — Video generation / Tạo video

## English

Turn a written item into a **9:16 1080×1920 short** (TikTok / Reels / Shorts) with Vietnamese
narration and sound effects — then post it through the same Make.com webhook the text posts use.

**The split that makes it reliable:** the AI writes *content* (`script.json` — narration + which
template each scene uses + the text slots); deterministic code renders *pixels*. The same
`script.json` always produces the same video.

```
item ──► script.json ──► validate-script.mjs ──► render.mjs ──► video.mp4 ──► make-post.mjs
         (AI writes)      (schema + craft)       (8 steps)                     (Make.com)
```

### The contract — `script.json`

```json
{
  "version": "1.0",
  "renderer": "hyperframes",
  "aspect": "9:16",
  "metadata": {
    "title": "…",
    "source": { "url": "…", "domain": "…", "image": null },
    "channel": "AI Coding"
  },
  "voice": { "provider": "omnivoice", "speed": 1.0 },
  "scenes": [
    {
      "id": "hook",
      "type": "hook",
      "voiceText": "Spoken narration — numbers spelled out, no emoji, no URLs.",
      "templateId": "frame-liquid-bg-hero",
      "inputs": { "kicker": "🔥 Tin nóng", "headline": "iPhone 17", "…": "…" },
      "sfx": { "name": "none" }
    }
  ]
}
```

Rules: **3–12 scenes** (aim 8–12) · `scenes[0].type === "hook"` · last scene `type === "outro"` ·
every `templateId` must exist under `video-templates/` · `aspect` is `9:16` or `16:9`.
`sfx` is optional — omit it to auto-pick, or `{"name":"none"}` to mute that scene.

The `voice` block picks the narrator and **overrides the env defaults**, so one `.env` can
serve many scripts and a script.json reproduces the same voice anywhere:

```json
"voice": { "provider": "elevenlabs", "voiceId": "21m00Tcm4TlvDq8ikWAM", "speed": 1.0 }
```

`speed` is 0.5–2.0 and is real: providers that accept a rate get it passed through, and the
ones that don't have it applied with ffmpeg afterwards, so it means the same thing either way.

A complete, validator-clean reference lives at `templates/VIDEO_SCRIPT.template.json`.
The authoring rules live in `templates/VIDEO_CRAFT.template.md`; per-template slots and
character limits in `video-templates/CATALOG.md`.

### One palette for the whole video — `theme`

Almost every template ships a dark canvas. An optional `theme` recolours all of them into a
**throwaway copy** at render time, so the vendored templates keep their own design:

```json
{ "aspect": "9:16", "theme": "paper-blue" }
```

`paper-blue` (white canvas, ocean-blue ink) · `paper-ink` (white, near-black) ·
`paper-forest` (off-white, green). Any field of a preset can be overridden:

```json
"theme": { "preset": "paper-blue", "ink": "#123a5f", "hue": 208, "spread": 14 }
```

Every colour is mapped into a band around `hue` **keeping its original ordering**, so two
accents that differed still differ. Accents are then darkened until they clear 3:1 against
the canvas — a mid-tone accent that read well on near-black is invisible on near-white, and
flipping lightness alone does not fix that. `validate-script.mjs` rejects a `bg`/`ink` pair
below 4.5:1 before you spend a render on it.

Which direction to flip is **measured, not guessed** — a light template must not be
inverted, and two compositions of one template can disagree:

```bash
node scripts/video/theme-probe.mjs                      # write video-templates/theme-map.json
node scripts/video/theme-probe.mjs --preview paper-blue  # before/after stills, ~40s
node scripts/video/theme-probe.mjs --selftest            # the colour rules, no Chrome needed
```

Changing `theme` invalidates the cached scene clips, so a re-render actually re-renders
instead of quietly returning the previous palette. Full details and the shipped-bug list:
`video-templates/CATALOG.md`.

### The gate — `validate-script.mjs`

```bash
node scripts/video/validate-script.mjs brain/<id>/script.json --strict
```

Runs **before** the 3–5 minutes a render costs. It checks the schema *and* the craft rules,
and quotes the offending text on every issue.

**Errors** (never renderable): a digit in `voiceText` (OmniVoice reads `GPT 5.5` as *"năm rưỡi"*)
· emoji / URL / `→ & % $ # + =` in `voiceText` · unknown `templateId` · emoji in a
character-animated field · wrong scene shape, order or count.

**Warnings** (craft — block with `--strict`): body scene outside 25–40 words · total outside
270–360 words · fewer than 8 scenes · non-standard hook/outro template · one template used
more than twice.

### The renderer — `render.mjs`

```bash
node scripts/video/render.mjs brain/<id>/script.json
```

Nine steps, all output written **next to the script**:

| # | Step | Produces |
|---|---|---|
| 1 | Validate script + host | — |
| 2 | Caption text | `script.txt` (all `voiceText`, for CapCut auto-caption) |
| 3 | TTS per scene | `voice/scene-<id>.mp3` + `.json` fingerprint *(idempotent)* |
| 4 | Concat narration | `voice-raw.mp3` + each scene's start time |
| 5 | Mix SFX | `voice.mp3` |
| 6 | **Resolve media** | `media/<id>.mp4\|png` + `media-lock.json` *(idempotent)* — only for scenes with a `media` block |
| 7 | Render + fit clips | `clips/scene-<id>-fit.mp4` *(idempotent)* |
| 8 | Concat + mux | `video-silent.mp4` → `video.mp4` |
| 9 | Report | prints paths, duration, and `VIDEO=<path>` |

Useful flags: `--estimate` (what TTS would cost, then stop) · `--refresh-media` (re-resolve
B-roll/screenshots, ignoring the lock) · `--strict` (craft warnings block the render) ·
`--skip-validate` / `--skip-preflight`.

**Then look at what came out** — the validator cannot see pictures:

```bash
node scripts/video/contact-sheet.mjs <dir>/video.mp4
```

**Idempotent, and it knows what changed.** Each `voice/scene-<id>.mp3` is written with a
sidecar `voice/scene-<id>.json` fingerprint — provider, voiceId, speed, model, and a hash of
the `voiceText`. Narration is reused **only when all of those still match**, so switching voice
or editing a line re-generates exactly the scenes affected and nothing else. Clips are reused
whenever they exist; delete `clips/scene-<id>.mp4` after editing a scene's `inputs`.

Templates are authored at a fixed 5s, so each clip is stretched to its own narration length by
freezing the last frame. The outro holds 3s past the final word.

### Voice providers

Every TTS service falls into one of two response shapes, which is why adding one is a table
entry rather than new code:

| Shape | How it answers | Providers |
|---|---|---|
| `bytes` | the response body **is** the audio | omnivoice, elevenlabs, vbee |
| `asyncUrl` | JSON holding a link you download 5s–2min later | fptai, viettel |

| Provider | Needs | Notes |
|---|---|---|
| `omnivoice` | a **local server** | Free, offline, no key. The only one needing anything installed. |
| `elevenlabs` | `ELEVENLABS_API_KEY` + voice_id | Best quality. Set `ELEVENLABS_MODEL` to a multilingual model for Vietnamese. |
| `vbee` | `VBEE_API_KEY` + voice_code | Vietnamese specialist, 200+ regional voices (North/Central/South). |
| `fptai` | `FPTAI_API_KEY` + voice | Voices: `banmai lannhi leminh myan thuminh giahuy linhsan`. Params go in headers, body is raw text. |
| `viettel` | `VIETTEL_TOKEN` + voice | **Experimental** — public docs are thin, so the field names are a best guess. Verify before relying on it. |
| `http` | whatever you configure | Generic escape hatch — describe any HTTP TTS API purely in env vars. |

```bash
node scripts/video/tts-check.mjs --providers        # the table above, no network needed
node scripts/video/tts-check.mjs                    # speak a sample with your config
node scripts/video/tts-check.mjs --list-voices      # where the provider exposes them
```

**Using a provider the kit doesn't ship** (for example a service whose API you have but that
publishes no public docs — Vivibe is one: `/api`, `/docs`, `/developer` all 404): set
`TTS_PROVIDER=http` and describe the contract in env. `${text}`, `${voiceId}`, `${speed}` and
any `${ENV_VAR}` are substituted, and `${text}` is JSON-escaped so Vietnamese diacritics survive.

```env
TTS_PROVIDER=http
TTS_HTTP_URL=https://api.example.com/tts
TTS_HTTP_HEADERS={"Authorization":"Bearer ${MY_TTS_KEY}"}
TTS_HTTP_BODY={"text":"${text}","voice":"${voiceId}","speed":${speed}}
TTS_HTTP_SHAPE=bytes            # or asyncUrl
TTS_HTTP_AUDIO_FIELD=data.url   # asyncUrl only — dotted path to the link
```

**Cloud TTS bills per character.** Check before you spend:

```bash
node scripts/video/render.mjs <script.json> --estimate
```
It lists which scenes would actually call the API (cache misses, with the reason) and the total
billable characters, then exits without rendering.

### Prerequisites

| Need | Why |
|---|---|
| **FFmpeg + ffprobe** on PATH | every audio/video operation |
| **Chrome / Chromium** | HyperFrames renders each template in it |
| **A voice** | either an API key for a cloud provider, **or** a local OmniVoice server — see above |
| Network on first render | `npx` fetches `hyperframes@0.6.94`; templates link Google Fonts |
| Node ≥ 18 | the scripts themselves (no `npm install` — the kit has no dependencies) |

Pick a cloud provider and **there is no server to run** — an API key is the whole setup.
`render.mjs` preflights everything and names exactly what is missing; it only checks the
provider you actually configured, and never calls a paid API just to preflight.
**GitHub Actions still cannot run this step** (no ffmpeg/Chromium) — see `docs/06-scheduling.md`.

### Sound effects — optional

```bash
node scripts/video/sfx-download.mjs   # raw library → assets/sfx-raw/
node scripts/video/sfx-filter.mjs     # keep only 0.1–3s stingers → assets/sfx/
```

No `assets/sfx/` → the pipeline renders silently past it. Selection per scene is: explicit
`scene.sfx` → keyword match on `voiceText` (`cảnh báo`→alert, `kỷ lục`→success, `ra mắt`→reveal)
→ scene-type default. Within a category the file is chosen by hashing the scene id, so the same
script always yields the same SFX while different scenes still differ.

### Posting it

`make-post.mjs` handles video and image through one webhook — see `docs/11-social-posting.md`.

```bash
node scripts/social/make-post.mjs --video brain/<id>/video.mp4 --post caption.txt \
  --title "…" --hashtags "#ai #coding" --platforms tiktok,youtube_shorts --dry-run
```

### Env

| Var | Default | Meaning |
|---|---|---|
| `TTS_PROVIDER` | `omnivoice` | `omnivoice` \| `elevenlabs` \| `vbee` \| `fptai` \| `viettel` \| `http` |
| `TTS_VOICE_ID` | — | required by every provider except `omnivoice` |
| `TTS_SPEED` | `1.0` | 0.5–2.0 |
| `TTS_CONCURRENCY` | `1` | parallel TTS calls |
| `OMNIVOICE_ENDPOINT` | `http://127.0.0.1:8123` | local TTS server (that provider only) |
| `VIDEO_TEMPLATES_DIR` | `<kit>/video-templates` | where templates live |
| `VIDEO_SFX_DIR` | `<kit>/assets/sfx` | SFX library (absent → no SFX) |

Per-provider keys (`ELEVENLABS_API_KEY`, `VBEE_API_KEY`, `FPTAI_API_KEY`, `VIETTEL_TOKEN`,
`TTS_HTTP_*`) are listed in `.env.example`. A script's `voice` block overrides
`TTS_PROVIDER` / `TTS_VOICE_ID` / `TTS_SPEED`.

### Adding a template

Drop `video-templates/<id>/` with `index.html` (16:9), `compositions/portrait.html` (9:16),
`hyperframes.json`, `meta.json`, then add a row to `video-templates/CATALOG.md`. Use a
Vietnamese-capable font stack. `validate-script.mjs` picks it up automatically — it reads the
folder, not a hardcoded list.

### Attribution

The pipeline and templates are derived from MIT / Apache-2.0 open source. See `NOTICE.md` at
the repo root and the per-template `NOTICE.md` files — **do not delete them.**

---

## Tiếng Việt

Biến một bài viết thành **short 9:16 1080×1920** (TikTok / Reels / Shorts) có giọng đọc tiếng
Việt và hiệu ứng âm thanh — rồi đăng qua đúng webhook Make.com mà bài chữ đang dùng.

**Điểm khiến nó đáng tin:** AI viết *nội dung* (`script.json` — lời đọc, chọn template cho từng
scene, điền chữ vào slot); code tất định lo *pixel*. Cùng một `script.json` luôn cho ra cùng một video.

### Hợp đồng `script.json`

Xem khối JSON bản EN. Luật: **3–12 scene** (nên 8–12) · `scenes[0].type = "hook"` · scene cuối
`type = "outro"` · mọi `templateId` phải có thật trong `video-templates/` · `aspect` là `9:16`
hoặc `16:9`. `sfx` tuỳ chọn — bỏ trống để tự chọn, `{"name":"none"}` để tắt tiếng scene đó.

Khối `voice` chọn người đọc và **ghi đè mặc định trong env**, nên một `.env` dùng được cho nhiều
script, và script.json tái tạo đúng giọng đó ở bất kỳ máy nào:

```json
"voice": { "provider": "elevenlabs", "voiceId": "21m00Tcm4TlvDq8ikWAM", "speed": 1.0 }
```

`speed` từ 0.5–2.0 và **có tác dụng thật**: provider nào nhận tham số tốc độ thì truyền thẳng,
provider không có thì xử lý bằng ffmpeg sau đó — kết quả như nhau.

Bản mẫu sạch (pass `--strict`): `templates/VIDEO_SCRIPT.template.json`. Luật soạn:
`templates/VIDEO_CRAFT.template.md`. Slot + giới hạn ký tự từng template: `video-templates/CATALOG.md`.

### Một bảng màu cho cả video — `theme`

Gần như mọi template đều nền tối. Khoá `theme` (tuỳ chọn) đổi màu tất cả chúng trên một **bản
sao tạm** lúc render, nên template gốc vẫn giữ nguyên thiết kế của nó:

```json
{ "aspect": "9:16", "theme": "paper-blue" }
```

`paper-blue` (nền trắng, chữ xanh biển) · `paper-ink` (trắng, chữ gần đen) · `paper-forest`
(trắng ngà, chữ xanh lá). Ghi đè được từng trường của preset:

```json
"theme": { "preset": "paper-blue", "ink": "#123a5f", "hue": 208, "spread": 14 }
```

Mọi màu bị ép vào một dải quanh `hue` nhưng **giữ nguyên thứ tự gốc**, nên hai màu nhấn vốn
khác nhau thì sau khi đổi vẫn khác nhau. Sau đó màu nhấn bị làm tối đến khi đạt tương phản
3:1 với nền — một màu tầm trung đọc tốt trên nền gần đen sẽ mất hút trên nền gần trắng, và
chỉ lật độ sáng thì không giải quyết được. `validate-script.mjs` chặn ngay cặp `bg`/`ink`
dưới 4,5:1 trước khi bạn tốn một lượt render.

Lật theo chiều nào là **đo chứ không đoán** — template vốn đã sáng thì không được lật, và hai
composition của cùng một template có thể khác nhau:

```bash
node scripts/video/theme-probe.mjs                      # ghi video-templates/theme-map.json
node scripts/video/theme-probe.mjs --preview paper-blue  # ảnh trước/sau, khoảng 40 giây
node scripts/video/theme-probe.mjs --selftest            # kiểm luật màu, không cần Chrome
```

Đổi `theme` sẽ vô hiệu hoá clip đã cache, nên render lại là render thật chứ không lặng lẽ trả
về bảng màu cũ. Chi tiết và danh sách lỗi từng gặp: `video-templates/CATALOG.md`.

### Cổng chặn `validate-script.mjs`

Chạy **trước** khi tốn 3–5 phút render. Kiểm cả schema lẫn luật craft, và **trích nguyên câu sai**.

**Lỗi** (không render được): `voiceText` có chữ số (OmniVoice đọc `GPT 5.5` thành *"năm rưỡi"*)
· `voiceText` có emoji / URL / `→ & % $ # + =` · `templateId` không tồn tại · emoji nằm trong
field animate từng ký tự · sai hình dạng / thứ tự / số lượng scene.

**Cảnh báo** (craft — chặn bằng `--strict`): scene body ngoài 25–40 từ · tổng ngoài 270–360 từ ·
dưới 8 scene · hook/outro dùng template lạ · một template lặp quá hai lần.

### Pipeline `render.mjs`

**Chín bước**, mọi output ghi **cạnh file script** — xem bảng bản EN. Bước 6 (*Resolve media*)
chỉ chạy với scene có khối `media`, và kết quả được ghim trong `media-lock.json`.

Cờ hay dùng: `--estimate` (xem TTS tốn bao nhiêu rồi dừng) · `--refresh-media` (lấy lại B-roll,
bỏ qua lock) · `--strict` · `--skip-validate` / `--skip-preflight`.

**Rồi nhìn kết quả** — validator không nhìn được hình:

```bash
node scripts/video/contact-sheet.mjs <dir>/video.mp4
```

**Idempotent, và biết cái gì đã đổi.** Mỗi `voice/scene-<id>.mp3` được ghi kèm file vân tay
`voice/scene-<id>.json` — provider, voiceId, speed, model, và hash của `voiceText`. Chỉ tái dùng
giọng khi **tất cả còn khớp**, nên đổi giọng hay sửa một câu sẽ chỉ đọc lại đúng scene bị ảnh
hưởng. Clip thì tái dùng khi còn tồn tại; sửa `inputs` của scene nào thì xoá `clips/scene-<id>.mp4`
của scene đó.

Template được thiết kế cố định 5 giây, nên mỗi clip được kéo dài đúng bằng lời đọc của nó bằng
cách đóng băng khung hình cuối. Outro giữ thêm 3 giây sau chữ cuối cùng.

### Nguồn giọng

Mọi dịch vụ TTS đều rơi vào đúng **hai khuôn phản hồi** — vì thế thêm nhà cung cấp chỉ là thêm
một dòng vào bảng, không phải viết code mới:

| Khuôn | Cách trả | Ai dùng |
|---|---|---|
| `bytes` | thân phản hồi **chính là** audio | omnivoice, elevenlabs, vbee |
| `asyncUrl` | JSON chứa link, tải lại sau 5s–2 phút | fptai, viettel |

| Provider | Cần gì | Ghi chú |
|---|---|---|
| `omnivoice` | một **server local** | Miễn phí, offline, không key. Là cái duy nhất phải cài đặt gì đó. |
| `elevenlabs` | `ELEVENLABS_API_KEY` + voice_id | Chất lượng cao nhất. Đặt `ELEVENLABS_MODEL` là model multilingual cho tiếng Việt. |
| `vbee` | `VBEE_API_KEY` + voice_code | Chuyên tiếng Việt, 200+ giọng Bắc/Trung/Nam. |
| `fptai` | `FPTAI_API_KEY` + voice | Giọng: `banmai lannhi leminh myan thuminh giahuy linhsan`. Tham số nằm ở header, body là text thô. |
| `viettel` | `VIETTEL_TOKEN` + voice | **Thử nghiệm** — tài liệu public mỏng nên tên trường là suy đoán. Kiểm trước khi tin dùng. |
| `http` | tuỳ bạn cấu hình | Cửa thoát tổng quát — mô tả bất kỳ API TTS nào hoàn toàn bằng env. |

```bash
node scripts/video/tts-check.mjs --providers        # bảng trên, không cần mạng
node scripts/video/tts-check.mjs                    # đọc thử một câu với cấu hình hiện tại
node scripts/video/tts-check.mjs --list-voices      # với provider có endpoint liệt kê giọng
```

**Dùng nhà cung cấp kit không có sẵn** — ví dụ dịch vụ bạn có API riêng nhưng họ không công bố
tài liệu (Vivibe là một trường hợp: `/api`, `/docs`, `/developer` đều 404): đặt `TTS_PROVIDER=http`
rồi mô tả hợp đồng bằng env. `${text}`, `${voiceId}`, `${speed}` và mọi `${ENV_VAR}` được thay thế;
`${text}` được JSON-escape nên dấu tiếng Việt không phá cú pháp. Xem khối env bản EN.

**TTS cloud tính tiền theo ký tự.** Xem trước khi tiêu:

```bash
node scripts/video/render.mjs <script.json> --estimate
```
In ra scene nào thật sự sẽ gọi API (kèm lý do cache trượt) và tổng số ký tự bị tính tiền, rồi
thoát mà không render.

### Yêu cầu

FFmpeg + ffprobe trên PATH · Chrome/Chromium · **một nguồn giọng** (API key của provider cloud,
*hoặc* server OmniVoice local) · có mạng lần render đầu (`npx` tải `hyperframes@0.6.94`, template
link Google Fonts) · Node ≥ 18.

Chọn provider cloud thì **không phải dựng server nào cả** — chỉ cần API key là xong.
`render.mjs` tự kiểm tra và báo rõ thiếu gì; nó chỉ kiểm **đúng provider bạn đang cấu hình**, và
không bao giờ gọi API tính tiền chỉ để preflight. **GitHub Actions vẫn không chạy được bước này**
(không có ffmpeg/Chromium) — xem `docs/06-scheduling.md`.

### Hiệu ứng âm thanh — tuỳ chọn

`sfx-download.mjs` → `sfx-filter.mjs`. Không có `assets/sfx/` thì pipeline vẫn render bình thường,
chỉ là không có SFX. Thứ tự chọn: `scene.sfx` → khớp từ khoá trong `voiceText` → mặc định theo
loại scene. Trong một nhóm, file được chọn bằng hash của scene id nên tất định.

### Biến môi trường

Xem bảng bản EN.

### Thêm template mới

Bỏ `video-templates/<id>/` gồm `index.html`, `compositions/portrait.html`, `hyperframes.json`,
`meta.json`, rồi thêm một dòng vào `video-templates/CATALOG.md`. Dùng font hỗ trợ tiếng Việt.
`validate-script.mjs` tự nhận vì nó đọc thư mục thật chứ không hardcode danh sách.

### Ghi công

Pipeline và template kế thừa từ mã nguồn mở MIT / Apache-2.0. Xem `NOTICE.md` ở gốc repo và các
`NOTICE.md` trong từng thư mục template — **đừng xoá chúng.**
