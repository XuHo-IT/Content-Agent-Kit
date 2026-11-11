---
name: daily-run
description: Execute today's content run for an agent built with content-agent-kit. Use when the user says "run today", "tạo nội dung hôm nay", "do the daily run", or a scheduler fires the daily prompt. Reads the project PLAYBOOK.md, does today's phase, passes every item through the review gate, publishes, schedules, and reports.
---

# Daily run

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 0. Kiểm cập nhật | `freshness-check`: chính sách nền tảng, luật quảng cáo, thông số đăng đã cũ thì tra bản mới (bỏ qua nếu còn mới) | Duyệt nếu có thay đổi về luật |
| 1. Đọc `PLAYBOOK.md` | Đọc lại toàn bộ, xác định hôm nay làm phần việc nào | — |
| 2. Lấy ý tưởng | Nếu có crawl: `node scripts/queue-client.mjs pull` | — |
| 3. Viết | Mỗi bài một người viết (subagent), theo `WRITING_CRAFT.md`; bỏ bài trùng | — |
| 4. Video (nếu có) | Dựng video ngay bằng `create-video` (3–5 phút/video) | — |
| 5. Kiểm duyệt | Mọi bài qua `review-gate`; sai thì sửa tối đa 2–3 vòng, không được thì bỏ và ghi lại | — |
| 6. Đăng và lên lịch | `node scripts/publish.mjs <file>.json`, lịch mạng xã hội qua `build-queue.mjs` | Duyệt lần cuối nếu PLAYBOOK yêu cầu |
| 7. Báo cáo | `brain/<id>/report.md`: đã làm / đã duyệt / đã đăng / đã bỏ; dọn file tạm | Đọc báo cáo |

**Hay vướng:**
- Chưa có `PLAYBOOK.md` → chạy `bootstrap-content-agent` trước.
- Báo `409` khi đăng → bài đã đăng rồi, không phải lỗi; agent ghi nhận và đi tiếp.
- Thiếu biến môi trường → script báo đúng tên biến; điền vào `.env` rồi chạy lại.

## Quy trình chi tiết (cho agent)

0. **Freshness first.** Run the `freshness-check` skill (`node scripts/maintenance/freshness.mjs --stale`). Stale platform rules or ad law are researched and renewed before anything is written or posted; nothing stale → one line, move on.
1. **Open `PLAYBOOK.md`** in the project (the source of truth). Re-read it fully — do not
   rely on memory.
2. **Determine today's phase** = (day-of-year mod N) per §1, and do exactly that phase.
3. **(If crawling)** pull fresh ideas first: `node scripts/queue-client.mjs pull` → work
   from `queue_raw.json`.
4. **Fan out** one subagent per item (§2). **Each writer MUST read `WRITING_CRAFT.md` first**
   (§1 universal principles + its register §2/§3 + the banned-cliché list §4) and self-check
   against §6 before submitting. Each produces content + images + metadata per the §4 schema.
   Check `history.json` — skip duplicates.
4b. **Video items (if the PLAYBOOK calls for any)** — invoke `create-video` (writer reads
   `VIDEO_CRAFT.md` + `video-templates/CATALOG.md`, writes `script.json`, validates with
   `--strict`, renders). **Render now, not at the posting slot**: a render takes 3–5 minutes,
   so doing it here keeps the scheduled post instant. Keep the resulting `videoPath`.
5. **Review gate (mandatory, §2b)** — invoke the `review-gate` skill / an independent
   review subagent on every item. Pass → continue. Fail → fix (2–3 rounds) → drop + log.
   Reject any forbidden output on sight.
6. **Publish**: content → `node scripts/publish.mjs <file>.json`; chapters →
   `node scripts/append.mjs <file>.json`. Treat `409` as already-done. Record ids in
   `ledger.json` / titles in `history.json`.
7. **Schedule social** (if any): `node scripts/scheduler/build-queue.mjs items.json` →
   register/run per `docs/06`. Never post restricted types (see PLAYBOOK).
   Video items go in as `type:"video"` carrying `videoPath` + `post` / `comment` / `title` /
   `hashtags` / `platforms` — see `templates/state/queue.example.json`.
8. **Access tiers, author, language** per §3b/§3c/§0b. Never brand as "(AI)".
9. **Clean up** per-run scratch files (§7).
10. **Report** → `brain/<id>/report.md` (§7b): made / reviewed / published / dropped.
