# 32 · Học từ 8 thương hiệu — insight, định vị, chiến dịch, cộng đồng, tăng trưởng, giữ chân, văn hoá

> English summary at the end.

Người làm marketing hay được khuyên "học Grab cách tìm insight", "học Biti's Hunter cách kể
chuyện". Lời khuyên đúng, nhưng thứ đáng học là **cách làm**, không phải chiến dịch. Chép một MV
hay một khẩu hiệu không làm thương hiệu của bạn mạnh lên; dùng lại *quy trình* đã tạo ra chúng
thì có thể.

Kit đóng gói tám bài học thành phiếu bài tập:

```bash
node scripts/marketing/brand-lesson.mjs --list
node scripts/marketing/brand-lesson.mjs --goal "muốn khách quay lại mua lần hai"
node scripts/marketing/brand-lesson.mjs --brand grab --business "Tiệm bánh Mây" --out lesson.md
```

Skill: [`skills/brand-lessons`](../skills/brand-lessons/SKILL.md). Dữ liệu:
[`templates/BRAND_LESSONS.template.json`](../templates/BRAND_LESSONS.template.json).

## Tám bài, một thứ tự

Tám bài không ngang hàng — chúng nối thành một chuỗi. Bắt đầu từ chỗ đang yếu nhất:

```
hiểu khách ─▶ đứng ở đâu ─▶ kể gì ─▶ bán thế nào ─▶ ai ở lại ─▶ ai kéo thêm người
  Grab       Biti's Hunter  Biti's   PNJ            Highlands    MoMo
             Vinamilk (khi phải làm mới)
                            Cocoon (khi khách là người kể) · Coca-Cola (khi có một dịp văn hoá)
```

| Bài | Học từ | Cốt lõi | Đầu ra trong kit |
|---|---|---|---|
| Insight & giải quyết vấn đề | **Grab** | "Khách muốn ___, nhưng ___, vì ___" — từ bình luận thật; sửa sản phẩm trước, quảng cáo sau | `ads-comment-triage`, `competitor-analysis`, video `comment-reply` |
| Định vị & storytelling | **Biti's Hunter** | Một nhóm khách, một vùng cảm xúc, nhiều câu chuyện nối thành chuỗi | `story-video` (`brand-story`, `customer-story`) |
| Insight → chiến dịch → doanh thu | **PNJ** | Insight · ý tưởng lớn · thứ cụ thể để mua · đúng dịp · đo bằng tiền | `promo-calendar`, `ads-creative-lab`, `ads-report` |
| Thương hiệu & cộng đồng | **Cocoon** | Giá trị chứng minh được; nghi thức để khách làm cùng nhau; khách nói thay mình | `ugc-koc-brief`, `repurpose`, `comment-story` |
| Brand strategy & tái định vị | **Vinamilk** | Giữ tài sản khách đã nhớ, đổi phần đã cũ, nói rõ vì sao đổi, đổi đồng loạt | `competitor-analysis`, `design-campaign` |
| Growth & viral | **MoMo** | Phễu AARRR, vòng giới thiệu ít chạm, gắn dịp văn hoá; K = lời mời × tỷ lệ nhận | `promo-calendar`, `topic-radar`, `performance-review` |
| CRM & giữ chân | **Highlands Coffee** | RFM → hành trình theo nhóm → thưởng theo thói quen → đo theo cohort | `audience-plan` (`rfm-segments.mjs`) |
| Cultural marketing & trải nghiệm | **Coca-Cola** | Khoảnh khắc văn hoá có thật, vai tự nhiên của thương hiệu, khách tự tay tham gia | `promo-calendar`, `story-video`, `design-campaign` |

Mỗi bài trong file dữ liệu có: phương pháp từng bước, câu hỏi cho chủ thương hiệu, đường đi
trong kit (skill, lệnh, thể loại video, khung hình), chỉ số đo, lỗi hay gặp, và **ghi chú về
thương hiệu mẫu — cần kiểm chứng**.

## Ba công cụ dùng chung

