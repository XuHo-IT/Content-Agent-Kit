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
`type`: `social` | `video` | `publish` | `append` — `scripts/scheduler/run-item.mjs` dispatches on it.

A **video** item carries the render alongside the caption, because rendering happens ahead of
the scheduled slot (see `docs/06-scheduling.md`):
```json
[{ "id": 3, "type": "video", "scheduledTime": "2026-01-01T11:00:00Z", "status": "queued",
   "scriptPath": "brain/<id>/script.json", "videoPath": "brain/<id>/video.mp4",
   "renderedAt": "2026-01-01T04:12:00Z", "post": "...", "comment": "...",
   "title": "...", "hashtags": "#ai", "durationSec": 96,
   "platforms": ["tiktok", "youtube_shorts"] }]
```
`videoPath` absent + `scriptPath` present → `run-item.mjs` renders first, writes `videoPath`
and `renderedAt` back, then posts. That write is what makes a retry post immediately instead
of re-rendering.

**Idempotency.** All writes are safe to repeat. `409` from publish = duplicate = mark
done. The queue API keeps `posted` rows as tombstones so a source is never re-picked.
Video rendering is idempotent per scene — an interrupted render resumes rather than restarts.

---

## Tiếng Việt

Ba file JSON phẳng (gitignore, dựng lại lúc chạy). Helper ở `scripts/lib/state.mjs`.

- **`history.json`** — chống trùng theo tiêu đề (mảng chuỗi).
- **`ledger.json`** — việc nhiều kỳ đang dở: `{id,title,targetParts,partsWritten}`; tạo
  khi publish lần đầu, +1 mỗi `append`, xoá khi `partsWritten >= targetParts`.
- **`queue.json`** — lịch đăng hôm nay: `{id,type,scheduledTime,status,...}`;
  `status: queued → posted|failed`; `type: social | video | publish | append`.
  Item **video** mang thêm `scriptPath`, `videoPath`, `renderedAt`, `title`, `hashtags`,
  `durationSec`, `platforms[]` (xem khối JSON bản EN). Thiếu `videoPath` mà có `scriptPath`
  → `run-item.mjs` render trước, ghi ngược `videoPath` + `renderedAt` vào queue, rồi mới đăng
  — nhờ vậy lần retry đăng luôn thay vì render lại.

**Idempotent:** ghi lặp lại đều an toàn. `409` = trùng = đánh dấu xong. Queue giữ row
`posted` làm bia mộ để không lấy lại nguồn. Render video idempotent theo từng scene — render
bị ngắt giữa chừng thì chạy lại là *tiếp tục*, không phải làm lại từ đầu.
