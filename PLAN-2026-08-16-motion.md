# Kế hoạch — autopilot hằng ngày, và đưa chuyển động lên mức CapCut / After Effects

**Lập ngày:** 2026-08-16 · **rà lại và viết lại:** 2026-08-17
**Phạm vi:** Content-Agent-Kit (động cơ + template) **và** vòng xuất bản hằng ngày.
Phần nội dung/series nằm ở `Horror-Agent/PLAN-2026-08-16-series.md`.

---

## Bản rà 2026-08-17 — cái gì đã làm, cái gì chưa

Bản kế hoạch gốc được commit **cùng ngày viết** (`eb94289`), nên khi rà lại thì chưa hạng mục
nào kịp triển khai. Đã đo lại toàn bộ chứ không đọc lại: **mọi con số trong bảng gốc tái lập
chính xác** — kế hoạch được đo thật, không đoán.

Ba việc đã làm trong lượt rà này, đều thuộc P1:

| ✅ | việc | ở đâu |
|---|---|---|
| P1.2 | `motion-index.mjs` — quét template, in kỹ thuật nào ở đâu | `scripts/video/motion-index.mjs` |
| P1.1 | Trường `**Motion:**` trong CATALOG, **tự sinh** | `video-templates/CATALOG.md` (29 template) |
| P1.3 | Bảng "copy from" trong `motion-craft`, mỗi kỹ thuật kèm mẫu | `skills/motion-craft/SKILL.md` |

Và một việc thuộc P0 mới: blueprint Make đăng Facebook đã có bản import được —
`templates/make/facebook-video-url.blueprint.json` + `README.md`.

Còn lại **P1.4, P2–P7 chưa động**, cộng phần vận hành autopilot ở Phần B.

### Hai chỗ bản gốc nói sai — đã sửa trong bản này

**① P2 nhắm sai script.** Bản gốc viết *"`add-template.mjs --motion <kind>` chèn khối CSS vào
template mới"*. Nhưng `scripts/video/add-template.mjs` **không tạo template** — nó tải item có
sẵn từ registry HyperFrames trên GitHub rồi copy vào `video-templates/`. Công cụ *vendor*, không
phải *scaffold*. Gắn `--motion` vào đó là gắn chức năng sinh mã vào một script tải file.
→ P2 dưới đây đổi sang script riêng. `skills/new-template/SKILL.md` §0 vốn đã phân đôi sẵn hai
việc này ("pull it" vs "build it"); bản gốc gộp nhầm chúng lại.

**② "39 có hoạt ảnh nền" dễ đọc thành "chỉ 39 template có animation".** Thực tế **82/106 có
`@keyframes`**. Con số 39 là số có **loop liên tục** (`infinite`); 43 cái còn lại có animation
*vào màn* rồi đứng yên vĩnh viễn. Nhầm chỗ này dẫn tới đi sửa 43 template vốn đã có entrance tử
tế, trong khi chỗ cần sửa là 67 cái không có lớp nào chạy tiếp.

---

## Đang đứng ở đâu (đo lại 2026-08-17, `node scripts/video/motion-index.mjs`)

| thứ | hiện trạng |
|---|---|
| Template | 106 · **39** có lớp chuyển động **liên tục** · **67** đứng im sau khi vào màn |
| (trong đó 82 có `@keyframes` — 43 cái chỉ có entrance) | |
| `draw-on` — `stroke-dashoffset` chạy trong `@keyframes` | **13** — đã đủ dùng |
| `gradient-text` — `background-clip: text` | **8** — đủ |
| `dimensional` · `conic` · `mechanical` | **3** mỗi loại |
| `clip-reveal` — `clip-path` mở ra thật | **2** (`frame-split-compare`, `frame-terminal`) |
| `mask-sweep` — `mask-image` | **2**, cả hai đều là template aicoding |
| Transition | kit phơi ra **7** · ffmpeg trên máy có **34** |
| Caption | `.ass` tĩnh — không `\t`, `\move`, `\fad`, `\k` |
| Adapter hyperframes đang dùng | **1/7** (`css`) |

