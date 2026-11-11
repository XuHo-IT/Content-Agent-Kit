---
name: ads-fatigue-watch
description: Find Facebook/Instagram ads that are wearing out — frequency climbing, CTR falling from its own start, CPM and cost per result rising — and write a concrete refresh brief for each, from an Ads Manager CSV export or the meta-ads MCP. Use when the user says "quảng cáo đuối", "ads bị bão hoà", "CPM tăng", "CTR giảm", "mẫu này chạy lâu rồi", "ad fatigue", "creative refresh", "canh ads", or on a schedule twice a week. Reads only; never pauses or edits an ad.
---

# Fatigue watch — replace a creative before it burns budget, not after

"Canh tắt ads" by eye means turning things off when they already cost money. This skill compares
each ad **with its own first days** and flags the decline while it is still a trend.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Xuất số liệu | Hướng dẫn xuất CSV từ Ads Manager: cấp *Quảng cáo*, chia *Theo ngày*, 14 ngày gần nhất | Xuất file và gửi cho agent |
| 2. Kiểm tra | Chạy `node scripts/ads/fatigue-check.mjs export.csv`, so mỗi quảng cáo với 3 ngày đầu của chính nó | Nói nếu đây là tệp retarget (ngưỡng tần suất cao hơn) |
| 3. Giải thích trạng thái | 🔴 đuối · 🟡 theo dõi · 🟢 ổn · ⚪ chưa đủ dữ liệu, kèm ngưỡng đã dùng | — |
| 4. Viết brief làm mới | Mỗi tín hiệu thành một việc cụ thể (đổi hook, đổi hình, mở rộng tệp, xem lại trang bán) → `brain/fatigue-<ngày>.md` | Đọc brief, chọn mẫu sẽ làm lại |
| 5. Dừng — người dùng tự tắt | Chỉ đề xuất mẫu nên tạm dừng, không tự tắt | Tự tắt/bật trong Ads Manager |

**Hay vướng:**
- File thiếu cột theo ngày → phải chọn breakdown *Theo thời gian → Ngày* khi xuất.
- Thấy 🟢 rồi vẫn muốn sửa → quảng cáo đang tốt thì để yên, sửa sẽ làm nó học lại từ đầu.
- Nhiều dòng ⚪ → tài khoản chạy chưa đủ 6 ngày hoặc 2.000 hiển thị; chạy lại sau vài ngày.

## 1. Get the data

- **No MCP:** Ads Manager → Reports → level *Ad*, breakdown *By time → Day*, columns: Ngày, Tên
  quảng cáo, Lượt hiển thị, Người tiếp cận, Tần suất, Lượt click vào liên kết (or CTR), Số tiền đã
  chi tiêu, Kết quả. Export CSV. Vietnamese or English headers, "1.234,5" or "1,234.5" both work.
- **meta-ads MCP:** pull the same fields at ad level, daily, last 14 days; save as CSV with those
  headers and run the same script so the logic is identical either way.

```bash
node scripts/ads/fatigue-check.mjs export.csv
node scripts/ads/fatigue-check.mjs export.csv --freq 4 --min-impressions 3000   # retargeting / bigger budgets
```

## 2. What the statuses mean

| status | rule | do |
|---|---|---|
| 🔴 FATIGUED | ≥ 2 signals: frequency ≥ 3 · CTR −25% vs its first 3 days · CPM +30% · cost/result +30% | refresh this week |
| 🟡 WATCH | 1 signal | brief the replacement now, swap when a 2nd signal appears |
| 🟢 HEALTHY | none | leave it alone — changing a working ad resets learning |
| ⚪ NOT_ENOUGH_DATA | < 6 days or < 2,000 impressions in a window | **no conclusion**; say so |

Defaults suit prospecting. Retargeting tolerates higher frequency (`--freq 5`). Tell the user which
thresholds you used.

## 3. Turn signals into briefs

The script prints one line per signal. Expand each into a brief the team can shoot:

- **CTR fell** → the hook is tired. Same product and offer, new first 3 seconds. Hand to
  `ads-creative-lab` as a hook-only round.
- **Frequency high** → same message, new picture: other model/size, setting, format.
- **CPM rose** → the audience is used up; widen (broad/Advantage+), add placements. A new image
  alone will not fix it.
- **Cost/result rose but CTR held** → check the landing page and offer first (stock, size, ship
  fee, price matching the ad).

Write `brain/fatigue-<date>.md`: the table, the briefs, and the thresholds used.

## 4. Stop and ask

Propose which ads to pause and which replacements to launch. **Do not pause anything.** If the
meta-ads MCP is connected, present the exact calls you would make and wait for a yes.
