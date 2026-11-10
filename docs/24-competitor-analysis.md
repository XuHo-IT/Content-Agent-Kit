# 24 · Phân tích đối thủ (Competitor analysis)

> 🇻🇳 Tiếng Việt trước · English below.

## Tóm tắt

```bash
node scripts/research/competitor-scan.mjs --channel @kenh-doi-thu --channel https://vnexpress.net/so-hoa --history brain/history.json
```

Không cần API key. Ra `brain/competitors/<ngày>.md` + `.json`, gồm năm phần:

| phần | trả lời câu hỏi |
| --- | --- |
| Tổng quan | đối thủ đăng bao nhiêu bài/tuần, view trung vị, like/view |
| Video bứt phá | video nào vượt ≥2× mức thường của **chính kênh đó** (outlier), video mới nào đang lên nhanh |
| Công thức tiêu đề | họ hay dùng số, câu hỏi, "cách…", "top N", VIẾT HOA, dấu "…" — và mẫu nào xuất hiện ở bài bứt phá |
| Lịch đăng | ngày và giờ (giờ Việt Nam) họ hay đăng |
| Khoảng trống chủ đề | cụm từ đối thủ dùng nhiều mà **bạn chưa từng làm** (so với `history.json`) |

## Nguồn dữ liệu và giới hạn — nói thẳng

| nguồn | lấy được | không lấy được |
| --- | --- | --- |
| Kênh YouTube (`@handle`, URL, `UC…`) | 15 video mới nhất, lượt xem, lượt like, giờ đăng | video cũ hơn 15 bài gần nhất, thời lượng, retention |
| Website có RSS/Atom (blog, báo, Substack, WordPress) | tiêu đề, giờ đăng, chuyên mục | lượt xem — RSS không công bố |
| Báo Việt theo chuyên mục (`vnexpress.net/so-hoa`, `tuoitre.vn/cong-nghe.htm`) | tự dò `/rss/<chuyên-mục>.rss` | như trên |
| TikTok (`tiktok:@kenh`), Instagram (`instagram:@kenh`) | **cần `APIFY_TOKEN`** (tuỳ chọn, trả phí): lượt xem, like, comment, giờ đăng các video gần nhất | không có token thì báo lỗi rõ ràng — YouTube/RSS vẫn chạy |
| Facebook | không — trang Facebook không có feed công khai ổn định | file export của bạn, hoặc MCP thư viện quảng cáo (`docs/18`) |

**Vì sao "bứt phá" so với chính kênh, không so view tuyệt đối:** kênh 5 triệu sub có video
"tệ" vẫn hơn video "hay nhất" của kênh nhỏ. So với trung vị của chính kênh mới cho biết
khán giả *của họ* thích cái gì hơn bình thường — đó là tín hiệu nội dung, không phải tín
hiệu quy mô. Đây cũng là cách các công cụ "outlier score" thương mại tính.

**Vì sao tách "đang lên":** view/ngày luôn cao ở video mới đăng (view giảm dần theo tuổi),
nên tốc độ chỉ được tin khi video dưới 7 ngày tuổi, và được dán nhãn "đang lên" chứ không
phải "hit".

**Vì sao cụm hai từ:** tiếng Việt viết theo âm tiết — "trí tuệ nhân tạo" là bốn token. Đếm
từ đơn cho ra "trí", "tuệ" vô nghĩa, nên báo cáo đếm cụm hai âm tiết, và chỉ giữ từ đơn khi
nó là tên riêng (OpenAI, iPhone, GPT5).

## Công cụ mã nguồn mở nên biết (không đóng gói vào kit)

Khảo sát tháng 11/2026. Chỉ liệt kê giấy phép cho phép dùng; **không** vendor mã của họ.

| công cụ | giấy phép | dùng khi |
| --- | --- | --- |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Unlicense | cần toàn bộ lịch sử kênh: `yt-dlp --flat-playlist -J <kênh>` |
| [LuanRT/YouTube.js](https://github.com/LuanRT/YouTube.js) | MIT | client Node cho InnerTube: tìm kiếm, trending, transcript |
| [Evil0ctal/Douyin_TikTok_Download_API](https://github.com/Evil0ctal/Douyin_TikTok_Download_API) | Apache-2.0 | tự host làm `SOCIAL_API_BASE` cho `social-fetch.mjs --analyze` |
| [JuneYaooo/rea-video](https://github.com/JuneYaooo/rea-video) | Apache-2.0 | mổ xẻ video đối thủ theo từng shot, ra kế hoạch làm lại |
| [towfiqi/serpbear](https://github.com/towfiqi/serpbear) | MIT | theo dõi thứ hạng Google của bạn và đối thủ |
| [harlan-zw/unlighthouse](https://github.com/harlan-zw/unlighthouse) | MIT | chấm SEO/tốc độ toàn site đối thủ: `npx unlighthouse --site <url>` |
| [lissy93/web-check](https://github.com/lissy93/web-check) | MIT | xem đối thủ dùng công nghệ, hosting, tracker gì |
| [umami-software/umami](https://github.com/umami-software/umami) | MIT | analytics tự host cho trang của chính bạn |

Tránh vendor: AGPL (postiz, firecrawl), GPL (TikTokDownloader), giấy phép phi thương mại
(MediaCrawler). Chạy chúng như một dịch vụ riêng thì được; chép mã vào repo MIT thì không.

---

## English

Keyless competitor scan: YouTube channels via the public Atom feed (15 newest uploads with
view and like counts) and any site with RSS/Atom. Reports cadence, breakouts measured against
the channel's **own** median (outliers) plus fast-rising uploads under 7 days old, title
devices overall vs. in breakouts, posting slots in a chosen timezone, and topic gaps against
the caller's `history.json`. Vietnamese-aware: bigram phrases (Vietnamese is written in
syllables), Unicode-aware word matching (JavaScript's `\b` is ASCII-only), and automatic
discovery of Vietnamese news-section feeds. TikTok and Instagram work through Apify
actors when `APIFY_TOKEN` is set (`tiktok:@x`, `instagram:@x`, or profile URLs) — optional and
paid; Facebook stays out of scope (see `docs/18` for the ad-library MCP route).

Skill: `skills/competitor-analysis/SKILL.md`. Code: `scripts/research/competitor-scan.mjs`,
`scripts/research/lib/competitors.mjs`. Tests: `tests/competitors.test.mjs`.
