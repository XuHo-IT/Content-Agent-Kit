# Video mẫu theo ngành

Tám video ngắn 9:16, mỗi video một ngành, mỗi ngành một bảng màu (`theme`) lấy từ
[`templates/INDUSTRIES.template.json`](../../templates/INDUSTRIES.template.json). Tất cả được
bộ kit tự làm từ `script.json` trong từng thư mục: khung hình động, giọng đọc tiếng Việt
(OmniVoice, chạy trên máy), chuyển cảnh và nhạc nền.

| ngách | bảng màu | khung hình dùng |
|---|---|---|
| [`cong-nghe-ai`](cong-nghe-ai/) | `graphite-signal` | word-pop → compare-wipe → exploded-layers → outro |
| [`tai-chinh`](tai-chinh/) | `ledger-green` | search-morph → stat-odometer → myth-fact → outro |
| [`thuong-mai-dien-tu`](thuong-mai-dien-tu/) | `tomato-cream` | phone-notifs → product-reveal → price-drop |
| [`giao-duc`](giao-duc/) | `chalk-marigold` | comment-reply → step-list → checklist → outro |
| [`tin-tuc`](tin-tuc/) | `newsprint-red` | word-pop → checklist → myth-fact → outro |
| [`du-lich`](du-lich/) | `terracotta-sand` | search-morph → timeline-flight → outro |
| [`y-te`](y-te/) | `clinic-sage` | comment-reply → step-list → myth-fact → outro |
| [`bat-dong-san`](bat-dong-san/) | `limestone-clay` | word-pop → step-list → live-poll → outro |

**Nội dung là ví dụ minh hoạ.** Mẹo và kiến thức phổ thông, không phải tin tức; con số duy nhất
(lãi kép ở `tai-chinh`) là phép tính có ghi rõ giả định. Sản phẩm ở `thuong-mai-dien-tu` là
sản phẩm minh hoạ, không phải hàng thật.

Không đốt phụ đề vào các video này: chữ quan trọng đã nằm trong khung hình động, phụ đề đè lên
sẽ thành hai lớp chữ chồng nhau. Phụ đề sáng từng từ dành cho cảnh quay thật — xem
[`../talking-head-demo/`](../talking-head-demo/).

## Làm lại

```bash
node examples/niche-samples/make-scripts.mjs                         # ghi 8 script.json
node scripts/video/render.mjs examples/niche-samples/tai-chinh/script.json
node scripts/video/make-preview.mjs examples/niche-samples/tai-chinh/video.mp4 \
     --mp4 examples/niche-samples/tai-chinh/video.mp4                 # preview.webp + bản nén 540p
```

Mỗi thư mục chỉ giữ `script.json`, `video.mp4` (bản nén 540×960) và `preview.webp`; các file
tạm của lần render (clip từng scene, giọng đọc) đã xoá theo quy ước của kit.
