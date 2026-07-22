# 02 — How to write a PLAYBOOK / Cách viết PLAYBOOK

## English

A `PLAYBOOK.md` is a numbered SOP. Recommended skeleton (from real running agents):

```
0.  One-line summary        — what this agent does, in one sentence
0b. Voice & language        — tone, language, diacritics, "never brand as (AI)"
1.  Rotation / cadence      — phase = (day-of-year mod N); what each phase produces
2.  Fan-out                 — 1 subagent per item, run in parallel
2b. REVIEW gate (mandatory) — independent review before publish; fail → fix → drop
3.  Assets (images)         — how images are generated; 1 per entity, no reuse
3b. Author                  — random pen-name, never "(AI)"
3c. Access tiers            — FREE / LOGIN / PAID split per item
4.  Per-type schema         — the exact JSON each content type must produce
5.  Publish + schedule      — which script/endpoint; spread times randomly
6.  Dedup                   — check history; 409 = already done
7.  Cleanup                 — delete per-run scratch files at the end
7b. Report                  — write brain/<id>/report.md
8.  Required env            — the env keys the run needs
```

**Cadence pattern.** `phase = dayOfYear % N`. Example (N=2): `1 → Day A`, `0 → Day B`.
Keep it "little but high quality" — a small number of excellent items beats volume.

**Golden rule.** The playbook is *executable prose*: every instruction must map to a
concrete script call or a subagent task. If a human couldn't follow it step-by-step,
neither can the agent.

Start from `templates/PLAYBOOK.template.md` and fill the `{{PLACEHOLDERS}}`.

---

## Tiếng Việt

`PLAYBOOK.md` là SOP đánh số. Khung đề xuất (rút từ agent thật):

```
0.  Tóm tắt 1 câu           — agent này làm gì
0b. Văn phong & ngôn ngữ    — giọng, ngôn ngữ, dấu, "KHÔNG gắn (AI)"
1.  Cadence                 — pha = (ngày trong năm mod N); mỗi pha ra gì
2.  Fan-out                 — 1 subagent/item, chạy song song
2b. Review-gate (bắt buộc)  — review độc lập trước đăng; fail → sửa → bỏ
3.  Ảnh                     — cách sinh ảnh; mỗi thực thể 1 ảnh, không trùng
3b. Author                  — bút danh ngẫu nhiên, KHÔNG "(AI)"
3c. Bậc truy cập            — FREE / LOGIN / PAID mỗi item
4.  Schema từng loại        — JSON chính xác mỗi loại phải xuất ra
5.  Đăng + lịch             — script/endpoint nào; rải giờ random
6.  Chống trùng             — kiểm history; 409 = đã có
7.  Dọn file                — xoá scratch cuối lượt
7b. Báo cáo                 — ghi brain/<id>/report.md
8.  Env cần có
```

**Cadence:** `pha = dayOfYear % N`. Ví dụ N=2: `1 → Ngày A`, `0 → Ngày B`. "Ít mà chất".

**Nguyên tắc vàng:** playbook là *văn xuôi thực thi được* — mỗi câu phải map tới 1 lệnh
script hoặc 1 task subagent cụ thể. Bắt đầu từ `templates/PLAYBOOK.template.md`.