> **Một giả định sai đã bị bác bỏ khi lập kế hoạch này.** Bản nháp đầu ghi *"0 template dùng
> kỹ thuật ngoài opacity/translate"* và đặt toàn bộ ưu tiên lên việc dựng một template tham
> chiếu. Đếm lại thì con số là **20+**, trong đó có `frame-draw-on`, `frame-geo-route` (draw-on
> ngay trên bản đồ — đúng thể loại), `frame-math-manim`, và cả `frame-vox-investigation-board`
> mà tập 01 đã dùng. Vấn đề không phải là *thiếu ví dụ*, mà là **không có gì trỏ agent tới
> chúng**. P1 đã viết lại theo đúng phát hiện đó, và nó rẻ hơn hẳn phương án cũ.

> **Một con số bản gốc ghi hơi rộng.** `clip-path: polygon` được ghi là 1 (`frame-3d-spotlight`).
> Đúng là có, nhưng đó là **hình nón sáng tĩnh**, không phải một cú mở — chép nó để làm reveal
> thì ra một khối đứng yên. Tính theo "mở ra thật" thì `clip-reveal` có **2**, và `polygon` mở
> ra thì **chưa có cái nào**. `motion-index.mjs` đếm theo nghĩa sau, nên nó mới là con số dùng
> được.

---

## Một ràng buộc phải nói trước, vì nó định hình mọi thứ dưới đây

**Template là file HTML đơn, tự chứa, render được offline.** Không có file CSS/JS dùng chung
để import. Nên "thư viện chuyển động" ở đây **không thể** là một runtime include — nó phải là
bộ đoạn mã được *chèn vào lúc tạo template*. Kế hoạch bên dưới đi theo đúng ràng buộc đó thay
vì phá nó; phá nó là đánh đổi lấy việc mất khả năng render offline, và đó là thứ cả kit dựa vào.

---

# Phần A · P0 — Autopilot hằng ngày qua Make.com  ★ ưu tiên cao nhất

Đứng trước toàn bộ phần motion, vì motion là *chất lượng* còn autopilot là *có xuất bản được
hay không*. Một thư viện template đẹp mà mỗi lần đăng vẫn phải thao tác tay thì cái nghẽn không
nằm ở template.

**Đích:** mỗi sáng máy tự dựng một video 9:16, qua review gate, rồi đăng lên Page kèm comment
nguồn — không cần ai gõ lệnh.

## A1. Dây chuyền — dùng lại nguyên si thứ kit đã có

Không viết mới gì. Chuỗi đã tồn tại đầy đủ:

```
schtasks 07:00
  └─ schedule-prompt  →  skills/daily-run
        ├─ chọn đề tài            scripts/queue-client.mjs pull
        ├─ dựng script.json       skills/create-video + video-templates/CATALOG.md
        ├─ validate --strict      scripts/video/validate-script.mjs      ← vài giây
        ├─ render                 scripts/video/render.mjs               ← 3–5 phút
        ├─ contact-sheet + NHÌN   scripts/video/contact-sheet.mjs
        ├─ review gate (bắt buộc) skills/review-gate — subagent độc lập
        └─ xếp lịch đăng          scripts/scheduler/build-queue.mjs → register-tasks.mjs

schtasks <giờ slot>
  └─ scripts/scheduler/run-item.mjs <id>
        └─ scripts/social/make-post.mjs --queue queue.json --id <id>
              └─ uploadMedia() → URL công khai → POST {mediaUrl, post, comment} → webhook
```

**Vì sao tách hai task:** render tốn 3–5 phút. Render đúng lúc đến giờ đăng thì bài lên trễ 5
phút. Render buổi sáng, ghi `videoPath` vào queue, slot chỉ upload + gọi webhook (vài giây).
`run-item.mjs` đã có đường lùi: item `type:"video"` thiếu `videoPath` nhưng có `scriptPath` thì
render tại chỗ rồi ghi ngược vào queue, nên retry không render lại từ đầu.

**GitHub Actions không render được** — không có FFmpeg/Chrome/TTS (`docs/06-scheduling.md`).
Actions chỉ để crawl. Render + đăng chạy `schtasks` trên máy luôn bật.

## A2. Scenario Make — đã có blueprint import được

`templates/make/facebook-video-url.blueprint.json`, ba module:

```
Webhook  →  Facebook Pages: Upload a Video  →  Facebook Pages: Create a Comment
   1                    2                                    3
```

| webhook nhận | đi đâu |
|---|---|
| `mediaUrl` | module 2 → `url`, Type = **download a video from URL** |
| `post` | module 2 → `description` |
| `comment` | module 3 → `message` |

