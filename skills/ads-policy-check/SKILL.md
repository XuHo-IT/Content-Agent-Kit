---
name: ads-policy-check
description: Pre-flight Facebook/Instagram ad copy before it is submitted — Meta's personal-attributes rule ("Bạn béo bụng?"), before/after bodies, body or health promises for shapewear, unprovable superlatives ("rẻ nhất", "số 1"), invented urgency, discounts with no reference price or over the Vietnamese promotion cap, counterfeit hints, engagement bait — with a severity and a rewrite for each. Use when the user says "check chính sách quảng cáo", "ads bị từ chối", "bị reject", "quảng cáo có vi phạm không", "kiểm tra nội dung trước khi chạy", "policy check", or before any ad copy leaves the review gate. A linter, not legal advice.
---

# Policy check — get rejected by a script, not by Meta

A rejected ad costs a day; repeated rejections put the ad account at risk, which costs far more.
Fashion trips the same few rules over and over, so they can be caught before submission.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 0. Kiểm cập nhật luật | `freshness-check` mục `vn-ads-law`: có nghị định/thông tư mới về quảng cáo, khuyến mại không | Duyệt thay đổi luật trước khi áp dụng |
| 1. Nhận nội dung | Nhận chữ quảng cáo dán vào chat, hoặc file `.txt` (các mẫu cách nhau bằng `---`) | Dán tiêu đề + nội dung chính của từng mẫu |
| 2. Soát | Chạy `node scripts/ads/policy-lint.mjs ads.txt` — mỗi lỗi có mức BLOCK / REVIEW | — |
| 3. Viết lại | Với mỗi lỗi, đưa câu đã sửa nhưng giữ ý bán hàng | Chọn câu sửa ưng ý |
| 4. Xem hình/video | Script không đọc được hình — agent tự xem hoặc hỏi: có ảnh trước/sau không, giá trong ảnh có khác chữ không | Gửi ảnh/video của mẫu |
| 5. Xin bằng chứng | Câu "số 1", "bán chạy nhất", "giảm 50%" cần giấy tờ/giá gốc thật | Gửi chứng từ, hoặc đồng ý bỏ câu đó |
| 6. Báo kết quả | Ghi rõ "không phải tư vấn pháp lý"; CLEAN chỉ nghĩa là không khớp mẫu lỗi đã biết | Đọc và quyết định có chạy không |

**Hay vướng:**
- Hiểu CLEAN là "Meta sẽ duyệt" → không phải; hình ảnh và trang đích vẫn có thể bị từ chối.
- Giảm giá không ghi giá gốc → ghi cả giá cũ và giá mới, giữ bằng chứng đã từng bán giá cũ.
- Hỏi "điều mấy của luật" → agent chỉ trích dẫn khi chắc chắn, và nhắc kiểm bản luật mới nhất.

## 0. Is the law current?

`node scripts/maintenance/freshness.mjs --stale` — if `vn-ads-law` is stale, run `freshness-check` for it BEFORE linting: `policy-lint.mjs` checks against the rules as of `LEGAL_CHECKED`, and a new decree can make a passing ad illegal.

## 1. Run

```bash
node scripts/ads/policy-lint.mjs --text "Bạn béo bụng? Mặc gen này giảm 5cm eo ngay!"
node scripts/ads/policy-lint.mjs ads.txt            # several ads separated by ---
node scripts/ads/policy-lint.mjs ads.json --json    # [{id, headline, primary_text, description}]
```

Exit code 2 = at least one `BLOCK`. `review-gate` should treat that as a fail.

## 2. What it catches (and why)

| rule | example | basis |
|---|---|---|
| `personal-attribute` | "Bạn béo bụng?", "Chị bị lùn?" | Meta Advertising Standards — Personal attributes |
| `before-after` | "Trước và sau khi mặc" | Meta — negative self-perception |
| `body-outcome-claim` | "giảm 5cm eo", "đốt mỡ" | Meta — unrealistic outcomes; misleading claims |
| `superlative` | "rẻ nhất", "số 1", "duy nhất" | Luật Quảng cáo 2012, Điều 8 khoản 11 — needs lawful proof |
| `fake-urgency` | "chỉ còn 3 chiếc", "chỉ hôm nay" | misleading if not literally true |
| `discount-no-reference` | "giảm 30%" with no original price | Nghị định 81/2018/NĐ-CP — discount on the real pre-promotion price |
| `discount-over-cap` (warn) | "SALE 70%" | Nghị định 81/2018/NĐ-CP as amended by 128/2024 and 239/2026 — check the discount ceiling in force; sources disagree after 06/2026 |
| `health-claim` | "kháng khuẩn 100%", "chữa đau lưng" | health claims need documentation |
| `fake-brand` | "rep 1:1", "like auth" | IP — account-level risk |
| `engagement-bait` | "Like và share để nhận quà" | Meta demotes engagement bait |
| `shouting` | mostly CAPS | ad-quality signal |

## 3. Rules for the agent

- **Rewrite, do not just flag.** For each finding, give the copy back fixed, keeping the selling
  point: "Bạn béo bụng?" → "Dáng váy che khéo vòng eo, mặc cả ngày vẫn thoải mái".
- **CLEAN is not "approved".** It means none of these patterns matched. Images and video are not
  checked by the script — look at them: before/after body shots, zoomed-in body parts, fake
  "play" buttons, a price in the picture that differs from the caption.
- **Law is cited conservatively.** Luật Quảng cáo was amended by Luật 75/2025/QH15 (in force
  01/01/2026), and the promotion decree 81/2018 by 128/2024 and 239/2026 (26/06/2026). The
  script's article numbers are the 2012 text, last compared on `LEGAL_CHECKED` in
  `policy-lint.mjs` — check the current consolidated text on vbpl.vn before quoting one to anyone, and say "không phải tư vấn pháp
  lý" when you report. If a claim needs proof (sales numbers, test certificates), ask the user
  for the document and its date; never write one.
- A user-supplied claim the script flags stays flagged until they show the evidence.

Rules live in `RULES` inside the script — add a pattern there (with a `ref`) when Meta rejects
something new, and add a test in `tests/ads.test.mjs`.
