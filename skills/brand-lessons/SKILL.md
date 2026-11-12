---
name: brand-lessons
description: Apply what eight brands are known for to the user's own brand — Grab (finding insight, solving the customer's problem), Biti's Hunter (positioning and storytelling), PNJ (insight into a campaign that sells), Cocoon (brand and community), Vinamilk (brand strategy and repositioning), MoMo (growth and viral loops), Highlands Coffee (CRM and retention), Coca-Cola (cultural marketing and brand experience). Interviews the user, fills the method with their answers, and hands each piece to the skill that makes it. Use when the user says "học cách Grab tìm insight", "làm chiến dịch kiểu Biti's Hunter", "định vị thương hiệu", "tái định vị", "làm viral như MoMo", "giữ chân khách như Highlands", "xây cộng đồng như Cocoon", "marketing văn hoá", "insight khách hàng", "brand strategy", or names one of these brands as a model.
---

# Học từ 8 thương hiệu — phương pháp, không phải bản sao

Tám thương hiệu, mỗi cái được nhắc tới vì làm tốt **một** việc. Skill này lấy *cách làm* của
việc đó, hỏi người dùng từng câu, rồi áp vào thương hiệu của họ. Không chép khẩu hiệu, nhạc,
logo, nhân vật của ai; không đưa câu nào về Grab hay PNJ vào nội dung khi chưa có nguồn.

| Bài | Học từ | Khi người dùng muốn |
|---|---|---|
| `grab` | Grab | hiểu khách, tìm insight, sửa đúng chỗ khách khó chịu |
| `bitis-hunter` | Biti's Hunter | định vị cho một nhóm khách, kể chuyện thương hiệu |
| `pnj` | PNJ | biến insight thành chiến dịch có doanh thu, theo dịp |
| `cocoon` | Cocoon | đứng cho một giá trị, xây cộng đồng khách |
| `vinamilk` | Vinamilk | làm mới, đổi nhận diện, tái định vị |
| `momo` | MoMo | tăng trưởng, lan truyền, giới thiệu bạn bè, trò chơi theo mùa |
| `highlands` | Highlands Coffee | khách quay lại, chia nhóm khách, thành viên |
| `coca-cola` | Coca-Cola | gắn với dịp văn hoá, trải nghiệm khách tự tham gia |

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng 10–20 phút, cần người dùng chuẩn bị gì (vài bình luận hoặc đánh giá thật của khách là đủ). Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Chọn bài học | Người dùng đã gọi tên thương hiệu → dùng bài đó. Chưa → hỏi mục tiêu, chạy `--goal` | Nói mục tiêu bằng lời thường |
| 2. Đọc thương hiệu của người dùng | Đọc `KNOWLEDGE.md` nếu có; in phiếu bằng `brand-lesson.mjs --brand` | Bổ sung tên, sản phẩm, khách chính |
| 3. Hỏi từng câu | Hỏi lần lượt các câu trong phiếu, **một câu mỗi lượt** | Trả lời; dán bình luận, đánh giá, số liệu thật nếu có |
| 4. Điền phương pháp | Viết từng bước của phương pháp bằng câu trả lời của người dùng | Chọn khi có nhiều phương án |
| 5. Kiểm chứng | Mọi câu về thương hiệu mẫu phải có nguồn; không có thì bỏ khỏi nội dung | — |
| 6. Chuyển sang làm | Giao từng phần cho skill làm ra nó (bảng "Làm bằng kit" trong phiếu) | Duyệt bản nháp |

**Hay vướng:**
- Người dùng muốn "làm giống hệt Biti's Hunter" → lấy cách làm, không lấy MV, câu chữ, nghệ sĩ; nói rõ vì sao.
- Không có bình luận, đánh giá thật → insight chỉ là giả thuyết; ghi rõ và đề xuất cách thu (bình luận, khảo sát 3 câu).
- Trò chơi có thưởng, giảm giá → kiểm quy định khuyến mại hiện hành (`freshness-check`) và `ads-policy-check`.

## Quy trình chi tiết (cho agent)

### 1. Pick the lesson

```bash
node scripts/marketing/brand-lesson.mjs --list
node scripts/marketing/brand-lesson.mjs --goal "khách mua một lần rồi không quay lại"
```

`--goal` folds accents, so "giu chan khach" and "giữ chân khách" both land on `highlands`. Two
lessons combine well when one feeds the next: `grab` (insight) → `pnj` (campaign), `vinamilk`
(repositioning) → `bitis-hunter` (the story that carries it), `highlands` (who returns) → `momo`
(who brings a friend). More than two at once is a plan nobody finishes — suggest the order.

### 2. The worksheet

```bash
node scripts/marketing/brand-lesson.mjs --brand grab --brand pnj --business "Tiệm bánh Mây" --out brand/lesson-<date>.md
```

The worksheet holds: the method steps, the questions to ask, the kit route (skills, commands,
`VIDEO_GENRES` genres, frames), what to measure, common mistakes, and — under its own heading
— the case notes about the model brand marked **cần kiểm chứng**. Data:
`templates/BRAND_LESSONS.template.json`. Method and the reasoning behind each lesson:
`docs/32-bai-hoc-thuong-hieu.md`.

### 3. Interview — one question per message

Ask the worksheet's questions in order. Prefer evidence over opinion: when a question asks
what customers complain about, ask the user to paste real comments or run
`ads-comment-triage` on a comments export. Write each answer into the worksheet under
"Trả lời". An answer the user does not have stays blank and is reported as a gap.

### 4. Fill the method with their answers

Write each method step as a concrete sentence about THEIR brand — e.g. the `grab` insight line
"Khách muốn ___, nhưng ___, vì ___" filled from the pasted comments; the `bitis-hunter`
positioning sentence filled from the interview. Offer two or three options where the user has
to choose (positioning, the emotional territory, the campaign idea); do not decide for them.

### 5. Facts about the model brands

The case notes are what is commonly said, not sources. Content that names Grab, Biti's, PNJ,
Cocoon, Vinamilk, MoMo, Highlands or Coca-Cola needs a source the reader can check (official
page, reputable press), cited — otherwise leave the brand out and keep the method. Never use
their names, logos, music, slogans or characters as if they were the user's; never imply an
endorsement. Numbers about them (revenue, users, views) only from their own published reports.

### 6. Hand over

| Piece | Skill |
|---|---|
| Insight from comments, competitor gaps | `ads-comment-triage`, `competitor-analysis` |
| Positioning story, brand/customer story video | `story-video` (genres `brand-story`, `customer-story`, `legend`) |
| Campaign on a date, budget split | `promo-calendar`, then `ads-creative-lab` |
| Community, creator content | `ugc-koc-brief`, `repurpose` |
| New look, palette from the site | `design-campaign` (`theme-from-url.mjs`) |
| Growth loop, seasonal mechanic | `promo-calendar`, `topic-radar`, `ads-policy-check` |
| Retention segments | `audience-plan` (`rfm-segments.mjs`, consent + hashed only) |
| Did it work | `performance-review`, `ads-report` |

Anything that will be published still goes through `review-gate`; ad copy through
`ads-policy-check`.

## Output

`brand/lesson-<date>.md` in the user's project: the filled worksheet, the choices the user
made, the gaps still open, and the next skill to run. The agent publishes nothing and changes
no ad account from this skill.
