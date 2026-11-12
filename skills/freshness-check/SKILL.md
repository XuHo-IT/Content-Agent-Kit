---
name: freshness-check
description: Check and renew the facts the kit relies on that go stale — platform upload limits, Vietnamese advertising and content law, platform policy news (monetisation, AI-content labels), skill licences, the template registry, Vietnamese speech models — by researching the latest official sources on the web. Use at the start of any session that will publish, advertise or deliver to a client, when another skill says to run it first, or when the user asks "có chính sách gì mới", "kiểm tra cập nhật", "luật mới về quảng cáo", "TikTok đổi gì chưa".
---

# Freshness check — kiểm và cập nhật những gì kit dựa vào

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Kit dựa vào những thứ nó không kiểm soát: TikTok nhận video dài bao nhiêu, luật quảng cáo
cho giảm giá bao nhiêu phần trăm, nền tảng có bắt gắn nhãn "do AI tạo" không. Mỗi điều chỉ
đúng ở thời điểm được viết. Skill này tìm ra điều nào đã cũ, lên mạng tra bản mới nhất từ nguồn
chính thức, rồi cập nhật lại, có ghi nguồn.

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Đầu mỗi bước báo
**"Bước n/N — <tên bước>"**. Thường mất 2–10 phút, tuỳ có bao nhiêu mục đã cũ.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Xem mục nào đã cũ | `node scripts/maintenance/freshness.mjs --json --stale` | — |
| 2. Chạy phần tự động | Mục `auto`: chạy lệnh được ghi sẵn (`licence-watch.mjs`, `registry-watch.mjs`) | — |
| 3. Tra cứu | Mục `research` / `code`: tìm bằng các câu truy vấn được ghi sẵn, **đọc nguồn chính thức** | — |
| 4. Cập nhật | Có thay đổi → sửa đúng file được chỉ, ghi nguồn; không đổi → `--mark <id> --note "…"` | Duyệt thay đổi về **luật** trước khi áp dụng |
| 5. Báo lại | Tóm tắt điều gì mới, điều gì ảnh hưởng tới video/bài sắp đăng | Đọc tóm tắt |

**Khi nào chạy:** đầu mỗi phiên sẽ *đăng bài, chạy quảng cáo, hoặc giao video cho khách*.
`daily-run`, `video-and-post` và `ads-policy-check` đều gọi skill này ở bước đầu. Nếu không có
mục nào cũ thì bỏ qua trong vài giây, không làm chậm gì.

## Quy trình chi tiết (cho agent)

1. **List.** `node scripts/maintenance/freshness.mjs --json --stale`. Nothing stale → say so in
   one line and return to the calling skill.
2. **Auto items** (`kind: "auto"`): run `command`. Exit 1 = drift: fix as `update` says
   (licences: edit `skills/registry.json`; after READING a licence GitHub cannot classify,
   `licence-watch.mjs --pin <id>`). Then `--mark <id>`.
3. **Research and code items:** search with every query in `queries` (they already carry this
   year and month). Prefer the domains in `official`; a news article is a lead, not a source —
   follow it to the platform's help page or the legal text (vbpl.vn for Vietnamese law).
   Check the date ON the source page: an undated or old page does not prove a current rule.
4. **Decide, per item:**
   - **Changed and it affects a kit rule** (`kind: "code"`): edit the file in `file` as
     `update` says, bump its CHECKED date, cite the source URL in a comment or `sources`.
     **Law** (`vn-ads-law`, `vn-content-law`): show the user the text and the proposed change
     and wait for a yes — a wrong legal rule blocks or permits real ads.
   - **Changed, no rule in code** (`kind: "research"`): append to `brain/policy-news.md`:
     ```
     ## 2026-11-11 — <item id>
     - **Gì đổi:** … **Từ khi nào:** … **Ai bị ảnh hưởng:** …
     - **Kit cần làm gì:** … (or "không")
     - Nguồn: <url> (ngày trên trang: …)
     ```
     If it changes what may be posted (e.g. a mandatory AI label), also say it in the
     review-gate notes for this session.
   - **Nothing changed:** `node scripts/maintenance/freshness.mjs --mark <id> --note "<what you checked>"`.
5. **Report** in 3–6 lines: what is new, what it means for today's content, what you changed.
   Unsure (sources disagree, no official page)? Say so — do not resolve it by guessing; record
   it as a warning, the way `delivery-specs.mjs` keeps disputed limits soft.

## Rules

- Never weaken a rule on a news article alone. Tightening on a credible report is fine
  (warn); loosening needs the official text.
- Every changed number keeps its source and the date it was read.
- `state/freshness.json` and `brain/policy-news.md` are this project's own record (gitignored).
  A fact that changes the KIT for everyone (a platform limit, a licence) belongs in a commit to
  the kit, so the next user starts fresh.
- Items, their max ages and queries: `scripts/maintenance/lib/freshness.mjs`. Add one when the
  kit starts relying on a new outside fact.
