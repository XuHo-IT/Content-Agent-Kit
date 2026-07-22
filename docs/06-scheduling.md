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
