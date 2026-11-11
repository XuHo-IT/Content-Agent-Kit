# 28 — Facebook ads với Claude / Facebook ads with Claude

## Tiếng Việt

Câu hỏi hay gặp nhất của một team marketing thời trang khi đã có quy trình *nghiên cứu → làm
content → lên ads → canh tắt → báo cáo*: **"còn dùng Claude vào việc gì nữa?"** Trả lời ngắn: năm
bước đó chỉ là phần nổi. Giữa chúng có ít nhất mười việc lặp đi lặp lại, tốn giờ người, và làm
bằng script + skill thì nhanh hơn, đều hơn, để lại dữ liệu cho lần sau.

Tài liệu này là bản đồ: mỗi giai đoạn của công việc Facebook ads → skill hoặc script nào lo.
Tất cả chạy được **không cần** kết nối MCP quảng cáo (dán số hoặc xuất CSV từ Ads Manager); có
`meta-ads` MCP (`docs/18-ads-and-marketing.md`) thì đọc số trực tiếp. **Không skill nào tự
tạo, sửa, tắt quảng cáo hay đăng bình luận** — chúng đề xuất, rồi dừng lại hỏi.

### Bản đồ

| giai đoạn | đã có trong quy trình | thêm được với kit này |
|---|---|---|
| Nghiên cứu | đối thủ, sản phẩm, khách hàng | `competitor-analysis` (kênh/trang đối thủ, chủ đề đang nổ) · `topic-radar` (đang hot gì) · **`audience-plan`** (phân nhóm khách cũ từ đơn hàng — RFM) · thư viện quảng cáo đối thủ (mục *Ad Library* dưới) |
| Lên kế hoạch | — | **`promo-calendar`** (lịch sale VN: Tết, 8/3, 9/9…12/12, Black Friday — ngày warm-up, cao điểm, chia ngân sách theo tháng) |
| Làm content | viết bài, đăng fanpage | `create-video` (video 9:16 có giọng đọc) · `design-campaign` (ảnh/carousel) · `repurpose` (1 bài → nhiều định dạng) · **`ugc-koc-brief`** (brief KOC/UGC + quyền sử dụng) |
| Kiểm tra trước khi chạy | — | **`ads-policy-check`** (câu "Bạn béo bụng?", trước/sau, "rẻ nhất", giảm sâu cần kiểm tra hạn mức…) · `review-gate` · **`catalog-feed-audit`** (feed sản phẩm cho quảng cáo động) |
| Lên ads | tạo chiến dịch | **`ads-creative-lab`** (ma trận hook × góc × định dạng, đặt tên chuẩn, cấu trúc test ABO → scale) · **`audience-plan`** (tệp custom audience đã băm, lookalike, loại trừ) |
| Vận hành hằng ngày | canh tắt ads | **`ads-fatigue-watch`** (phát hiện mẫu đuối *trước* khi đốt tiền) · **`ads-comment-triage`** (lọc & soạn trả lời bình luận: hỏi size/giá/ship, khiếu nại, spam) |
| Báo cáo | báo cáo | `ads-report` (báo cáo → quyết định làm gì tiếp) · `ads-creative-lab` §3 (đọc kết quả test theo tên quảng cáo) |
| Lặp lại | — | thắng → `ads-creative-lab` §4 làm vòng mới · đuối → brief làm mới · câu hỏi lặp lại trong bình luận → FAQ/auto-reply |

### Lệnh nhanh

```bash
node scripts/ads/creative-matrix.mjs plan.json --max 12          # ma trận test + tên quảng cáo
node scripts/ads/fatigue-check.mjs export.csv                    # mẫu nào đang đuối
node scripts/ads/comment-triage.mjs comments.csv --brand "Shop"  # lọc bình luận + nháp trả lời
node scripts/ads/policy-lint.mjs ads.txt                         # soát chính sách trước khi chạy
node scripts/ads/feed-audit.mjs catalog.csv                      # soát feed sản phẩm
node scripts/ads/rfm-segments.mjs orders.csv --out audiences/    # phân nhóm khách + file đã băm
node scripts/ads/promo-plan.mjs --quarter 2027-Q1 --budget 60000000
```

Dữ liệu mẫu (giả lập) để chạy thử: `examples/ads-samples/`.

### Những việc khác đáng làm (chưa có script — làm bằng skill/hội thoại)

- **Ad Library đối thủ.** Mở Meta Ad Library, lọc trang đối thủ, xuất/ chép danh sách quảng
  cáo đang chạy. Quảng cáo **chạy lâu** (30+ ngày) gần như chắc chắn đang có lãi — đó là tín hiệu
  rõ nhất về góc nào hiệu quả. Đưa danh sách cho `competitor-analysis` để rút *cơ chế* (hook,
  góc, offer) — **không** chép câu chữ hay hình.
- **Khớp quảng cáo ↔ trang đích.** Chụp trang sản phẩm (`scripts/media/screenshot.mjs`), so với
  quảng cáo: giá, màu, size còn hàng, phí ship, ưu đãi có giống không. Quảng cáo CTR tốt mà
  không ra đơn thường hỏng ở đây chứ không ở creative.