**Hợp đồng này khớp sẵn `scripts/social/make-post.mjs` — không phải sửa một dòng code nào.**
`docs/11-social-posting.md` giữ `{mediaUrl, image_url, post, comment}` tương thích ngược có chủ
ý, và đây chính là chỗ nó trả công.

`Type: url` để **Facebook tự tải file**, nên bỏ được bước kéo file nhị phân qua Make
(*HTTP → Get a file*). Đẩy 20 MB+ qua một operation Make là mắt xích mong manh nhất của cả
chuỗi; tránh được thì tránh.

### Ba chỗ phải xử lý TRƯỚC khi bật, không phải sau

**⚠️ 1 — Kiểm tra webhook có thật sự nối vào flow.** Sau khi import, trigger có thể nằm rời.
Make báo *"This module is not connected to the flow. This module and everything after it will
be skipped during execution."* Scenario rời **nhận POST rồi không làm gì**, và từ phía kit nó
trông y hệt thành công. Nối lại 1 → 2 → 3, chạy "Run once", xác nhận có request tới.
**Đừng viết code trước bước này.**

**⚠️ 2 — `Create a Comment` cần loại id khác.** Module 2 trả về **video id**; module 3 cần
**post id** (`<page>_<post>`). Blueprint map thẳng `{{2.id}}` vì đó là trường hợp thường gặp,
nhưng nếu video lên bình thường mà **comment không xuất hiện** thì đây là lý do. Hỏng im lặng,
triệu chứng là bài đăng mất link nguồn. Test bằng một video **private** trước.

**⚠️ 3 — Webhook không có shared secret.** Ai có URL đều đăng được lên Page. Muốn chặn thì thêm
trường `key` vào payload, một **Filter** giữa module 1 và 2, và gửi từ wrapper của bạn. Không
wire sẵn vì payload của kit không có `key` — nhưng phải là quyết định có ý thức, không phải phát
hiện muộn.

> **Chặn cứng.** `PLAN-2026-08-16-series.md` §P0: `MAKE_WEBHOOK_URL` cũ **đã bị commit lên git
> trong 5 commit đầu và chưa từng xoay khoá**, cùng `INGEST_API_TOKEN`, `CLOUDINARY_API_SECRET`,
> `WAVESPEED_API_KEY`. Autopilot **không được bật** trước khi xoay xong. Hook mới thì giữ **chỉ
> trong `.env`**, không bao giờ vào git.

## A3. Nơi lưu media — việc bắt buộc, không phải tuỳ chọn

`Type: url` đòi một URL **công khai, Facebook tải được**. `make-post.mjs` lo phần này: truyền
đường dẫn local, nó upload lên `MEDIA_HOST` rồi gắn URL kết quả vào payload.

- `scripts/lib/media-hosts/cloudinary.mjs` của kit **chỉ làm unsigned upload**, cần
  `CLOUDINARY_UNSIGNED_PRESET`. Tài khoản đang dùng **không có** preset đó.
- **Chạy được hôm nay:** `MEDIA_HOST=catbox` — không cần khoá, trần 200 MB, dư cho video 2–3 phút.
- **Đúng về lâu dài:** thêm code path `signed` (ký SHA1 bằng `CLOUDINARY_API_SECRET`) vào
  `cloudinary.mjs`, tự chọn khi có secret mà không có preset.

Làm catbox trước để thông đường. Đừng chặn autopilot vì việc này.

## A4. Dọn code trùng — 7 script đã có bản tốt hơn trong kit

Repo vận hành (`Horror-Agent`) có 8 script publishing. Kit đã có bản khái quát hoá, tốt hơn,
của **7 cái**:

> **Đã thử ở lượt 2026-08-17 và phải lùi lại.** Merge của Horror-Agent đã hoàn tất, nhưng phần
> "bỏ 7 script" thì **không**: `HORROR_PLAYBOOK.md` gọi chúng đích danh ở ~20 chỗ, cộng
> `HORROR_AUDIT_PLAYBOOK.md`, `HANDOVER.md` và `skills/horror-daily-video/SKILL.md`. Xoá script
> mà không viết lại playbook 62KB đi kèm là làm hỏng repo. Đây là **một việc riêng**, không phải
> một bước dọn dẹp — làm thì phải làm cả hai vế cùng lúc.

