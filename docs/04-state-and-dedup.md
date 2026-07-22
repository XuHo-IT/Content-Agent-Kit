# 04 — State & dedup / Trạng thái & chống trùng

## English

Three flat JSON files (git-ignored, rebuilt at runtime). Helpers in `scripts/lib/state.mjs`.

**`history.json`** — dedup by title. A string array.
```json
["First article title", "Second article title"]
```

**`ledger.json`** — in-progress serialized/multi-part work. Array of objects.
```json
[{ "id": "abc123", "title": "...", "targetParts": 20, "partsWritten": 6 }]
```
Created on first publish, incremented on each `append`, removed when `partsWritten >= targetParts`.

**`queue.json`** — today's scheduled dispatch. Array of objects.
```json
[{ "id": 1, "type": "social", "scheduledTime": "2026-01-01T12:00:00Z",
   "status": "queued", "post": "...", "comment": "...", "mediaUrl": "..." }]
```
`status`: `queued → posted | failed` (+ `postedAt` / `error`).

**Idempotency.** All writes are safe to repeat. `409` from publish = duplicate = mark
done. The queue API keeps `posted` rows as tombstones so a source is never re-picked.

---

## Tiếng Việt

Ba file JSON phẳng (gitignore, dựng lại lúc chạy). Helper ở `scripts/lib/state.mjs`.

- **`history.json`** — chống trùng theo tiêu đề (mảng chuỗi).
- **`ledger.json`** — việc nhiều kỳ đang dở: `{id,title,targetParts,partsWritten}`; tạo
  khi publish lần đầu, +1 mỗi `append`, xoá khi `partsWritten >= targetParts`.
- **`queue.json`** — lịch đăng hôm nay: `{id,type,scheduledTime,status,...}`;
  `status: queued → posted|failed`.

**Idempotent:** ghi lặp lại đều an toàn. `409` = trùng = đánh dấu xong. Queue giữ row
`posted` làm bia mộ để không lấy lại nguồn.
