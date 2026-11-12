---
name: promo-calendar
description: Build a quarter's ad and content plan around the Vietnamese retail calendar for a fashion shop — Tết, 14/2, 8/3, 30/4, double days (9/9, 10/10, 11/11, 12/12), back-to-school, 20/10, Black Friday, Christmas — with warm-up start dates, peak windows, budget weights split by month, the fashion angle for each moment, and the creative/audience work that has to be ready before each. Use when the user says "lên kế hoạch quý", "lịch khuyến mại", "lịch sale", "chuẩn bị 11/11", "kế hoạch Tết", "phân bổ ngân sách theo tháng", "promo calendar", "seasonal plan".
---

# Promo calendar — be ready before the date, not on it

Peak days are when CPMs are highest and everyone is shouting. The shops that win them gathered
their audience (video viewers, engagers, add-to-carts) and tested creatives **in the weeks before**.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Chọn khoảng thời gian | Hỏi quý cần lên kế hoạch và tổng ngân sách | Cho quý (vd. 2027-Q1) và ngân sách |
| 2. Lấy ngày sale | Chạy `promo-plan.mjs --quarter 2027-Q1 --budget 60000000` | — |
| 3. Lọc dịp | Bỏ dịp shop không làm, thêm dịp riêng (sinh nhật shop, ra bộ sưu tập) | Đánh dấu dịp làm, dịp bỏ |
| 4. Viết kế hoạch | Mỗi dịp: ngày khởi động, cao điểm, việc cần xong trước, chia ngân sách theo tháng | — |
| 5. Lưu và chờ duyệt | Ghi `brain/promo-plan-<quý>.md` | Duyệt kế hoạch |
| 6. Xếp lịch nội dung | Chỉ sau khi được duyệt mới đưa vào hàng đợi | Đồng ý |

**Hay vướng:**
- Thiếu ngày âm lịch (Tết, Trung thu) của năm đó → script báo; lấy từ lịch chính thức, đừng đoán.
- Tỉ lệ chia ngân sách chỉ là giả định ban đầu → sau một mùa, thay bằng doanh thu thật từ `ads-report`.
- Ngày cuối nhận đơn trước Tết → hỏi đơn vị vận chuyển để ghi đúng.

## 1. Resolve dates

```bash
node scripts/ads/promo-plan.mjs --quarter 2027-Q1 --budget 60000000
node scripts/ads/promo-plan.mjs --from 2026-11-11 --days 90 --json
```

Reads `templates/VN_RETAIL_CALENDAR.template.json`: each event has `leadDays` (when ads start),
`peakDays` + `peakAlign` (`before` for gifts and Tết — people buy ahead; `from` for mega-sale
days), `budgetWeight`, and the fashion angle. Copy the file into the project to edit it: drop
events the shop ignores, add its own (store anniversary, collection drops).

**Lunar dates** (Tết, Trung thu) are listed per year. If the year is missing the script says so —
add it from an official calendar, never guess.

**Budget weights are starting assumptions, not measurements.** Say so in the plan, and after one
cycle replace them with the shop's own revenue-by-day from `ads-report`.

## 2. For each event, the plan states

| when | what | skill |
|---|---|---|
| lead − 21d | product & offer locked; feed checked | `catalog-feed-audit` |
| lead − 14d | creatives tested; policy-checked | `ads-creative-lab`, `ads-policy-check` |
| lead − 14d | KOC content commissioned | `ugc-koc-brief` |
| warm-up | content/video to build engaged audiences; VIP early access | `create-video`, `audience-plan` |
| peak | conversion campaigns into warmed audiences + broad; comments answered within the hour | `ads-comment-triage` |
| peak + 2d | fatigue check, report | `ads-fatigue-watch`, `ads-report` |

Tết: shipping stops several days before Tết — the plan names the **last order date** and moves
spend from conversion to awareness after it.

## 3. Output

`brain/promo-plan-<quarter>.md`: the date table, monthly budget split, per-event checklist with
owners and deadlines, and open questions (offer, stock). Queue the content items with
`scripts/scheduler/build-queue.mjs` only after the user approves the plan.

**A date is not a campaign.** For each peak, `brand-lessons` → `pnj` turns an insight into one big idea and something concrete to buy; `momo` adds a share loop for a cultural moment; `coca-cola` gives the brand a natural role in it (`docs/32-bai-hoc-thuong-hieu.md`).