| bỏ | thay bằng | vì sao bản kit tốt hơn |
|---|---|---|
| `post_to_make.js` | `scripts/social/make-post.mjs` | siêu tập: `--dry-run`, `--json`, `--queue`, video, `--platforms`, và validator chặn Markdown / `oaicite` / `[Your Name]` lọt vào caption |
| `horror_scheduler.js` | `scripts/scheduler/{build-queue,register-tasks,run-item}.mjs` | **trùng thẳng với `post_to_make.js`** — cùng webhook, cùng payload, mỗi file một bản copy `uploadToCatbox()`/`sendToMake()` riêng. Queue file của nó lại **sai schema với chính reader của nó** |
| `post_to_chuyenchuake.js` | `scripts/publish.mjs` | `requireEnv`, `postJson`/`uploadImage` dùng chung, 409 → exit 0 |
| `post_long_chapters.js` | `scripts/append.mjs` | cùng `{id, parts, targetParts}`, thêm ledger |
| `update_story.js` | `scripts/update.mjs` | ⚠️ bản cũ có nhánh PATCH thẳng Supabase **làm rơi cipher và không tính lại `content_hash`** — sự cố đã ghi trong tài liệu của repo đó. Bản kit không có nhánh này |
| `list_published.js` | `scripts/list-published.mjs` | hỗ trợ cả endpoint site lẫn Supabase trực tiếp |
| `suutam_queue.js` | `scripts/queue-client.mjs` | thêm lệnh `known` cho danh sách dedup đầy đủ |

Phụ phẩm đáng kể: 8 file đó đang có **5 bản `loadEnv()` khác nhau về hành vi** (ghi đè vs không
ghi đè vs chỉ đọc `.env` cục bộ). Chuyển sang `scripts/lib/env.mjs` là hết cả lớp lỗi này.

**Ngược lại, bốn thứ kit CHƯA có — port sang, đừng bỏ:**

| port | sang |
|---|---|
| `episode-brief.mjs` + `episodes.json` — sổ chống lặp *hình thức* giữa các tập | `scripts/series/` |
| Nhánh ký Cloudinary (SHA1) | `scripts/lib/media-hosts/cloudinary.mjs` |
| Validator manifest + mặc-định-dry-run (title ≤100, description ≤5000, chặn `<`/`>`) | `scripts/social/make-post.mjs` |
| `skills/horror-daily-video/`, `skills/horror-geo-video/` | `skills/` |

**Không cắt nhầm:** `publish` / `append` / `update` đánh **ba endpoint khác nhau** — cả ba đều
cần, chỉ là thay bằng bản kit.

> ~~**Chặn cứng thứ hai.** Repo vận hành đang dở một merge chưa giải quyết.~~
> ✅ **Đã giải quyết 2026-08-17** (`117f861`). Bốn xung đột lấy theo origin/main; `.gitignore`
> lấy theo origin cộng `_archive/` + `.claude/`. Chi tiết trong commit message.

### Hai điều lượt 2026-08-17 chứng minh là SAI trong chính bảng trên

**① Không bỏ được 7 script chỉ bằng một bước dọn.** `HORROR_PLAYBOOK.md` gọi chúng đích danh ở
**~20 chỗ**, cộng `HORROR_AUDIT_PLAYBOOK.md`, `HANDOVER.md`, và `skills/horror-daily-video/SKILL.md`
(*"node post_to_make.js brain/&lt;slug&gt;/social.json"*). Xoá script mà không viết lại playbook 62 KB
đi kèm là làm hỏng repo. Bảng trên **vẫn đúng về đích**, nhưng nó là **một việc riêng** phải làm
cả hai vế cùng lúc, không phải một bước dọn dẹp. Merge vì thế lấy theo origin — giữ cả 7.

**② "Xoá `scratch/`" suýt phá mất nội dung chưa đăng.** Bản kế hoạch ghi `scratch/` là "5 script
Python sinh văn xuôi, đúng thứ Rule Zero cấm". Kiểm thật thì:

- Mấy file `.py` đó là **stub rỗng 39–920 byte** — `print('Generator script created')`. Không
  sinh văn xuôi gì cả.
- `scratch/` thật ra chứa **một truyện 10 chương ~16.600 chữ** và **một vụ án kèm 10 ảnh**.