- **Pixel / Conversions API.** Checklist: sự kiện `ViewContent`, `AddToCart`, `InitiateCheckout`,
  `Purchase` đều bắn; `Purchase` có `value` + `currency=VND`; `content_ids` trùng `id` trong
  catalog; có deduplication (`event_id`) khi chạy cả pixel lẫn CAPI; Event Match Quality ≥ 6.
  Sai `content_ids` là lý do phổ biến nhất khiến quảng cáo động báo "không có sản phẩm hợp lệ".
- **Kịch bản inbox / Messenger.** Shop thời trang VN chốt đơn qua tin nhắn. Từ kết quả
  `ads-comment-triage`, viết bộ câu trả lời nhanh (size theo chiều cao/cân nặng, phí ship, đổi
  trả) và luồng hỏi size → gợi ý → chốt; giữ câu trả lời trong `KNOWLEDGE.md` để mọi người dùng
  chung một nguồn.
- **UTM & quy ước đặt tên.** `utm_source=facebook&utm_medium=paid&utm_campaign=<campaign>&utm_content=<ad_name>`
  — dùng đúng tên do `creative-matrix.mjs` sinh ra để GA4/website đọc được kết quả theo hook/góc.
- **Ngân sách & quy tắc tự động.** Đề xuất (không bật) quy tắc trong Ads Manager: tắt quảng cáo
  khi chi ≥ 2× CPA mục tiêu mà 0 đơn; báo khi tần suất > 3. Người dùng tự bật.

### Ranh giới

- Số liệu không bịa: thiếu dữ liệu thì ghi "chưa đủ dữ liệu".
- Dữ liệu khách hàng: chỉ dùng khi có đồng ý (Nghị định 13/2023/NĐ-CP); chỉ ghi ra file dạng băm SHA-256.
- Pháp lý: các skill nêu quy định một cách thận trọng và luôn ghi *không phải tư vấn pháp lý*.
- Tài khoản quảng cáo thật: mọi thao tác ghi (tạo, sửa, tắt, đổi ngân sách, ẩn bình luận) là
  quyết định của người dùng.

---

## English

The question a fashion marketing team asks once it has *research → content → launch ads →
pause/watch → report*: **what else can Claude do?** Those five steps are the visible part. Between
them sit a dozen recurring jobs that eat hours, and each is faster and more consistent as a
script plus a skill that leaves data behind for next time.

### Map

| stage | usual process | added by this kit |
|---|---|---|
| Research | competitors, product, customers | `competitor-analysis` · `topic-radar` · **`audience-plan`** (RFM segments from orders) · competitor Ad Library (below) |
| Planning | — | **`promo-calendar`** (Vietnamese retail calendar → warm-up/peak dates, monthly budget split) |
| Content | posts on the page | `create-video` · `design-campaign` · `repurpose` · **`ugc-koc-brief`** (creator briefs + usage rights) |
| Pre-flight | — | **`ads-policy-check`** · `review-gate` · **`catalog-feed-audit`** |
| Launch | create campaigns | **`ads-creative-lab`** (hook × angle × format matrix, parseable names, ABO test → scale) · **`audience-plan`** (hashed custom audiences, lookalike seeds, exclusions) |
| Daily ops | watch & pause | **`ads-fatigue-watch`** (catch decline before it burns budget) · **`ads-comment-triage`** (size/price/ship questions, complaints, scam links) |
| Reporting | report | `ads-report` · `ads-creative-lab` §3 (read tests by ad name) |
| Iterate | — | winners → new round; fatigue → refresh brief; repeated questions → FAQ/auto-reply |

Every script is offline, keyless and read-only (`--help` on each). Synthetic sample inputs live in
`examples/ads-samples/`.

### Other high-value work (doc-only)

- **Competitor Ad Library** — long-running ads (30+ days) are the clearest signal of what pays;
  extract the mechanism, never copy the words or images.
- **Ad ↔ landing match** — screenshot the product page and compare price, colours, sizes in stock,
  shipping fee and offer with the ad. Good CTR with no orders usually breaks here.
- **Pixel / Conversions API health** — all four commerce events fire; Purchase carries value +
  VND; `content_ids` match catalog `id`; `event_id` dedup between pixel and CAPI; Event Match
  Quality ≥ 6.
- **Messenger scripts** — Vietnamese fashion closes in the inbox; turn triaged questions into
  saved replies and a size-advice flow, kept in `KNOWLEDGE.md`.
- **UTM + naming** — `utm_content=<ad_name>` using the names `creative-matrix.mjs` produces.
- **Automated rules** — propose, never enable: pause at 2× target CPA with no purchase; alert at
  frequency > 3.

### Boundaries

No invented numbers; customer data only with consent (Decree 13/2023) and only hashed on disk;
law stated conservatively and never as legal advice; every write to a live ad account is the
user's decision.
