# 12 — Writing craft / Chất lượng văn chương

## English

Generated content fails for a predictable reason: the playbook says *"write well"* and
nothing else. "Write well" is unenforceable — the writer can't aim at it and the reviewer
can't score it. The fix is to turn craft into **two concrete artifacts**:

1. **A craft guide** (`WRITING_CRAFT.md`) the writer reads *before* writing.
2. **A measurable rubric** (its last section) the reviewer scores *before* publishing.

### What goes in the craft guide
Use `templates/WRITING_CRAFT.template.md`. Seven sections:

| § | Content |
|---|---|
| 1 | **Universal principles** — show don't tell · concrete sensory detail · sentence rhythm · strong verbs · consistent POV/address · dialogue with subtext · enter late, leave early |
| 2–3 | **One section per register.** Two content types = two different voices. Spell out how each *sounds* and what it must contain |
| 4 | **Banned list** — the exact clichés and structural tics for your language/genre. Be specific: quote the phrases |
| 5 | **BEFORE / AFTER examples** — a bad passage rewritten well, with a note on *what changed* |
| 6 | **Self-check** the writer runs before submitting |
| 7 | **Review rubric** — numbered criteria with **fail thresholds** |

### Why BEFORE/AFTER matters most
An LLM follows a demonstrated pattern far better than an abstract adjective. One
before/after pair teaches more than a page of rules. Write your own examples — never
paste copyrighted prose.

### Make the rubric measurable
Vague criteria produce vague reviews. Prefer things you can **count**:
- cliché phrases per 1000 words (e.g. fail if > 1)
- consecutive paragraphs opening with the same structure (fail if > 2)
- concrete sensory details per major scene (fail if < 3)
- filler-transition density ("suddenly") per 1000 words
- register-specific hard rules (e.g. for mystery: *every clue needed for the solution must
  appear in the body* — fail-on-violation)

Add a short **FAIL-IMMEDIATELY** list for violations that make the rest moot.

### Wire it into the loop
- `PLAYBOOK.md` §0b → "read `WRITING_CRAFT.md` before writing"; name the registers.
- Fan-out step → each writing subagent reads §1 + its register + the banned list.
- Review gate (§2b) → score by the rubric; `fixes` must **quote the offending sentence**
  and suggest a rewrite, never "make it better".
- Report → log the craft verdict per item so repeated failures tighten the next run.

---

## Tiếng Việt

Nội dung do agent viết thường dở vì playbook chỉ ghi *"viết hay"* — mà "viết hay" thì
**không ép được**: người viết không biết nhắm vào đâu, người review không chấm được. Cách
sửa: biến văn chương thành **hai thứ cụ thể**:

1. **Cẩm nang craft** (`WRITING_CRAFT.md`) — subagent VIẾT đọc *trước khi* viết.
2. **Rubric đo được** (mục cuối cẩm nang) — subagent REVIEW chấm *trước khi* đăng.

### Cẩm nang gồm gì
Dùng `templates/WRITING_CRAFT.template.md`, 7 mục:

| § | Nội dung |
|---|---|
| 1 | **Nguyên tắc chung** — tả đừng kể · chi tiết giác quan cụ thể · nhịp câu · động từ mạnh · ngôi kể/xưng hô nhất quán · thoại có hàm ý · vào cảnh muộn ra cảnh sớm |
| 2–3 | **Mỗi thể loại một mục.** Hai loại nội dung = hai giọng khác hẳn; ghi rõ mỗi giọng *nghe như thế nào* và bắt buộc có gì |
| 4 | **Danh sách CẤM** — cụm sáo rỗng + lỗi cấu trúc, **trích thẳng cụm từ**, không nói chung chung |
| 5 | **Ví dụ TRƯỚC / SAU** — đoạn dở viết lại thành hay, kèm chú thích *sửa gì* |
| 6 | **Checklist tự kiểm** cho subagent viết |
| 7 | **Rubric review** — tiêu chí đánh số kèm **ngưỡng FAIL** |

### Vì sao TRƯỚC/SAU là quan trọng nhất
LLM bắt chước **mẫu được minh hoạ** tốt hơn nhiều so với tính từ trừu tượng. Một cặp
trước/sau dạy được nhiều hơn cả trang quy tắc. **Tự viết ví dụ** — không chép văn có bản quyền.

### Rubric phải ĐO ĐƯỢC
Tiêu chí mơ hồ → review mơ hồ. Ưu tiên thứ **đếm được**:
- số cụm sáo rỗng / 1000 từ (vd FAIL nếu > 1)
- số đoạn liên tiếp mở cùng cấu trúc (FAIL nếu > 2)
- số chi tiết giác quan cụ thể mỗi cảnh chính (FAIL nếu < 3)
- mật độ từ chuyển cảnh rẻ tiền ("bỗng nhiên") / 1000 từ
- luật cứng theo thể loại (vd trinh thám: *mọi manh mối cần cho lời giải phải có trong bài* — vi phạm là FAIL)

Kèm danh sách **FAIL NGAY** cho các lỗi khiến chấm tiếp là vô nghĩa.

### Nối vào vòng chạy
- `PLAYBOOK.md` §0b → "đọc `WRITING_CRAFT.md` trước khi viết"; nêu tên các register.
- Bước fan-out → mỗi subagent viết đọc §1 + register của mình + danh sách cấm.
- Review gate (§2b) → chấm theo rubric; `fixes` phải **trích đúng câu sai** + gợi ý viết lại,
  tuyệt đối không chê "viết hay hơn đi".
- Báo cáo → ghi verdict craft từng mục để lượt sau siết đúng lỗi lặp lại.
