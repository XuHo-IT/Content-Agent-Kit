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
