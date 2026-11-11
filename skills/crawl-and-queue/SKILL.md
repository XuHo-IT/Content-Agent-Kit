---
name: crawl-and-queue
description: Run the crawl4ai discovery pipeline to fill the idea queue for an agent built with content-agent-kit. Use when the user says "crawl for ideas / news", "refresh the idea queue", or when setting up scheduled discovery. Crawls sources.yaml, dedups against the queue API, pushes fresh excerpts.
---

# Crawl → idea queue

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Kiểm danh sách nguồn | Mở `sources.yaml`, chạy thử `python scripts/crawl/crawl.py --dry-run` để xem link tìm được | Gửi các trang nguồn muốn lấy ý tưởng |
| 2. Cài công cụ (một lần) | `pip install -r scripts/crawl/requirements.txt && crawl4ai-setup` | Cho phép cài (có tải Chromium) |
| 3. Kiểm biến môi trường | Cần `SITE_URL`, `INGEST_API_TOKEN` trong `.env` | Điền vào `.env` |
| 4. Chạy | `python scripts/crawl/crawl.py --limit 10` — bỏ link đã có, chỉ lưu đoạn trích ≤ 1500 ký tự + link | — |
| 5. Báo kết quả | Số ý tưởng mới đã đẩy vào hàng đợi | Có muốn chạy tự động hằng ngày không |

**Hay vướng:**
- Bản chạy thử bắt cả link menu, chuyên mục → chỉnh `link_pattern` trong `sources.yaml` cho chặt hơn.
- Muốn lưu nguyên bài viết → không được, chỉ đoạn trích + link; bài đăng phải tự viết.
- Trang WordPress → dùng `node scripts/crawl/wp-fetch.mjs` thay vì crawl, nhẹ hơn nhiều.

## Quy trình chi tiết (cho agent)

1. **Check `sources.yaml`** exists and each source has a `list_url` + a tuned
   `link_pattern`. Loose patterns catch navigation links — verify with a dry run:
   `python scripts/crawl/crawl.py --dry-run` (prints found links only, pushes nothing).
2. **Ensure deps** (once): `pip install -r scripts/crawl/requirements.txt && crawl4ai-setup`
   (installs Chromium — run in CI or on a real machine, not serverless).
3. **Ensure env**: `SITE_URL`, `INGEST_API_TOKEN` (+ `QUEUE_PATH` if not `/api/queue`).
4. **Run**: `python scripts/crawl/crawl.py [--limit N]`. It:
   - GETs `?known=1` to skip URLs the server already has (server = dedup memory),
   - extracts new article links, crawls them, keeps **excerpt ≤1500 chars + link only**,
   - POSTs `{ items }` to the queue (upsert, unique on `source_url`).
5. **Copyright**: never store or republish full source text. The publishing agent writes
   ORIGINAL content from the idea. Prefer public-domain / permitted sources.
6. For automation, install the cron workflow from `templates/workflows/crawl.yml.template`
   and add `SITE_URL` + `INGEST_API_TOKEN` to repo secrets.

> Antigravity: same steps, run the commands directly.
