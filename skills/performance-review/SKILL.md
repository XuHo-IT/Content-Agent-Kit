---
name: performance-review
description: Read how the posted videos actually did and turn it into lessons for the next ones — import the analytics CSV a creator exports from TikTok Studio, Meta Business Suite or YouTube Studio (or pull public YouTube numbers), match each post to the video the kit made, and report which genre, length, hook shape and posting hour beat this channel's own median. Use when the user says "video nào hiệu quả", "xem số liệu", "phân tích kênh", "tuần này thế nào", uploads an analytics export, or once a week before planning.
---

# Performance review — video nào hiệu quả, và vì sao

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Kit làm và đăng video, nhưng tới giờ chưa biết video nào được xem. Skill này đọc số liệu thật
của kênh và chỉ ra điều gì đang hiệu quả **với chính kênh này**, không phải lời khuyên chung chung.

Dẫn người dùng theo các bước dưới, đầu mỗi bước báo **"Bước n/N — <tên bước>"**.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Lấy số liệu | Hướng dẫn xuất file CSV (bên dưới), hoặc lấy số YouTube bằng API key | Xuất file từ app và đưa vào chat/thư mục |
| 2. Nhập | `node scripts/analytics/perf.mjs import <file.csv> --platform tiktok` | — |
| 3. Phân tích | `node scripts/analytics/perf.mjs learn` → `brain/insights.md` | — |
| 4. Đọc kết quả | Kể lại 3–5 điều số liệu nói, kèm số bài làm căn cứ | Quyết định thử gì tiếp |
| 5. Thử có chủ đích | Đề xuất 2–3 video tới để kiểm chứng một phát hiện (ví dụ cùng chủ đề, hai kiểu hook) | Duyệt kế hoạch |

**Xuất CSV ở đâu** (tên menu có thể đổi theo phiên bản app):
- **TikTok:** TikTok Studio (web) → Analytics → Content → Export (hoặc Tải xuống dữ liệu).
- **Facebook:** Meta Business Suite → Insights → Content → Export data.
- **YouTube:** YouTube Studio → Analytics → Advanced mode → Export → CSV. Hoặc không cần xuất:
  `perf.mjs youtube --channel <UC…>` với `YOUTUBE_API_KEY` (chỉ số liệu công khai).

**Hay vướng:**
- "no row with a views number" → file không phải bản xuất số liệu, hoặc xuất nhầm bảng tổng quan.
- "Chưa đủ dữ liệu" là câu trả lời đúng khi kênh còn ít video: cần ≥ 3 bài mỗi nhóm.
- Bài không khớp với video nào của kit → tiêu đề đăng khác hẳn tiêu đề lúc làm; vẫn được tính
  theo nền tảng/giờ đăng, chỉ không tính theo thể loại/hook.

## Quy trình chi tiết (cho agent)

1. **Get numbers.** CSV via `perf.mjs import` (columns are matched by meaning, English or
   Vietnamese; "1,2K", "12,5%", "0:42" all parse). YouTube: `perf.mjs youtube --channel …`.
   Re-importing later updates the same posts.
2. **Learn.** `perf.mjs learn` (default metric `views`; `--metric completion` when the export
   has a "watched full video" column — retention is the better signal for hooks). Each post is
   divided by its platform's median ("lift" — ×2 = twice the channel's usual), matched by title
   to the video the kit made (`brain/**/script.json` — set `"genre"` in every script so it can be
   grouped — and talking-head `*.cuts.json`).
3. **Report honestly.** Only what `findings` holds — each has `n` on both sides. Say it is
   correlation: one hot topic can lift a whole genre. Name the top and bottom 3 with their hooks;
   hooks are what the user can copy or avoid tomorrow.
4. **Feed it forward.** `brain/insights.md` is read by `create-video` (genre, length, hook shape),
   `topic-radar` (which angles travelled) and `review-gate` (a hook shape that keeps losing).
   Propose 2–3 next videos that TEST one finding rather than assuming it.
5. Weekly is enough. Numbers of a post from the last 48 h are not settled — say so.

Method and tests: `scripts/analytics/lib/perf.mjs`, `tests/analytics.test.mjs`.
