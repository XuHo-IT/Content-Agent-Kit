---
name: audit-and-fix
description: Audit ALREADY-published content and fix low-quality items, for an agent built with content-agent-kit. Use when the user says "audit the published content", "review old posts and fix them", or "clean up the backlog". Rule-audit first, then subagent grading, then STOP for confirmation before mutating live content.
---

# Audit & fix (published content)

This is separate from daily creation and it mutates LIVE content — so it stops for human
confirmation before changing anything.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Soát nhanh bằng luật | Chạy `node scripts/audit-quality.mjs` → `audit_report.md` (độ dài, thiếu trường, ảnh lỗi) | — |
| 2. Lấy danh sách bài | Chạy `node scripts/list-published.mjs --limit 40` | Nói muốn soát bao nhiêu bài |
| 3. Chấm từng bài | Mỗi bài một người chấm độc lập (subagent): ảnh, nội dung, logic | — |
| 4. Dừng và trình bày | Gửi `audit_report.md`: bài lỗi + cách sửa đề xuất | Chọn bài nào được sửa |
| 5. Sửa bài đã chọn | Giữ nguyên `id`, sửa bằng `node scripts/update.mjs <fix>.json`, soát lại | — |
| 6. Báo cáo | `brain/<id>/audit_fix_report.md`: đã sửa / bỏ qua / gỡ | Đọc báo cáo |

**Hay vướng:**
- Muốn sửa hết một lần cả trăm bài → làm từng đợt 20–30 bài cho dễ kiểm.
- Thiếu biến môi trường của API → script báo rõ biến nào thiếu; thêm vào `.env` rồi chạy lại.
- Sợ sửa nhầm bài đang chạy → không bài nào bị đụng tới trước khi bạn chọn ở bước 4.

## Quy trình chi tiết (cho agent)

1. **Rule-based audit first (cheap).** Run the project's rule audit (e.g.
   `node scripts/audit-quality.mjs`) → `audit_report.md`. Hard rules only: length, missing
   fields, broken id references, duplicate/missing images. No AI needed.
2. **List** recent published items: `node scripts/list-published.mjs --limit 40` →
   `audit_input.json`.
3. **Subagent audit (fan-out)** — one reviewer per item grades cover/images/content/logic
   → `{ id, ok, issues[] }`.
4. **STOP and present.** Write `audit_report.md` (failing items + proposed fixes) and show
   the user. Do NOT change anything until they choose which items to fix.
5. **Fix confirmed items** — regenerate the bad part / new images, keep the `id` stable,
   apply with `node scripts/update.mjs <fix>.json`. Re-audit to confirm clean.
6. **Report** → `brain/<id>/audit_fix_report.md`: fixed / skipped / dropped.

**Priority**: items visible to logged-out / free users first, then paid, then the long
tail. Work in batches of 20–30 (not >100 per run).