Cả hai **không có** trong `posted_history.json` / `published_history.json`, nên nhìn qua là
"chưa đăng". Truy vấn thẳng Supabase mới ra sự thật: **cả hai đã publish** — vụ án là
`db-c68c2c86…`, còn truyện nằm dưới **tên khác**, "Trạm Gác Đèn Sông Cấm" (`db-fa5e1b5f…`,
`parts` = 10, `target_parts` = 10), trong khi bản nháp mang tên chương *"Chuyến đò ra cồn Độc
Dập"*. Đối chiếu từng chương: 10/10 khớp tiêu đề, và **2 chương trên site còn mới hơn** bản nháp.

> **Bài học, và nó áp cho mọi lần dọn file sau:** `posted_history.json` dedup **theo tiêu đề**,
> nên một tác phẩm đăng dưới tên khác sẽ không khớp — file lịch sử im lặng **không** có nghĩa là
> chưa đăng. Trước khi xoá bất cứ thứ gì trông giống nội dung, hỏi DB:
> ```bash
> node list_published.js --limit 200 --out /tmp/all.json
> ```
> `scratch/` đã xoá (11 MB) **sau** khi xác minh. `_archive/` (3 MB) giữ lại, nay đã gitignore.

---

# Phần B · Chuyển động

## P1 · Làm cho các ví dụ sẵn có TÌM ĐƯỢC — ✅ phần lớn đã xong

**Vì sao đứng đầu:** agent bắt chước thứ đang tồn tại mạnh hơn nhiều so với đọc tài liệu. Ví dụ
thì đã có hơn 20 cái, nhưng **không có đường nào dẫn tới chúng** — `CATALOG.md` mô tả template
làm *gì*, không mô tả nó *chuyển động bằng cách nào*. Agent mở `frame-vox-collage`, thấy
`translateY`, rồi làm lại `translateY`, trong khi `frame-geo-route` ngay bên cạnh đang vẽ một
tuyến đường bằng `stroke-dashoffset`.

- ✅ **`scripts/video/motion-index.mjs`** — quét template, in kỹ thuật nào ở đâu. Tự sinh nên
  không bao giờ lệch với thực tế.
  ```bash
  node scripts/video/motion-index.mjs                      # bảng + mẫu để chép
  node scripts/video/motion-index.mjs --technique draw-on   # chỉ danh sách id
  node scripts/video/motion-index.mjs --debt                # 67 cái còn đứng im
  ```
  **Một định nghĩa đếm duy nhất**, vì trước đó có hai: `draw-on` chỉ tính khi
  `stroke-dashoffset` nằm trong `@keyframes`. `frame-portfolio-donut` set dash offset để cắt
  vành donut rồi không animate — đó là hình học, không phải chuyển động, và chép nó để làm
  draw-on thì ra một vành tĩnh. Vì thế 13, không phải 14.
- ✅ **Trường `**Motion:**` trong `CATALOG.md`** — 29 template, chèn bằng
  `--write-catalog`, idempotent. Chỉ gắn cho template dùng kỹ thuật **ngoài** opacity/translate;
  gắn cả 106 thì chôn mất đúng nhóm đáng chép.
- ✅ **Bảng "copy from" trong `skills/motion-craft/SKILL.md`** — mỗi kỹ thuật kèm mẫu cụ thể,
  thay cho danh sách gạch đầu dòng không con trỏ nào.

**Còn lại — P1.4:** dựng **một** template mới cho hai kỹ thuật đang mỏng: `clip-path` mở khung
như cú lia máy, cộng `mask-image` quét sáng qua chữ. Sau khi có `motion-index`, chỗ thiếu lộ ra
rõ hơn bản gốc tưởng: `clip-reveal` **2** (và `polygon` mở ra thì **0**), `mask-sweep` **2** và
cả hai đều là template aicoding — không hợp thể loại tư liệu.

**Nghiệm thu:** render ở `--at 0`, `2`, `4.5`; ba khung khác nhau rõ, và khung `0` không được
lộ trạng thái kết thúc (bẫy số 1 trong `motion-craft`).

**Rủi ro thật:** `mask-image` chồng `background-clip: text` có thể vỡ trong Chrome headless.
Vỡ thì bỏ `mask-sweep` khỏi template mẫu và ghi lại là *không dùng được* — thà mất một kỹ thuật
còn hơn để lại một mẫu mà chép theo là hỏng.

