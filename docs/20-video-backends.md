# 20 — Video backends and profiles / Backend video và profile

## English

Three renderers. `script.json` does not change shape between them — a scene is a scene; the
backend decides how the pixels get made.

```bash
node scripts/video/render.mjs --list-backends
node scripts/video/render.mjs script.json                      # html — the default
node scripts/video/render.mjs script.json --backend api --estimate
node scripts/video/render.mjs script.json --backend remotion
```

| | cost per video | needs | good for |
|---|---|---|---|
| **`html`** *(default)* | free | ffmpeg, Chrome | everything the kit already did — deterministic, offline once fonts cache |
| `api` | **$0.03–$0.60 per second** | `GEMINI_API_KEY` | photoreal footage a template cannot draw |
| `remotion` | free **for individuals and small companies** — see below | a separate npm project | motion design past what CSS keyframes reach |
| `fal` | **~$0.045–$0.14 per second** (per clip) | `FAL_KEY` | one key for Kling, MiniMax Hailuo, Seedance, Wan… — usually cheaper than Veo |
| `higgsfield` | **quoted per scene by Higgsfield before anything runs** | `HIGGSFIELD_KEY_ID` + `HIGGSFIELD_KEY_SECRET` | cinematic shots (Kling 3.0, Seedance 2.0, Hailuo 2.3) from one Higgsfield balance |

`html` stayed the default in **both** shipped profiles, including `business`. The others are
for a deliberate choice, not for a daily queue.

### `html` is unchanged

Not "should be unchanged" — verified. `render.mjs` gained a branch *above* the existing
pipeline, and the ~250 lines below it were not moved:

```bash
node scripts/video/render.mjs script.json --estimate   # byte-identical before and after
```

Extracting that pipeline into a module for symmetry would mean moving the one path that
definitely works, for no behaviour change. It stays where it is.

### `api` — read this before you use it

Veo 3.1 bills **$0.40 per second**. A 60-second video is **$24**. A daily queue of those is
**$168 a week**.

Three gates, in order, all before any money moves:

1. **The estimate always prints first** — per scene, with the model and the rate it used, so
   you can check it against Google's current pricing page rather than trusting this file.
2. **A ceiling refuses the render.** Set `costCeilingUsd` in a profile or
   `VIDEO_COST_CEILING_USD`. `0` means "refuse anything billable" and is what
   `profiles/personal.json` uses.
3. **No ceiling set and over $1 → it stops and asks.** Pass `--yes`, or better, write the
   ceiling down where the next person can see it.

```bash
node scripts/video/render.mjs script.json --backend api --estimate   # costs nothing
node scripts/video/render.mjs script.json --backend api --dry-run    # prints every request, sends none
```

Generated clips are **kept and reused** — each one was paid for. Delete
`clips/scene-<id>.mp4` to regenerate it.

Scenes need a **`videoPrompt`** (a visual description). `voiceText` is narration: a generator
handed narration produces a video *of someone talking about* the subject rather than the
subject. The backend refuses rather than guessing.

> **Not verified against a live account.** The cost arithmetic, the ceiling and the dry-run
> path are covered by tests and run without a key. The wire format — endpoints, request
> bodies, the long-running-operation shape — is written from Google's published docs and has
> not been run from this repo. `--dry-run` prints every request so you can check it first.
> Same disclosure `scripts/lib/media-hosts/r2.mjs` makes about its S3 wiring.

### `fal` and `higgsfield` — more AI video models, same safety rails

Both generate one clip per scene from its `videoPrompt` (never the narration), print the bill
first, honour `costCeilingUsd`, ask for `--yes` above $1 with no ceiling, keep and reuse every
paid clip, and print every request with `--dry-run`.

