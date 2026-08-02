# 06 — Scheduling / Lịch chạy

## English

Three options, in order of preference:

### 1. GitHub Actions cron (recommended, portable)
Best for the **crawl/discovery** step and for triggering a daily run. Runs on GitHub's
infra, installs Chromium via `crawl4ai-setup`, reads secrets → env. See
`templates/workflows/crawl.yml.template`.
```yaml
on:
  schedule: [{ cron: "0 22 * * *" }]   # 22:00 UTC daily
  workflow_dispatch: {}                 # manual button
```
Secrets: add `INGEST_API_TOKEN`, `SITE_URL` (+ image/webhook keys) in repo Settings → Secrets.

### 2. Windows Task Scheduler (`schtasks`)
For posting **at randomized times through the day** on a Windows box that's always on.
`build-queue.mjs` assigns times → `register-tasks.mjs` creates one `schtasks /sc once`
job per item → each fires `run-item.mjs <id>`.

### 3. In-process scheduler
`node` process that `setTimeout`s to each item's time. Simplest, but dies if the
process stops. Fine for a laptop session.

**Single-instance lock.** For a machine-scheduled agent, guard against overlapping
runs with a lock file `{ sessionId, pid, acquiredAt }` — refuse to start if a fresh
lock exists.

**The daily prompt.** Whatever fires the run passes a *schedule prompt* — a short
instruction: "Read PLAYBOOK.md, execute today's phase." See `templates/schedule-prompt.template.md`.

### Scheduling video: render ahead, post on time

A video render costs **3–5 minutes** of CPU plus a Chromium instance, and it needs FFmpeg and
Chrome on the machine (a cloud TTS provider needs only an API key; `omnivoice` additionally
needs a local server). Two consequences:

**GitHub Actions cannot render.** Keep Actions for the crawl step (as
`examples/ai-video-social/.github/workflows/daily.yml` does) and run rendering and posting
locally via `schtasks` (option 2). A self-hosted runner with the same prerequisites works too.

**Render during the daily run, not at the posting slot.** The daily run writes `script.json`,
renders it, and puts `videoPath` in the queue item. When the slot fires, `run-item.mjs` only
uploads and calls the webhook — seconds, so the post lands at the time you scheduled instead
of 3–5 minutes late.

`run-item.mjs` still covers the gap: a `type:"video"` item with no `videoPath` but a
`scriptPath` is rendered on the spot, and the resulting path is written back to the queue so a
later retry posts immediately. Per-scene idempotency means an interrupted render resumes.

---

## Tiếng Việt

Ba lựa chọn, ưu tiên giảm dần:

1. **GitHub Actions cron (khuyến nghị, portable).** Tốt cho bước **crawl** + kích hoạt
   lượt chạy hằng ngày; cài Chromium qua `crawl4ai-setup`; secrets → env. Xem
   `templates/workflows/crawl.yml.template`. `cron` + `workflow_dispatch` (nút chạy tay).
2. **Windows Task Scheduler (`schtasks`).** Để đăng **rải giờ random** trên máy luôn
   bật: `build-queue.mjs` chia giờ → `register-tasks.mjs` tạo task/item → chạy
   `run-item.mjs <id>`.
3. **In-process scheduler.** Tiến trình `node` `setTimeout` tới giờ từng item. Đơn
   giản nhưng tắt tiến trình là mất.

**Single-instance lock:** dùng file lock `{sessionId,pid,acquiredAt}` để không chạy chồng.

**Prompt hằng ngày:** thứ kích hoạt truyền 1 *schedule prompt* ngắn — "Đọc PLAYBOOK.md,
thực thi pha hôm nay". Xem `templates/schedule-prompt.template.md`.

### Lịch cho video: render trước, đăng đúng giờ

Render một video tốn **3–5 phút** CPU cộng một tiến trình Chromium, và cần FFmpeg + Chrome
trên máy (provider TTS cloud chỉ cần API key; riêng `omnivoice` cần thêm server local).
Hai hệ quả:

**GitHub Actions không render được.** Giữ Actions cho bước crawl (như
`examples/ai-video-social/.github/workflows/daily.yml`), còn render + đăng chạy local qua
`schtasks` (cách 2). Self-hosted runner có đủ prerequisite cũng dùng được.

**Render trong lượt chạy hằng ngày, không phải lúc đến giờ đăng.** Lượt chạy viết
`script.json`, render, rồi ghi `videoPath` vào item trong queue. Đến giờ, `run-item.mjs` chỉ
upload và gọi webhook — vài giây, nên bài lên đúng giờ đã đặt thay vì trễ 3–5 phút.

`run-item.mjs` vẫn xử lý trường hợp thiếu: item `type:"video"` không có `videoPath` nhưng có
`scriptPath` thì render tại chỗ, rồi ghi đường dẫn ngược vào queue để lần retry sau đăng ngay.
Idempotent theo từng scene nên render bị ngắt sẽ chạy tiếp.