## P2 · Bộ mồi chuyển động — **đã đổi script đích**

Biến P1 thành thứ tái sử dụng được. **Script mới**, không phải cờ thêm vào `add-template.mjs`
(xem "hai chỗ nói sai" ở đầu file):

```
node scripts/video/new-template.mjs --id frame-<x> --motion <kind>
```
```
--motion draw-on      stroke-dasharray/offset + biến thời lượng
--motion clip-reveal  clip-path polygon, bốn hướng
--motion mask-sweep   mask-image gradient chạy ngang
--motion dimensional  perspective + rotateY, có backface
--motion mechanical   steps() cho đếm số và hạt phim
```

Đoạn CSS nằm ở `templates/motion/<kind>.css`, **chèn lúc tạo** — đúng ràng buộc file đơn, tự
chứa, render offline được.

Kèm lớp nền ambient đúng chuẩn hai tầng, để template mới **không bao giờ** ra đời trong tình
trạng đứng im. Đây là chỗ sửa gốc cho 67 template chết: cái mới sinh ra đã sống.

`add-template.mjs` **giữ nguyên** nghĩa "kéo item từ registry HyperFrames".

## P3 · Đường cong easing tuỳ ý

AE mạnh ở **graph editor**: mỗi keyframe một đường cong riêng. CSS nay có `linear()` — xấp xỉ
được đường cong bất kỳ bằng danh sách điểm, và `waapi` của hyperframes seek nó bình thường.

Việc: thêm vào `motion-craft` một bảng nhỏ các đường cong đã dựng sẵn — *overshoot*,
*anticipate* (lùi rồi mới bật), *settle* — dạng `linear(...)` copy dán được. Ba đường cong này
là thứ làm chuyển động "có trọng lượng"; thiếu chúng thì mọi thứ trôi đều như PowerPoint.

**Kiểm trước khi hứa:** xác nhận Chrome trong bản hyperframes đang dùng (`0.6.94`, ghim ở
`scripts/video/lib/compose.mjs:14`) có hỗ trợ `linear()`. Nếu không, lùi về `cubic-bezier`
nhiều chặng và nói rõ là xấp xỉ thô hơn. Hiện `linear(` **chưa xuất hiện ở bất kỳ template nào**.

## P4 · Caption động kiểu CapCut

Caption hiện là `.ass` tĩnh (`scripts/video/lib/captions.mjs`). Thứ làm nên caption CapCut là
**chữ hiện theo từng từ, lệch pha nhau, có nảy**.

Hai đường, chọn sau khi thử:

1. **`.ass` với thẻ `\t`** — libass làm được chuyển tiếp theo thời gian. Rẻ, giữ nguyên đường
   ống hiện tại, nhưng cú pháp khó chịu và giới hạn.
2. **Caption thành một lớp template** — render chữ bằng HTML rồi chồng lên. Mạnh hơn hẳn,
   nhưng phải chèn vào giai đoạn ghép và **sẽ đụng đúng vấn đề che nội dung** đã gặp:
   `MarginV = height * 0.12` ⇒ dải caption nằm ở ~88% chiều cao, đúng vùng template Vox đổ chữ.

> Nếu đi đường 2, phải giải quyết chỗ đặt **trước**, không phải sau. Bài học từ lần nướng
> caption vào hình: kỹ thuật chạy được không có nghĩa là kết quả nhìn được.

## P5 · Mở rộng transition

Kit phơi ra 7, ffmpeg có 34. Những cái đọc ra "chất CapCut": `hblur` (gần với whip pan),
`radial`, `distance`, `squeezev`, `pixelize` (đã có), `hlslice`, `coverleft`, `revealup`.

Việc: thêm vào `TRANSITIONS` kèm **mô tả dùng khi nào**, không phải đổ cả 34 cái vào. Một danh
sách 34 dòng không tên gọi ý nghĩa thì agent chọn bừa, và bừa thì tệ hơn `fade`.

**Giới hạn phải ghi thẳng vào tài liệu:** `xfade` tác động lên **mối nối**. Nó không phải một
cú máy mà cảnh đang chiếu để lại. Pipeline không có khái niệm "hiệu ứng lúc scene đi ra" — đã
ghi chú ở `zoom` (`ffmpeg-video.mjs:72-76`), cần nhắc lại cho cả bộ mới.
`tests/transitions.test.mjs` kiểm mọi giá trị theo allowlist `FFMPEG_XFADE` — tên không phải
xfade thật là fail ngay.

