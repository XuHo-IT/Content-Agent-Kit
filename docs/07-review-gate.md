# 07 — The review gate / Cổng kiểm duyệt

## English

**Nothing publishes without passing an independent review subagent.** This is the
single most important quality mechanism.

**Flow**
1. A generator subagent produces one item (text + images + metadata).
2. A *separate* review subagent scores it against a checklist:
   - Images: correct subject, on-topic, not distorted, **not reused** across slots, complete (none missing).
   - Content: coherent, correct length, target language + diacritics, no machine-translation artifacts.
   - Logic (for structured items like puzzles/cases): every referenced id exists; the
     answer is derivable from the given clues; no dead ends.
   - SEO: title + subtitle/description are compelling and correct.
3. **Pass →** publish. **Fail →** send it back to fix (regenerate the bad part / new
   image), re-review. Max 2–3 rounds. Still failing → **drop it** and record why.
4. If a subagent produced something the playbook forbids (a removed feature, wrong
   type) → **reject immediately**, do not review/publish.

**Why a separate subagent?** A generator grading its own work is biased. Independence
catches reused images, broken logic, and off-brand tone that the author misses.

---

## Tiếng Việt

**Không gì được đăng nếu chưa qua 1 subagent review độc lập.** Đây là cơ chế chất lượng
quan trọng nhất.

**Luồng**
1. Subagent tạo ra 1 item (text + ảnh + metadata).
2. Subagent review *riêng* chấm theo checklist:
   - Ảnh: đúng chủ thể, đúng chủ đề, không méo, **không dùng lại**, đủ (không thiếu).
   - Nội dung: mạch lạc, đủ độ dài, đúng ngôn ngữ + dấu, không rác dịch máy.
   - Logic (item có cấu trúc như vụ án): mọi id tham chiếu có thật; đáp án suy ra được
     từ manh mối; không bế tắc.
   - SEO: tiêu đề + mô tả cuốn + đúng.
3. **Đạt →** đăng. **Fail →** trả về sửa (tạo lại phần lỗi / ảnh mới), review lại. Tối
   đa 2–3 vòng. Vẫn fail → **bỏ** + ghi lý do.
4. Nếu subagent tạo ra thứ playbook cấm (tính năng đã gỡ, sai loại) → **loại ngay**,
   không review/đăng.

**Vì sao subagent riêng?** Tự chấm bài mình = thiên vị. Độc lập mới bắt được ảnh trùng,
logic hỏng, giọng lệch brand.