- **`fal`** (`scripts/video/lib/backends/fal.mjs`): presets `hailuo-02` (default, ~$0.045/s),
  `kling-2.5-turbo` (~$0.07/s), `kling-v3` (~$0.14/s). A scene is snapped **up** to a length the
  model makes (5/10 s, 6/10 s) and billed for it. Any other fal video model: `FAL_MODEL_ID` +
  `FAL_RATE_PER_SEC` — without a rate it refuses rather than print a made-up estimate. Rates are
  starting assumptions from fal's pages (November 2026); check before budgeting.
- **`higgsfield`** (`scripts/video/lib/backends/higgsfield.mjs`): presets `kling-3` (3–15 s),
  `seedance-2` (4–15 s, 720p), `hailuo-2.3` (6/10 s, fixed 768p, no documented aspect ratio).
  `--estimate` asks Higgsfield's `/estimate` endpoint for the **real USD price** of each scene
  for your account; the ceiling is checked against that sum before any submission. Failed and
  moderated (`nsfw`) requests are not charged. Model audio is switched off — the kit lays its
  own narration and music. Higgsfield deletes outputs after 7 days; the clips on disk are yours.

Neither wire format has been run against a live account from this repo — start with
`--dry-run`, then `--estimate`.

**The result is a finished video, not a folder of clips.** After the clips are made (Veo, fal or
Higgsfield), the backend writes `script.finished.json` — every scene with a clip becomes
`frame-broll` with that clip behind the scene's own words, the outro keeps its card — and runs the
html pipeline on it: narration, captions, music, one MP4. `--clips-only` stops at the clips.

**Spend per month.** Every paid clip is logged to `brain/spend.jsonl`; `node scripts/analytics/spend.mjs`
totals the month, and `monthlyCeilingUsd` in the profile (or `SPEND_MONTHLY_CEILING_USD`) refuses the
render that would cross it. `node scripts/providers-check.mjs --live` checks keys with free calls.

```bash
node scripts/video/render.mjs script.json --backend fal --estimate
node scripts/video/render.mjs script.json --backend higgsfield --dry-run
```

### `remotion`

Scaffolds an npm project **beside your script** and prints two commands. It does not run
`npm install` for you — installing hundreds of packages is a decision the person at the
keyboard makes, not a side effect of asking for a render.

```
brain/<slug>/remotion/
├── package.json      remotion, react — NOT added to this kit
├── src/Root.tsx      the composition, generated from your scenes
└── src/Scene*.tsx    one per scene — a starting point, not a finished design
```

Narration is not wired in. The html backend already does TTS, SFX and muxing; render visuals
here and mux the voice with ffmpeg, or use html end to end if you do not need the motion.

**Regenerating overwrites `src/`.** Move anything you want to keep out of that folder first.

#### Remotion is source-available, not open source

The table above used to say this backend was simply "free". That is true for most people
reading this and **not** true for everyone, which is the worst way for a cost line to be wrong.

Remotion ships a [two-tier licence](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md):
individuals and small companies may use it commercially for free; **for-profit organisations
above a size threshold need a paid company licence.** GitHub reports the repository as
`NOASSERTION` rather than an SPDX identifier for exactly this reason.

Nothing in this kit is affected — no Remotion code is vendored here, and `npm install` runs in
*your* project rather than this one. But if you pick this backend at a company, read the
licence before building a workflow on it. `html` carries no such condition.

#### Teaching an agent to write Remotion

The backend scaffolds a project and stops. Nothing here knows how to write *good* Remotion —
interpolation curves, audio trimming, composition structure — and that is where an agent
guesses wrong most often.

Remotion maintains **11 first-party skills** for this. Either official command installs them,
run from your Remotion project:

```bash
npx remotion skills add             # if the Remotion CLI is already there
npx skills add remotion-dev/skills  # generic; same source
```

They land in `.agents/skills/`, with `.claude/skills` symlinked to it.

**They are deliberately not in `skills/registry.json`.** The source repo
(`remotion-dev/skills`) ships no licence file — the API reports `license: null`, and its
`package.json` says `"private": true`. The rule from PR #15 is *no licence, no install*,
because a skill nobody is licensed to reuse is a skill nobody may legally reuse. The plugin
mirror's `plugin.json` does declare `"license": "MIT"`, but a string in a manifest is not a
licence grant over the files beside it.