## P6 · Chiều sâu giả trên ảnh tĩnh

Ken Burns chỉ phóng to. CapCut/AE tách lớp rồi cho chúng chạy lệch nhau — đó là thứ làm một
tấm ảnh tĩnh trông như quay thật.

Với ảnh AI tự gen, có một lối đi rẻ mà kit đủ sức: **gen kèm một lớp tiền cảnh nền trong suốt**
(sương, khung cửa, cành cây) rồi cho hai lớp chạy khác tốc độ bằng CSS. Không cần bản đồ độ sâu,
không cần mô hình nào thêm.

**Rủi ro:** model ảnh tích hợp có thể không xuất được PNG nền trong suốt đúng ý. Thử một lần ở
đầu giai đoạn; không được thì bỏ P6, đừng kéo dài.

## P7 · Rà soát nợ chuyển động — mỗi tháng

```bash
node scripts/video/motion-index.mjs --debt     # 67 cái, theo tên
node --test tests/motion.test.mjs              # counter, không phải assertion
```

Sửa 8–10 cái mỗi đợt — **mỗi cái một chữ ký riêng**, không dùng chung một hiệu ứng. Dùng chung
thì hết khung chết nhưng ra một loạt khung giống hệt nhau, mất đúng thứ cần.

Cùng dịp: rà đống *frame chữ ký* theo `new-template` §signature — dùng ≥2 lần thì lên thư viện
chung, dùng đúng một lần thì xoá.

---

## Cố ý KHÔNG làm

- **Không nhét GSAP vào làm mặc định.** Có adapter thật và dùng được, nhưng phải nạp script CDN
  lúc render — thêm một thứ có thể chậm hoặc chết giữa lượt dựng. Để dành cho frame thật sự cần
  dàn dựng chồng lớp. *(Việc cần làm trước khi dùng: xác nhận điều khoản giấy phép GSAP hiện
  hành — đừng cho là miễn phí rồi mới đọc.)*
- **Không dùng canvas chạy bằng `requestAnimationFrame`.** Bundle hyperframes **không** shim
  đồng hồ cho rAF, nên nó chụp nhầm khung — cùng loại lỗi với clip trong template. Cần canvas
  thì đọc `window.__hfThreeTime`.
- **Không phá kiến trúc file đơn** để có thư viện dùng chung. Đổi lấy nó là mất render offline.
- **Không đuổi theo particle/shader.** `three` và `typegpu` có adapter, nhưng chi phí bảo trì
  vượt xa giá trị cho thể loại video này.
- **Không bật autopilot trước khi xoay bốn khoá đã lộ** (series plan §P0).
- **Không hand-edit dòng `**Motion:**` trong CATALOG.** Nó tự sinh; sửa tay là để nó lệch lại.

---

## Cách biết kế hoạch này có thật sự ăn thua

Không phải "template trông đẹp hơn". Đo lại vào **2026-09-28**:

| chỉ số | 2026-08-16 | hôm nay (08-17) | mục tiêu |
|---|---|---|---|
| **Video đăng tự động, không thao tác tay** | 0 | **0** | **≥ 20** |
| Script publishing trùng lặp | 7 | **7** | 0 |
| Template có lớp chuyển động **liên tục** | 39 / 106 | 39 / 106 | ≥ 60 / 106 |
| Template dùng `clip-reveal` hoặc `mask-sweep` | 4 | **4** | ≥ 10 |
| Kỹ thuật được trỏ đường trong CATALOG + `motion-index` | 0 / 7 | **✅ 7 / 7** | 7 / 7 |
| Transition có tên gọi ý nghĩa | 7 | 7 | ≥ 14 |

Chỉ số **đầu** là chỉ số thật của phần autopilot. Chỉ số **thứ năm** là chỉ số thật của phần
motion, và nó là cái đã xong trong lượt rà này — kit không thiếu ví dụ, nó thiếu đường dẫn tới
ví dụ. Đó là lý do P1 rẻ hơn nhiều so với bản nháp đầu, và vẫn đứng trước mọi thứ khác trong
nhóm chuyển động.
