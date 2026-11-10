# 25 · Bảng màu theo ngành & chống "mùi AI" (Industry palettes, no AI slop)

> 🇻🇳 Tiếng Việt trước · English below.

## Dùng thế nào

```json
{ "theme": "ledger-green", "scenes": [ ... ] }
```

Một dòng trong `script.json` đổi màu **mọi** scene. Mỗi ngành trong
`templates/INDUSTRIES.template.json` đã được gán sẵn một preset — agent sinh ra từ
`bootstrap-content-agent` dùng luôn preset đó.

| preset | chất liệu & màu nhấn | ngành |
| --- | --- | --- |
| `graphite-signal` | than chì ấm · chữ ngà · **cam tín hiệu** | AI, công nghệ |
| `terminal-moss` | đen · chữ lân quang · **xanh rêu-chanh** | lập trình |
| `tomato-cream` | kem · nâu espresso · **đỏ cà chua** | TMĐT, ẩm thực, bán lẻ |
| `riso-pink` | giấy in riso · mực đen · **hồng huỳnh quang** | marketing, creator, làm đẹp |
| `terracotta-sand` | cát · nâu đất · **đất nung** | du lịch, lifestyle |
| `acid-night` | đen · trắng ngà · **vàng chanh axit** | game, esports |
| `newsprint-red` | giấy báo · mực đen · **đỏ nhà in** | tin tức |
| `ledger-green` | giấy sổ cái · **xanh chai** | tài chính, ngân hàng |
| `limestone-clay` | đá vôi · than · **đất sét nung** | bất động sản, kiến trúc |
| `clinic-sage` | trắng ngà · teal sâu · **xô thơm** | y tế, sức khoẻ |
| `oxblood-paper` | giấy bond · đen · **đỏ huyết dụ** | pháp lý, tư vấn |
| `chalk-marigold` | giấy phấn · navy · **vàng cúc vạn thọ** | giáo dục |
| `cobalt-slate` | giấy lạnh · xám đá · **xanh cobalt** | doanh nghiệp, B2B, SaaS |
| `archive-sepia` | giấy cũ · nâu đen | lịch sử, văn hoá |
| `safety-orange` | xám bê tông · đen · **cam bảo hộ** | logistics, sản xuất |
| `moss-paper` | giấy tái chế · **xanh rêu** | môi trường, nông nghiệp |

Các preset cũ (`paper-ink`, `paper-blue`, `paper-forest`, `corporate`, `luxury`,
`vox-editorial`) vẫn còn. Thương hiệu riêng: `node scripts/video/theme-from-url.mjs --url …`.

## "Mùi AI" trông như thế nào — và vì sao tránh

Người xem 2026 nhận ra video làm bằng AI qua bảng màu trước cả nội dung. Những dấu hiệu:

| dấu hiệu | thay bằng |
| --- | --- |
| gradient tím → xanh cyan, hồng → tím làm nền | **một chất liệu thật**: giấy, đá, than chì — màu đặc |
| chữ tô gradient (`background-clip: text`) | chữ một màu, nhấn bằng *một* từ đổi màu |
| glow neon quanh mọi thứ (`drop-shadow(0 0 30px …)`) | đổ bóng thật (có hướng, có độ mờ) hoặc không bóng |
| cầu vồng 5–6 màu trong một khung | **một họ màu nhấn** + 2–3 sắc trung tính |
| glassmorphism chồng nhiều lớp | một lớp, nền đặc |
| blob mờ trôi nổi làm nền | lưới, hạt giấy, sọc in — họa tiết có "vật liệu" |

Đây không phải sở thích: cùng một nội dung, khung kiểu biên tập (giấy + một màu nhấn) đọc
như *ai đó đã chọn*, khung neon đọc như *mặc định của công cụ*.

**Được kiểm tra bằng test.** `tests/trend-templates.test.mjs` từ chối chữ gradient, các mã
tím/cyan neon và glow filter trong bộ template trend; và yêu cầu mọi preset ngành có
`spread ≤ 18°` — tức là thật sự chỉ một họ màu. `theme-probe --selftest` bảo đảm tương phản
nền/chữ ≥ 4.5:1 cho mọi preset.

## Vì sao engine này hợp với cách làm đó

`scripts/video/lib/theme.mjs` không thay màu từng chỗ — nó dồn **mọi** màu của template vào
một dải hue hẹp quanh màu nhấn, giữ thứ tự (hai màu vốn khác nhau vẫn khác nhau), đảo sáng
tối khi cần. `spread` nhỏ = kỷ luật một màu nhấn. Vì vậy một preset đủ đổi cả 115 template.

---

## English

Sixteen industry palettes ship as theme presets (table above), one per vertical in
`INDUSTRIES.template.json`. Each pairs a real-material canvas with a single accent family —
the opposite of the "AI slop" look (violet→cyan gradients, gradient-filled type, neon glows,
rainbow accents, stacked glassmorphism). The theme engine squeezes every colour into a narrow
hue band, so a small `spread` *is* the one-accent rule. Guarded by
`tests/trend-templates.test.mjs` (no gradient text / neon violet-cyan / glow filters in the
trend set; every industry preset spread ≤ 18°) and `theme-probe --selftest` (bg/ink ≥ 4.5:1).