**Câu insight.** "Khách muốn ___, nhưng ___, vì ___." Vế "nhưng" là mâu thuẫn; không có mâu
thuẫn thì chỉ là mô tả khách. Insight phải có bằng chứng — bình luận, tin nhắn, đánh giá thấp —
và khi đọc lên, khách thật phải nói "đúng là vậy".

**Câu định vị.** "Với [nhóm khách], [thương hiệu] là [loại sản phẩm] giúp [lợi ích chính], vì
[lý do để tin]." Mỗi ô một cụm. Có chữ "và" trong một ô là chưa chọn.

**Chuỗi chiến dịch.** Insight → ý tưởng lớn (một câu) → thứ cụ thể để mua (bộ sưu tập, combo,
ưu đãi có giá gốc) → kênh và lịch (trước dịp · đúng dịp · sau dịp) → con số đặt trước khi chạy.

## Quy tắc về sự thật

Kit cấm bịa (`docs/03`). Với tám thương hiệu mẫu, điều đó có nghĩa:

- **Ghi chú về thương hiệu mẫu không phải nguồn.** Đó là điều thường được kể. Muốn nhắc Grab hay
  PNJ trong một bài đăng, tìm trang chính thức hoặc báo uy tín và ghi nguồn; không có thì bỏ tên
  thương hiệu, giữ phương pháp.
- **Không có con số nào về họ** — doanh thu, người dùng, lượt xem — trừ khi lấy từ báo cáo họ
  tự công bố.
- **Không mượn tài sản của họ**: tên, logo, nhạc, khẩu hiệu, nhân vật, nghệ sĩ đã hợp tác. Không
  ngụ ý họ bảo trợ. Đây là chuyện quyền sở hữu trí tuệ và chính sách quảng cáo, không chỉ phép lịch sự.
- **Khuyến mại có thưởng** (trò chơi, quay số, quà giới thiệu): kiểm quy định hiện hành bằng
  `freshness-check` trước khi chạy — quy định thay đổi, kit không đoán.
- **Dữ liệu khách** cho bài giữ chân: chỉ khi khách đồng ý (Nghị định 13/2023/NĐ-CP), chỉ xuất
  bản đã băm.

## Ví dụ: tiệm bánh nhỏ, khách mua một lần rồi thôi

1. `--goal "khách mua một lần rồi không quay lại"` → `highlands`.
2. Phiếu hỏi: danh sách khách có đồng ý không, bao lâu khách mua lại, có gì ngoài giảm giá.
3. Xuất đơn hàng ra CSV → `rfm-segments.mjs` chia nhóm (VIP, Trung thành, Mới, Tiềm năng, Sắp
   rời, Ngủ đông); nhóm **Mới** (mới mua lần đầu) và **Ngủ đông** là nơi cần làm.
4. Thiếu lý do khách không quay lại → quay về bài `grab`: hỏi 5 khách đó một câu.
5. Ra kế hoạch: tin nhắn thứ hai sau 10 ngày, quà cho lần mua thứ hai, video `customer-story`
   từ một khách quen thật (có cho phép). Đo tỷ lệ mua lại sau 30 ngày.

---

## English summary

Eight marketing lessons, each named after a brand known for one skill: **Grab** (customer
insight, fixing the real problem), **Biti's Hunter** (positioning, storytelling), **PNJ**
(insight → campaign → revenue), **Cocoon** (values and community), **Vinamilk** (brand strategy,
repositioning), **MoMo** (growth loops, viral mechanics), **Highlands Coffee** (CRM, retention),
**Coca-Cola** (cultural marketing, brand experience).

What the kit teaches is the *method*, never a copy of a campaign.
`scripts/marketing/brand-lesson.mjs` lists the lessons, suggests one from a goal written in
plain Vietnamese (accent-insensitive), and prints a worksheet: method steps, interview
questions, the kit route (skills, scripts, `VIDEO_GENRES` genres, frames), metrics, pitfalls,
and the commonly-told case notes about the model brand under a **needs verification** heading.
Those notes are not sources: a claim about one of these brands reaches published content only
with a citation; no figures about them except from their own reports; no use of their names,
logos, music or slogans as the user's own. The `brand-lessons` skill runs the interview one
question at a time and hands each piece to the skill that makes it.
