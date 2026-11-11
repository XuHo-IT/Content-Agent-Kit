---
name: audience-plan
description: Plan Facebook/Instagram audiences for a fashion shop from its own customer data — RFM segments from an orders export (VIP, trung thành, mới, tiềm năng, sắp rời, ngủ đông), SHA-256-hashed custom-audience upload files, lookalike seeds, exclusions, and which segment gets which message. Use when the user says "tệp khách hàng", "custom audience", "lookalike", "tệp tương tự", "retarget khách cũ", "chăm sóc khách cũ", "khách lâu không mua", "phân nhóm khách hàng", "RFM". Never uploads anything; hashes personal data before it touches a file.
---

# Audience plan — the shop's customer list is its best targeting

Broad targeting finds new buyers; the shop's own buyers are who should get the new collection
first, who seed lookalikes, and who must be **excluded** from "khách mới" campaigns so the budget
is not spent selling to people who already buy.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Hỏi sự đồng ý | Hỏi shop có được khách đồng ý dùng SĐT/email cho quảng cáo không (Nghị định 13/2023); không có thì dừng | Xác nhận có hoặc không |
| 2. Nhận file đơn hàng | Cần mỗi dòng một đơn: SĐT và/hoặc email, ngày mua, giá trị đơn | Xuất file đơn từ Haravan/Sapo/KiotViet/Pancake… |
| 3. Chia nhóm | Chạy `node scripts/ads/rfm-segments.mjs orders.csv --out audiences/` — VIP, trung thành, mới, sắp rời, ngủ đông… | — |
| 4. Kế hoạch tệp | Bảng: nhóm nào nhận thông điệp gì, nhóm nào làm nguồn tệp tương tự, nhóm nào loại trừ | Đọc và chỉnh |
| 5. Dừng — người dùng tự tải lên | File trong `audiences/` chỉ chứa mã băm SHA-256, không có SĐT thật | Tự tải lên Ads Manager, rồi xoá file đơn gốc |

**Hay vướng:**
- Dán danh sách khách vào chat → không làm vậy; đưa đường dẫn file để script đọc trên máy.
- Nhóm dưới ~100 người → Meta không chạy được; dùng làm tệp loại trừ hoặc gộp nhóm.
- SĐT viết đủ kiểu (`0912…`, `+84…`) → script tự chuẩn hoá, không cần sửa tay.

## 1. Privacy first — before opening the file

- Customers' phone and email are personal data under **Nghị định 13/2023/NĐ-CP**. Ask the user to
  confirm the shop has consent to use them for advertising. If not, stop here and say why.
- The script writes **only SHA-256 hashes** of normalised email/phone. Never paste raw customer
  lists into chat, a doc, or a commit. Delete the export after use.

## 2. Segment

```bash
node scripts/ads/rfm-segments.mjs orders.csv --today 2026-11-11
node scripts/ads/rfm-segments.mjs orders.csv --out audiences/    # one hashed CSV per segment
```

Input: one row per order with phone and/or email, order date, order value (export from Haravan,
Sapo, KiotViet, Pancake, Shopify…). Phones in any form (`0912 345 678`, `+84…`) are normalised to
`84912345678` before hashing, as Meta's matching expects.

Scores are quintiles **within this shop**, so cut-offs fit the business, not a textbook.

## 3. The plan

| segment | use it to | message |
|---|---|---|
| VIP | early access, lookalike 1% seed | BST mới trước khi mở bán, quà — no discount needed |
| Trung thành | upsell, lookalike seed | phối đồ / combo |
| Mới | second order within 30 days | món phối cùng món đã mua |
| Tiềm năng | cross-sell | set đồ, review thật |
| Sắp rời | win-back | hàng mới về + lý do quay lại; ưu đãi nhẹ có hạn |
| Ngủ đông | **exclude** from prospecting | one win-back attempt, then stop |
| all buyers (180 days) | **exclude** from "khách mới" campaigns | — |

Also propose engagement audiences that need no customer data: video viewers 50%+ (30 days),
page/IG engagers (90 days), Messenger contacts, add-to-cart without purchase (14 days).

Segments under ~100 matched people cannot be delivered to — use them as exclusions or merge them.

## 4. Stop and ask

Output the segment table, the audience list (names in the form `CA_VIP_261111`), and the
campaign ↔ audience map. Uploading files and creating audiences in Ads Manager is the user's
step; with the meta-ads MCP, show the calls and wait for a yes.
