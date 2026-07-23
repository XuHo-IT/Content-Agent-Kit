# 03 — Conventions (non-negotiable) / Quy ước (bắt buộc)

## English

These rules apply to *every* agent built with this kit.

- **Env-only secrets.** Never hardcode a token, webhook URL, API key, or account
  name in a script. Read from env; if missing, stop with a clear error. (The real
  agents this kit is based on hardcoded secrets — that is the anti-pattern we fix.)
- **Review gate before publish.** Nothing goes live without passing an *independent*
  review subagent (quality, images correct/unique/complete, logic, SEO). Fail → fix
  (2–3 rounds) → still failing → drop it and log why. See `07-review-gate.md`.
- **Idempotent operations.** A `409 Conflict` means "already exists / already done" —
  treat it as success, mark the item done, move on. Never loop-retry a 409.
- **Dedup.** Check `history.json` (titles) before creating; the queue API dedups
  sources by URL. Posted rows are *tombstones* kept forever.
- **Clean up each run.** Delete per-run scratch files (payloads, temp images) at the
  end. Keep only state files (`queue`/`ledger`/`history`) and reports.
- **No AI self-branding.** Author = a random human pen-name. Never append "(AI)".
- **One asset per entity.** If an item has N images (e.g. clue/suspect cards), each
  is distinct — never reuse one image for multiple slots.
- **Language discipline.** Write in the target language with correct diacritics; do
  not mix scripts or leave machine-translation artifacts in titles.
- **Craft is enforced, not hoped for.** "Write well" is unenforceable. Every agent ships a
  `WRITING_CRAFT.md` (registers + banned clichés + before/after examples) that the writer reads
  first, ending in a **measurable rubric** the reviewer scores. See `12-writing-craft.md`.
- **Copyright.** When crawling, keep excerpts only (≤1500 chars) + a source link, and
  write ORIGINAL text. Prefer public-domain sources. See `10-crawl-discovery.md`.

---

## Tiếng Việt

Áp dụng cho *mọi* agent dựng bằng kit này.

- **Secrets env-only.** KHÔNG hardcode token/webhook/key/tài khoản trong script. Đọc
  từ env; thiếu → dừng, báo lỗi rõ. (Agent gốc từng hardcode — đây là anti-pattern.)
- **Review-gate trước khi đăng.** Không gì lên live nếu chưa qua subagent review
  *độc lập* (chất lượng, ảnh đúng/không trùng/đủ, logic, SEO). Fail → sửa (2–3 vòng)
  → vẫn fail → bỏ + ghi lý do. Xem `07-review-gate.md`.
- **Idempotent.** `409` = "đã có / đã xong" → coi là thành công, đánh dấu xong, đi
  tiếp. KHÔNG retry-loop 409.
- **Chống trùng.** Kiểm `history.json` trước khi tạo; queue API dedup nguồn theo URL;
  row `posted` giữ vĩnh viễn (bia mộ).
- **Dọn file mỗi lượt.** Xoá scratch (payload, ảnh tạm) cuối lượt; chỉ giữ state +
  report.
- **KHÔNG tự gắn "(AI)".** Author = bút danh người ngẫu nhiên.
- **Mỗi thực thể 1 ảnh riêng.** Không dùng lại 1 ảnh cho nhiều chỗ.
- **Kỷ luật ngôn ngữ.** Viết đúng ngôn ngữ đích, đủ dấu; không lẫn chữ, không để rác
  dịch máy trong tiêu đề.
- **Văn chương phải ÉP được, không "hy vọng".** "Viết hay" là thứ không ép được. Mỗi agent
  phải có `WRITING_CRAFT.md` (register + danh sách sáo rỗng cấm + ví dụ trước/sau) để subagent
  viết đọc trước, kết bằng **rubric đo được** cho review chấm. Xem `12-writing-craft.md`.
- **Bản quyền.** Crawl chỉ lấy excerpt (≤1500 ký tự) + link; viết NGUYÊN TÁC; ưu tiên
  public-domain. Xem `10-crawl-discovery.md`.
