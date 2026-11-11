# ads-samples — dữ liệu MINH HOẠ / illustrative data

Mọi file ở đây là **dữ liệu giả lập** để chạy thử các script trong `scripts/ads/`. Không phải số
liệu của thương hiệu nào; số điện thoại nằm trong dải 0900 000 xxx, email dùng `example.com`, tên
shop "Mây" là tên giả. Đừng dùng các con số này làm benchmark.

All files are **synthetic**. Not any brand's numbers; do not use them as benchmarks.

| file | chạy với |
|---|---|
| `ads-daily-export.csv` | `node scripts/ads/fatigue-check.mjs examples/ads-samples/ads-daily-export.csv` — tiêu đề tiếng Việt, số kiểu "1.234,5" |
| `comments.csv` | `node scripts/ads/comment-triage.mjs examples/ads-samples/comments.csv --brand "Mây"` |
| `ad-copy.txt` | `node scripts/ads/policy-lint.mjs examples/ads-samples/ad-copy.txt` |
| `catalog.csv` | `node scripts/ads/feed-audit.mjs examples/ads-samples/catalog.csv` — cố ý chứa lỗi |
| `orders.csv` | `node scripts/ads/rfm-segments.mjs examples/ads-samples/orders.csv --today 2026-11-11` |
| `creative-plan.json` | `node scripts/ads/creative-matrix.mjs examples/ads-samples/creative-plan.json --max 12` |