That is a rule about **this repo's installer**, not a judgement about the skills — they are
first-party and good. Remotion's own command installs them in one line. This note exists so
the absence reads as a decision rather than an oversight.

### Profiles

A profile holds what you would otherwise retype into every script: backend, voice, palette,
brand slots, spend ceiling.

```bash
node scripts/video/render.mjs script.json --profile business
VIDEO_PROFILE=personal node scripts/video/render.mjs script.json
```

| | `personal` | `business` |
|---|---|---|
| backend | `html` | `html` |
| voice | omnivoice (local, free) | elevenlabs (paid — client work is where a synthetic read costs more than the bill) |
| theme | none — each template keeps its palette | `paper-blue` — one value repaints all of them |
| ceiling | **$0** — refuse anything billable | $25 — one hero video, not a queue |

**Precedence, narrowest wins:**

```
script.json  >  --flags  >  profile  >  .env  >  built-in default
```

A profile never overrides something the script states explicitly. The script is about one
video and knows more than a profile covering all of them — the alternative, a profile
silently repainting a video whose script asked for a specific theme, is the kind of surprise
that stops people using profiles at all.

Voice fields fall through **independently**: a script naming a `voiceId` but no provider
keeps the profile's provider rather than losing it.

Empty brand fields **drop their slot** rather than filling it with a placeholder. An empty
string beats someone else's URL — which is exactly what the vendored templates used to ship.

---

## Tiếng Việt

Ba bộ dựng. `script.json` **không đổi định dạng** giữa chúng — scene vẫn là scene; backend
chỉ quyết định pixel được tạo ra bằng cách nào.

| | chi phí mỗi video | cần gì | hợp với |
|---|---|---|---|
| **`html`** *(mặc định)* | miễn phí | ffmpeg, Chrome | mọi thứ kit vẫn làm — tất định, cache font xong là chạy offline |
| `api` | **$0,03–$0,60 mỗi giây** | `GEMINI_API_KEY` | cảnh quay như thật mà template không vẽ được |
| `remotion` | miễn phí **với cá nhân và công ty nhỏ** — xem bên dưới | một project npm riêng | chuyển động vượt ngoài tầm CSS keyframes |
| `fal` | **~$0,045–$0,14 mỗi giây** (theo clip) | `FAL_KEY` | một khoá cho Kling, MiniMax Hailuo, Seedance, Wan… — thường rẻ hơn Veo |
| `higgsfield` | **Higgsfield báo giá từng cảnh trước khi chạy** | `HIGGSFIELD_KEY_ID` + `HIGGSFIELD_KEY_SECRET` | cảnh điện ảnh (Kling 3.0, Seedance 2.0, Hailuo 2.3) từ một tài khoản Higgsfield |

`html` vẫn là mặc định ở **cả hai** profile, kể cả `business`. Hai cái kia dành cho lựa chọn
có chủ đích, không dành cho hàng đợi chạy hằng ngày.

### `html` không đổi gì

Không phải "đáng lẽ không đổi" — đã kiểm chứng. `render.mjs` thêm một nhánh **phía trên**
pipeline cũ, ~250 dòng bên dưới không bị dời đi đâu cả. Đầu ra của `--estimate` giống hệt
trước và sau khi sửa.

### `api` — đọc trước khi dùng

Veo 3.1 tính **$0,40 mỗi giây**. Video 60 giây là **$24**. Chạy hằng ngày một tuần là **$168**.

Ba cửa chặn, theo thứ tự, tất cả **trước khi tiêu đồng nào**:

1. **Luôn in ước tính trước** — từng scene, kèm model và đơn giá đã dùng, để bạn đối chiếu
   với bảng giá hiện hành của Google chứ không phải tin file này.
