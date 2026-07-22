# 08 — Audit & maintain / Audit & bảo trì

## English

A *separate* workflow from daily creation: review and fix **already-published** content.
See `templates/AUDIT_PLAYBOOK.template.md` and the `audit-and-fix` skill.

**Process**
1. **Rule-based audit first (cheap).** A script checks each published item against hard
   rules (length, missing fields, broken id references, duplicate/missing images) and
   writes an `audit_report.md`. No AI needed — fast and objective.
2. **List for the agent.** `list-published.mjs` dumps recent items → `audit_input.json`.
3. **Subagent audit (fan-out).** One subagent grades images/content/logic per item.
4. **Stop for human confirmation.** Present the list of failing items; do NOT mutate
   anything until the user picks which to fix. (Editing live content is high-impact.)
5. **Fix confirmed items** via `update.mjs` (regenerate text / new images), then
   re-audit to confirm clean.

**Priority order** when there's a backlog: items visible to logged-out visitors / free
tier first, then paid, then the long tail.

---

## Tiếng Việt

Workflow *tách riêng* khỏi tạo bài hằng ngày: rà & sửa nội dung **đã đăng**. Xem
`templates/AUDIT_PLAYBOOK.template.md` + skill `audit-and-fix`.

**Quy trình**
1. **Audit bằng luật trước (rẻ).** Script kiểm từng bài theo luật cứng (độ dài, thiếu
   field, id tham chiếu sai, ảnh trùng/thiếu) → `audit_report.md`. Không cần AI.
2. **Liệt kê cho agent.** `list-published.mjs` → `audit_input.json`.
3. **Subagent audit (fan-out).** Mỗi subagent chấm ảnh/nội dung/logic 1 bài.
4. **DỪNG chờ người xác nhận.** Trình danh sách bài lỗi; KHÔNG sửa gì tới khi user
   chọn. (Sửa nội dung live = tác động lớn.)
5. **Sửa bài đã confirm** qua `update.mjs`, rồi audit lại cho sạch.

**Ưu tiên:** bài lộ cho khách/free trước, rồi paid, rồi phần còn lại.
