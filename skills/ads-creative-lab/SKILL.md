---
name: ads-creative-lab
description: Design and read Facebook/Instagram creative tests for a content-agent-kit agent — hook × angle × format matrix, a naming convention results can be pivoted on, test structure and budget (ABO test → CBO/Advantage+ scale), kill/scale rules with sample-size floors, and the next round built from the winners. Use when the user says "test creative", "test mẫu quảng cáo", "nên chạy mẫu nào", "làm thêm mẫu ads", "hết ý tưởng creative", "mẫu nào thắng", "scale mẫu nào", or after ads-report/ads-fatigue-watch names a creative to replace. Works from pasted Ads Manager numbers; better with the meta-ads MCP. Never creates or changes ads on its own.
---

# Creative lab — test creatives on purpose, not by feel

On Meta in 2026 the algorithm finds the audience; **the creative is the targeting**. The
lever a fashion team actually controls is what the first three seconds say and show. This skill
turns "make more ads" into a test that produces an answer.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Gom thông tin | Hỏi sản phẩm (mã, giá, ưu đãi), số liệu đã chạy, ngân sách test và chi phí/đơn chấp nhận được | Gửi danh sách sản phẩm + số liệu cũ (dán hoặc CSV) |
| 2. Lập ma trận | Viết `plan.json` (hook × góc × định dạng) và chạy `node scripts/ads/creative-matrix.mjs plan.json --max 12` | Chọn hook/góc muốn thử, hoặc để agent đề xuất |
| 3. Soát nội dung | Chạy từng mẫu chữ qua `ads-policy-check` | — |
| 4. Đề xuất cấu trúc test | Đưa cách chia nhóm quảng cáo (ABO), ngân sách mỗi nhóm và cách tính ra con số đó | Đồng ý hoặc chỉnh ngân sách |
| 5. Đọc kết quả vòng trước | So số theo tên quảng cáo, chỉ kết luận khi đủ ≥ 2.000 hiển thị và ≥ 3 ngày | Dán số liệu sau 3–5 ngày chạy |
| 6. Dừng — người dùng tự lên ads | Không tự tạo, sửa, tắt hay đổi ngân sách quảng cáo | Tự dán tên quảng cáo vào Ads Manager, đúng nguyên văn |

**Hay vướng:**
- Đổi tên quảng cáo cho "dễ nhìn" → kết quả không gộp được theo hook/góc nữa; giữ nguyên tên script sinh ra.
- Mới chạy 1–2 ngày đã đòi biết mẫu nào thắng → agent sẽ ghi "chưa đủ dữ liệu", chờ đủ ngưỡng.
- Không có số liệu cũ → bắt đầu bằng một test nhỏ 2×2 thay vì kế hoạch lớn.

## 0. Inputs

Ask for, or read from `KNOWLEDGE.md` / `mkt-context` if installed:
- product(s) with a short code (`VL01` = váy linen dáng A), price, the real offer
- what has already run and its numbers (paste, CSV, or meta-ads MCP)
- monthly test budget and the cost per result the business can afford (target CPA)

If none of these exist, say so and start with a 2×2 test, not a plan.

## 1. Build the matrix — three variables, nothing else

| variable | what it is | fashion examples |
|---|---|---|
| **Hook** (H) | first 0–3s, words + picture | câu hỏi tình huống · POV · "1 món 3 cách phối" · try-on xoay người · so sánh outfit A/B · comment khách làm hook |
| **Angle** (A) | the one reason to buy | chất vải/độ mát · dáng che khéo · giá/ưu đãi · đổi size miễn phí · phối được nhiều kiểu · review khách thật |
| **Format** (F) | container | video 9:16 try-on · carousel phối đồ · ảnh đơn flat-lay · UGC/KOC · catalog/collection |

Write `plan.json` (shape in `examples/ads-samples/creative-plan.json`) and run:

```bash
node scripts/ads/creative-matrix.mjs plan.json --max 12          # variety-first subset
node scripts/ads/creative-matrix.mjs plan.json --max 12 --csv > matrix.csv
```

Names come out as `AW26_VL01_H1-A2-V9_261111`. **Paste them into Ads Manager verbatim** — the
whole point is that next week a pivot on the name splits results by hook, angle and format.

Every angle needs a `proof`. "Vải mát" with no shot showing it is a claim; run each draft
through `ads-policy-check` before it goes anywhere.

Producing the assets: video cells → `create-video` (genres `flash-deal`, `review`,
`testimonial`), image/carousel → `design-campaign`, UGC → `ugc-koc-brief`.

## 2. Test structure (propose, do not build)

- **Test campaign:** ABO (budget per ad set), 1 ad set per *hook* or per *concept*, 3–4 ads each,
  broad audience (age/country only) so the creative does the targeting. Same optimisation event
  as the scale campaign (purchase if the pixel/CAPI sees ≥ ~50 purchases a week, otherwise
  add-to-cart or messaging).
- **Budget per ad set:** enough for ~**50 link clicks or ~3× target CPA** within 3–5 days. State
  the number you computed and the assumption behind it.
- **Scale campaign:** CBO or Advantage+ shopping; winners move in **as new ads with the same
  post ID** (keeps social proof), not by raising the test budget 5×.

## 3. Read the test — floors before verdicts

Per ad, only judge after **both**: ≥ 2,000 impressions **and** ≥ 3 days (or spend ≥ 2× CPA).

| signal | reads | means |
|---|---|---|
| hook rate | 3-second views ÷ impressions (video) | does the opening stop the scroll |
| hold rate | ThruPlays ÷ 3s views | does the body keep them |
| CTR (link) | link clicks ÷ impressions | does the angle make them want it |
| CPA / ROAS | cost per purchase | does the page + offer close |

- **Kill:** spend ≥ 2× target CPA with 0 purchases; or CTR in the bottom third of the test after the floor.
- **Keep testing:** passes the floor, CPA within 1.3× target.
- **Scale:** CPA ≤ target over ≥ 3 purchases. Fewer than 3 purchases is not a winner — write
  "not enough data", exactly as `ads-report` does.

Diagnose by layer, not by ad: good hook rate + poor CTR = angle problem; good CTR + poor CPA =
landing/offer problem (price, size out of stock, ship fee) — not a creative problem.

## 4. Iterate from winners

The next round changes **one** variable of the winner: same angle with 3 new hooks, or same hook
in 2 new formats. Record each round in `brain/creative-tests.json`:

```json
{ "round": 3, "date": "2026-11-11", "winner": "AW26_VL01_H1-A2-V9_261101",
  "learned": "POV hook beats question hook on cold traffic (CTR 2.1% vs 1.2%, 6k vs 5k impressions)",
  "next": ["H5-A2-V9", "H6-A2-V9", "H1-A2-U1"] }
```

`learned` names the number **and** the sample. A lesson with no sample is a rumour.

## 5. Stop and ask

Output: the matrix, the proposed campaign/ad set structure with budgets, and the read of last
round. **Then stop.** Creating, duplicating, pausing or re-budgeting ads on a live account is the
user's call, even with the meta-ads MCP connected — see `docs/18-ads-and-marketing.md`.