2. **Trần chi phí từ chối thẳng.** Đặt `costCeilingUsd` trong profile hoặc
   `VIDEO_COST_CEILING_USD`. Giá trị `0` nghĩa là "từ chối mọi thứ tốn tiền" — đúng cái
   `profiles/personal.json` đang dùng.
3. **Không đặt trần mà quá $1 → dừng lại hỏi.** Truyền `--yes`, hoặc tốt hơn là ghi hẳn trần
   vào profile cho người sau nhìn thấy.

Clip đã sinh được **giữ lại và dùng lại** — mỗi cái đã tốn tiền một lần rồi. Muốn sinh lại
thì xoá `clips/scene-<id>.mp4`.

Scene phải có **`videoPrompt`** (mô tả hình ảnh). `voiceText` là lời đọc: đưa lời đọc cho bộ
sinh video sẽ ra video *một người đang nói về* chủ đề đó, chứ không phải chính chủ đề. Backend
từ chối chứ không đoán.

> **Chưa kiểm chứng trên tài khoản thật.** Phần tính tiền, trần chi phí và đường `--dry-run`
> có test và chạy được khi không có key. Phần giao tiếp với API — endpoint, thân request,
> hình dạng long-running operation — viết theo tài liệu Google công bố, chưa chạy thật từ repo
> này. `--dry-run` in ra từng request để bạn kiểm trước. Đúng kiểu `media-hosts/r2.mjs` đã nói
> về phần nối S3 của nó.

### `fal` và `higgsfield` — thêm model video AI, cùng hàng rào an toàn

Cả hai tạo một clip cho mỗi cảnh từ `videoPrompt` (không phải lời đọc), in hoá đơn trước, tôn
trọng `costCeilingUsd`, đòi `--yes` khi trên $1 mà chưa đặt trần, giữ và dùng lại mọi clip đã trả
tiền, và in mọi request với `--dry-run`.

- **`fal`**: `hailuo-02` (mặc định, ~$0,045/giây), `kling-2.5-turbo` (~$0,07/giây), `kling-v3`
  (~$0,14/giây). Cảnh được làm tròn **lên** độ dài model tạo được (5/10 giây, 6/10 giây) và tính
  tiền theo đó. Model fal khác: `FAL_MODEL_ID` + `FAL_RATE_PER_SEC` — thiếu giá thì từ chối, không
  đoán. Giá là giả định ban đầu (11/2026); kiểm trang model trên fal.ai trước khi lập ngân sách.
- **`higgsfield`**: `kling-3` (3–15 giây), `seedance-2` (4–15 giây, 720p), `hailuo-2.3` (6/10 giây,
  768p cố định, tài liệu không có tỷ lệ khung). `--estimate` hỏi endpoint `/estimate` của
  Higgsfield **giá USD thật** cho từng cảnh với tài khoản của bạn; trần chi phí được so với tổng đó
  trước khi gửi bất kỳ yêu cầu nào. Yêu cầu lỗi hoặc bị kiểm duyệt (`nsfw`) không tính tiền. Âm
  thanh của model bị tắt — kit tự lồng giọng đọc và nhạc. Higgsfield xoá file sau 7 ngày.

Cả hai chưa chạy thử với tài khoản thật từ repo này — chạy `--dry-run` trước, rồi `--estimate`.

**Kết quả là video hoàn chỉnh, không phải thư mục clip.** Tạo clip xong (Veo, fal, Higgsfield), backend
viết `script.finished.json` — cảnh có clip thành `frame-broll` với clip làm nền dưới chữ của cảnh, outro
giữ thẻ riêng — rồi chạy pipeline html: giọng đọc, phụ đề, nhạc, một file MP4. `--clips-only` để dừng ở clip.

