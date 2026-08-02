# 01 — Architecture / Kiến trúc

## English

An agent built with this kit has **six moving parts**:

1. **PLAYBOOK.md — the source of truth.** A markdown SOP the agent re-reads *every*
   run. It defines cadence, per-item schema, quality bar, access tiers, publish
   channels, cleanup, and reporting. The agent never relies on chat memory.
2. **KNOWLEDGE.md — the API/schema reference.** The exact request/response contracts
   (ingest, queue, webhook), status-code semantics (201/409/400), and gotchas.
3. **State files.** `queue.json` (today's scheduled dispatch), `ledger.json`
   (in-progress serialized work), `history.json` (dedup by title). Flat JSON,
   git-ignored, rebuilt at runtime.
4. **Scripts.** Small env-only CLIs: publish / append / update / list, the queue
   client, the social poster, the crawler, the scheduler, the **video pipeline**
   (`scripts/video/` — validate a `script.json`, then render it to a 9:16 MP4) and the
   **media layer** (`scripts/media/` — stock B-roll, web screenshots, upload hosts).
5. **Discovery (optional).** `crawl.py` (crawl4ai) reads `sources.yaml`, dedups
   against the queue API, and pushes fresh ideas. The **server is the dedup memory**
   because CI runners are ephemeral.
6. **Scheduling.** A cron job (GitHub Actions) fires the run; inside the run the
   agent fans out subagents, passes each item through the **review gate**, publishes,
   and writes a report to `brain/<id>/report.md`.

**Data flow**

```
[cron] → crawl.py → idea queue ──(dedup via queue API)
                                     │ GET ?status=new
   agent reads PLAYBOOK ─────────────┘
     → fan-out subagents write items → REVIEW gate (independent subagent)
       → publish (ingest API) + social (webhook) → mark queue posted → report
   state: queue.json / ledger.json / history.json

   a video item takes two extra hops before the review gate:
     script.json → validate-script.mjs → resolve media ──► render.mjs → video.mp4
     (AI writes)   schema + craft rules   Pexels/Pixabay    TTS · SFX · templates
                                          + screenshots     · ffmpeg
                                          pinned in media-lock.json
```

**Two platforms.** On **Claude Code** the skills in `skills/` are real
`.claude/skills/*/SKILL.md`. On **Antigravity / Gemini** the same `SKILL.md` files
are read as plain instruction docs, and `PLAYBOOK.md` is what the scheduled agent
opens each run. The methodology is identical.

---

## Tiếng Việt

Một agent dựng bằng kit này có **sáu bộ phận**:

1. **PLAYBOOK.md — nguồn sự thật.** File SOP markdown agent đọc lại *mỗi* lượt chạy:
   cadence, schema từng loại, tiêu chuẩn chất lượng, bậc truy cập, kênh đăng, dọn
   file, báo cáo. Agent KHÔNG dựa vào trí nhớ hội thoại.
2. **KNOWLEDGE.md — tham chiếu API/schema.** Hợp đồng request/response (ingest,
   queue, webhook), ý nghĩa mã trạng thái (201/409/400), các "bẫy".
3. **File trạng thái.** `queue.json` (lịch đăng hôm nay), `ledger.json` (việc nhiều
   kỳ đang dở), `history.json` (chống trùng theo tiêu đề). JSON phẳng, gitignore.
4. **Scripts.** CLI nhỏ env-only: publish / append / update / list, queue client,
   social poster, crawler, scheduler, **pipeline video** (`scripts/video/` — kiểm
   `script.json` rồi render ra MP4 dọc 9:16) và **tầng media** (`scripts/media/` —
   B-roll kho mở, ảnh chụp web, host upload).
5. **Discovery (tuỳ chọn).** `crawl.py` (crawl4ai) đọc `sources.yaml`, dedup qua
   queue API, đẩy ý tưởng mới. **Server là bộ nhớ dedup** (CI runner phù du).
6. **Lịch chạy.** Cron (GitHub Actions) kích hoạt lượt chạy; trong lượt, agent
   fan-out subagent, mỗi item qua **review-gate**, đăng, rồi ghi report
   `brain/<id>/report.md`.

**Đa nền:** Claude Code dùng skill thật `.claude/skills/`; Antigravity đọc chính các
`SKILL.md` đó như tài liệu chỉ dẫn, và mở `PLAYBOOK.md` mỗi lượt. Phương pháp giống hệt.
