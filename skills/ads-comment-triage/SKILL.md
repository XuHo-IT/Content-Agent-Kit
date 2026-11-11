---
name: ads-comment-triage
description: Sort comments on Facebook ads and fanpage posts by what the commenter wants — hỏi size, hỏi giá, hỏi ship, còn hàng, muốn mua/xin inbox, khiếu nại, spam/lừa đảo link, nhắc đối thủ, khen — and draft replies in the brand's voice for review, including unaccented teencode ("sz m con k", "giá bn", "ib e"). Use when the user says "trả lời bình luận", "lọc comment", "comment ads nhiều quá", "ẩn comment spam", "khách hỏi giá dưới quảng cáo", "reply comments", "moderate comments". Drafts only; never posts, hides or deletes.
---

# Comment triage — every unanswered "giá bn?" under an ad is a lost order

An ad with 300 comments is 300 people who raised their hand. The money is in answering the
size/price/stock ones fast, the reputation is in catching complaints and scam links first.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Lấy bình luận | Nhận bình luận dán vào chat, hoặc file CSV/`.txt` (mỗi dòng một bình luận) | Dán bình luận hoặc gửi file xuất từ fanpage |
| 2. Phân loại | Chạy `node scripts/ads/comment-triage.mjs comments.csv --brand "Tên shop"` — chia theo hỏi size/giá/ship, khiếu nại, spam… | Cho biết tên shop |
| 3. Đọc lại nhóm gấp | Tự đọc từng bình luận P1 (khiếu nại, spam) vì máy có thể hiểu sai câu mỉa mai | — |
| 4. Điền câu trả lời | Thay `[GIÁ]`, `[LINK/ẢNH]`, `[PHÍ]` bằng thông tin trong `KNOWLEDGE.md`; thiếu thì không đoán | Gửi bảng giá, bảng size, phí ship nếu chưa có |
| 5. Duyệt | Đưa bảng: ưu tiên · bình luận · loại · nháp trả lời, qua `review-gate` | Duyệt hoặc sửa nháp |
| 6. Dừng — người dùng tự đăng | Không tự trả lời, ẩn hay xoá bình luận | Tự đăng/ẩn trên fanpage |

**Hay vướng:**
- Dán cả tên người bình luận và số điện thoại vào chat → chỉ cần nội dung bình luận, bỏ thông tin cá nhân.
- Câu trả lời giống hệt nhau cho 50 người → nhờ agent viết vài kiểu khác nhau để không bị coi là bot.
- File CSV không có cột nội dung → cột phải tên `message` hoặc `Nội dung bình luận`.

## 1. Collect

- Paste comments, or export them (CSV with a `Nội dung bình luận`/`message` column), or one per line in a `.txt`.
- With a Meta MCP or Graph API access the user set up, read them from there — the script takes the same CSV.

```bash
node scripts/ads/comment-triage.mjs comments.csv --brand "Tên shop"
node scripts/ads/comment-triage.mjs comments.csv --csv > triage.csv     # for a sheet
```

## 2. Priorities

| P | intent | action |
|---|---|---|
| 1 | `complaint` | reply privately within the hour; public one-liner that you are handling it |
| 1 | `spam_scam` | hide; if someone impersonates the shop, pin an official warning |
| 2 | `ask_size`, `ask_price`, `ask_stock`, `ask_ship`, `want_buy` | answer publicly + send the details by message |
| 3 | `competitor` | no public argument; real differences only (fabric, returns) |
| 4 | `praise` | like, short thanks |

The script's labels are keyword rules — fast and inspectable, and sometimes wrong. **Read every P1
yourself.** A sarcastic "đẹp quá ha 🙂" is a complaint the rules call praise.

## 3. Rewrite the drafts

The drafts contain placeholders (`[GIÁ]`, `[LINK/ẢNH]`, `[PHÍ]`). Fill them from `KNOWLEDGE.md`
(price list, size chart, shipping policy) — **never invent a price, stock level or delivery time**.
If the fact is not on file, the reply says the shop will message them, and the item goes to the
user's list.

Voice: the brand's own (`KNOWLEDGE.md` → voice). Vary wording — 50 identical public replies read
as a bot and Meta treats them like one.

Public replies never contain phone numbers or order details of the customer.

## 4. Review, then hand over

Output a table: priority · comment · intent · draft. Run the drafts through `review-gate`
(`ads-policy-check` too if a reply quotes a price or a discount). Then **stop**: posting, hiding
and deleting are the user's actions. Recurring questions → add the answer to `KNOWLEDGE.md` and
suggest a Messenger auto-reply / FAQ for it (see `docs/28-facebook-ads.md`).