**Chi tiêu theo tháng.** Mọi clip trả phí được ghi vào `brain/spend.jsonl`; `node scripts/analytics/spend.mjs`
cộng theo tháng; `monthlyCeilingUsd` trong profile (hoặc `SPEND_MONTHLY_CEILING_USD`) chặn lần render vượt
trần tháng. `node scripts/providers-check.mjs --live` kiểm khoá bằng yêu cầu miễn phí.

### `remotion` — source-available, không phải open source

Bảng ở trên trước đây ghi backend này là "miễn phí", không kèm gì. Điều đó **đúng với phần lớn
người đọc** và **sai với một số người** — đó là kiểu sai tệ nhất của một dòng nói về chi phí.

Remotion dùng [giấy phép hai tầng](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md):
cá nhân và công ty nhỏ được dùng thương mại miễn phí; **tổ chức vì lợi nhuận trên một ngưỡng
quy mô phải mua company licence.** GitHub báo repo đó là `NOASSERTION` chứ không phải một mã
SPDX, chính vì lý do này.

Kit này không bị ảnh hưởng — không có dòng code Remotion nào được chép vào đây, và `npm install`
chạy trong project *của bạn* chứ không phải trong repo này. Nhưng nếu bạn chọn backend này ở
công ty, hãy đọc giấy phép trước khi dựng cả một quy trình lên nó. `html` không kèm điều kiện nào.

#### Dạy agent viết Remotion cho đúng

Backend dựng xong project rồi dừng. Trong kit không có gì biết viết Remotion cho *tốt* — đường
cong interpolate, cắt audio, cấu trúc composition — mà đó đúng là chỗ agent hay đoán sai nhất.

Remotion có **11 skill chính chủ** cho việc này. Một trong hai lệnh chính thức, chạy từ project
Remotion của bạn:

```bash
npx remotion skills add             # nếu đã có Remotion CLI
npx skills add remotion-dev/skills  # lệnh chung, cùng nguồn
```

Chúng nằm ở `.agents/skills/`, và `.claude/skills` được symlink sang đó.

**Cố ý không đưa vào `skills/registry.json`.** Repo nguồn (`remotion-dev/skills`) không có file
giấy phép — API báo `license: null`, `package.json` ghi `"private": true`. Luật từ PR #15 là
*không giấy phép thì không cài*, vì skill không ai được cấp phép là skill không ai được phép
dùng lại. Bản mirror có khai `"license": "MIT"` trong `plugin.json`, nhưng một chuỗi trong
manifest không phải là sự cấp phép cho các file nằm cạnh nó.

Đó là luật của **trình cài trong repo này**, không phải đánh giá về chất lượng skill — chúng là
đồ chính chủ và tốt. Lệnh của chính Remotion cài chúng trong một dòng. Ghi chú này có ở đây để
việc thiếu chúng đọc ra là một quyết định, chứ không phải một chỗ sót.

### Profile

| | `personal` | `business` |
|---|---|---|
| backend | `html` | `html` |
| giọng đọc | omnivoice (chạy máy, miễn phí) | elevenlabs (trả phí — làm cho khách là chỗ mà giọng máy nghe ra máy còn đắt hơn tiền API) |
| theme | không — mỗi template giữ màu riêng | `paper-blue` — một giá trị sơn lại toàn bộ |
| trần | **$0** — từ chối mọi thứ tốn tiền | $25 — một video chủ lực, không phải cả hàng đợi |

**Thứ tự ưu tiên, hẹp hơn thì thắng:**

```
script.json  >  --flags  >  profile  >  .env  >  mặc định
```

Profile **không bao giờ** đè lên thứ mà script đã nói rõ. Script nói về một video và biết
nhiều hơn một profile bao cả trăm video — nếu ngược lại, một profile âm thầm sơn lại video mà
script đã chọn theme riêng chính là loại bất ngờ khiến người ta bỏ luôn không dùng profile nữa.

Ô brand để trống thì **bỏ hẳn slot đó**, không điền placeholder. Chuỗi rỗng vẫn hơn URL của
người khác — đúng thứ mà các template vendor từng ship kèm.
