---
name: catalog-feed-audit
description: Audit a Meta product catalog feed (CSV/TSV from Haravan, Sapo, Shopify, WooCommerce or a sheet) before running Advantage+ catalog / dynamic product ads for a fashion shop — missing required fields, price format "199000 VND", sale_price not below price, duplicate ids, size/color variants without item_group_id, ALL-CAPS or promo-stuffed titles, http or placeholder images, invalid gender/age_group. Use when the user says "catalog", "danh mục sản phẩm", "feed sản phẩm", "quảng cáo động", "DPA", "Advantage+ catalog", "sản phẩm bị từ chối trong Commerce Manager", "retarget người xem sản phẩm". Reads the file only.
---

# Catalog feed audit — a catalog ad is only as good as its feed

Dynamic/catalog ads retarget people with the exact items they viewed. For fashion that is
usually the highest-ROAS campaign in the account — **if** the feed is right. A wrong feed fails
silently: five carousel cards of the same shirt in different sizes, an image that is a
placeholder, a sale price Meta rejects.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Lấy file feed | Nhận file CSV/TSV sản phẩm xuất từ web bán hàng hoặc link feed trong Commerce Manager | Xuất file sản phẩm và gửi |
| 2. Soát | Chạy `node scripts/ads/feed-audit.mjs catalog.csv` — lỗi (bị từ chối) và cảnh báo | — |
| 3. Sửa lỗi trước | Thiếu trường, giá sai dạng (`199000 VND`), id trùng, giá giảm ≥ giá gốc | — |
| 4. Gom biến thể | Mọi size/màu của một mẫu phải chung `item_group_id` | — |
| 5. Bảng sửa | Đưa bảng sửa để làm trên web bán hàng (sửa CSV tay sẽ bị ghi đè lần đồng bộ sau) | Sửa trên web bán hàng |
| 6. Dừng | Không tự tải hay sửa catalog trên Meta | Đồng bộ lại catalog khi đã sửa |

**Hay vướng:**
- Sửa trực tiếp file CSV → lần đồng bộ sau mất hết; sửa ở nơi sinh ra feed.
- Tên sản phẩm viết HOA hoặc nhồi "SALE/FREESHIP" → ưu đãi để ở `sale_price` và trong chữ quảng cáo.
- Quảng cáo động báo "không có sản phẩm hợp lệ" → kiểm `content_ids` của pixel có trùng `id` trong feed không.

## 1. Get the feed

Export products from the shop platform as CSV, or download the feed URL Commerce Manager uses.
Column names must follow Meta's spec (`id, title, description, availability, condition, price,
link, image_link, brand`, plus for apparel `item_group_id, size, color, gender, age_group`,
`sale_price`, `additional_image_link`).

```bash
node scripts/ads/feed-audit.mjs catalog.csv            # exit 2 if any error
node scripts/ads/feed-audit.mjs catalog.csv --json > feed-issues.json
```

## 2. Fix order

1. **Errors** — rejected items: missing fields, bad price format (`199000 VND`, not `199.000đ`),
   duplicate ids, sale_price ≥ price, invalid availability/gender values.
2. **Variants** — every size/color of one design shares one `item_group_id`, and no two rows in a
   group share both size and color. This is what makes the carousel show five *designs*.
3. **Warnings** — titles: product type first, ≤ 65 visible characters, no ALL CAPS, no
   "SALE/FREESHIP" (offers belong in `sale_price` and in the ad's text). Images: https, real
   product, ideally a clean background for the main image plus lifestyle shots in
   `additional_image_link`.

Give the user the fixes as a table they can apply on the shop platform (that is where the feed is
generated — editing the CSV by hand gets overwritten at the next sync).

## 3. Then

- Discounts over 50% are flagged against the VN promotion cap — confirm with `ads-policy-check`.
- Suggest product sets for fashion: by category, by price band, "new in 30 days", "bán chạy",
  "sắp hết size" — each set is a separate catalog ad with its own angle.
- Pixel/CAPI must send `content_ids` that match the feed's `id`; mismatched ids are the commonest
  reason catalog retargeting shows "no eligible items". Checklist in `docs/28-facebook-ads.md`.

Never upload or edit the catalog on the user's behalf without an explicit yes.
