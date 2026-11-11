---
name: video-and-post
description: Produce a short video and publish it to TikTok / YouTube Shorts / Facebook Reels / Instagram Reels through the Make.com webhook, for an agent built with content-agent-kit. Use when the user says "làm video rồi đăng", "make a video and post it", "đăng video lên các nền tảng", or a daily run reaches its video item. Runs create-video, the review gate, then queues or posts.
---

# Video and post

The end-to-end loop for one video item: content → `script.json` → render → review → publish.

> Antigravity / Gemini: same steps, run the commands directly.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Chọn bài | Lấy từ hàng đợi (`queue-client.mjs pull`) hoặc bài bạn đưa, kiểm tra chưa làm | Đưa nội dung nếu có |
| 2. Dựng video | Chạy skill `create-video`: viết script, kiểm tra, render (3–5 phút) | — |
| 3. Viết caption | Caption, bình luận đầu tiên, tiêu đề YouTube, hashtag | Duyệt caption |
| 4. Kiểm duyệt | Một reviewer độc lập chấm video và caption | — |
| 5. Chạy thử đăng | `make-post.mjs ... --dry-run`, chưa gửi đi đâu | — |
| 6. Đăng hoặc xếp lịch | Đăng ngay, hoặc `build-queue.mjs` để xếp giờ | Đồng ý đăng và chọn nền tảng |
| 7. Ghi lại | Ghi `history.json`, viết `brain/<slug>/report.md` | — |

**Hay vướng:**
- Thiếu webhook Make.com trong `.env` → bản dry-run vẫn chạy; thêm webhook rồi mới đăng thật.
- Render không chạy trên GitHub Actions → phải render trên máy có ffmpeg, Chrome và OmniVoice.
- Caption chép nguyên văn bài gốc → viết lại bằng lời của bạn và dẫn link.

## 1. Pick the item

From the idea queue (`node scripts/queue-client.mjs pull`), from today's PLAYBOOK phase, or from
what the user handed you. Check `history.json` — skip anything already done.

Work in `brain/<slug>/`.

## 2. Make the video

Invoke the **`create-video`** skill (or follow it as a document). It ends with a validated
`script.json` and a rendered `video.mp4`, and prints `VIDEO=<path>`.

## 3. Write the caption

Separate from the narration — this is the text of the social post, not what is spoken:

- **`post`** — the caption. Follows the project's `WRITING_CRAFT.md` voice, not the video's.
  Emoji and hashtags are fine here.
- **`comment`** — the first comment (engagement / link / source credit).
- **`title`** — required by YouTube; ≤100 characters.
- **`hashtags`** — e.g. `#ai #coding`.

Never put the source's copyrighted text in the caption. Summarize in your own words and link.

**Cover image** — the platforms show it before anyone presses play. A talking-head short gets
one from `talking-head.mjs --cover` (taken before the captions were burned, plus a
`<out>.post.md` brief of what was said); any other video from
`node scripts/video/cover.mjs video.mp4 --title "<≤ 60 ký tự>" --faces --style <the video's>`.
Pass it as `--thumbnail` below.

## 4. Review gate (mandatory)

Invoke the **`review-gate`** skill on the item — an *independent* reviewer, scoring the video
section of the rubric plus the caption. Watch specifically for:

- validator clean at `--strict`
- hook lands in the first 3 seconds
- narration reads naturally aloud — every number spoken correctly
- template variety; on-screen text not overflowing its limits
- outro carries the right brand and URL

Pass → continue. Fail → fix (2–3 rounds) → drop and log why.

## 5. Publish

**Check the payload first — it costs nothing:**

```bash
node scripts/social/make-post.mjs --video brain/<slug>/video.mp4 \
  --post brain/<slug>/caption.txt --comment brain/<slug>/comment.txt \
  --title "…" --hashtags "#ai #coding" --thumbnail brain/<slug>/cover.jpg \
  --platforms tiktok,youtube_shorts,facebook_reels,instagram_reels --dry-run
```

Then either **post now** (drop `--dry-run`), or **schedule it** — the better default, because
rendering is slow and the posting slot should be instant:

```bash
node scripts/scheduler/build-queue.mjs items.json     # assign times → queue.json
node scripts/scheduler/register-tasks.mjs             # schtasks / cron lines
```

The queue item must be `type: "video"` and carry `videoPath` (already rendered), `post`,
`comment`, `title`, `hashtags`, `platforms` — see `templates/state/queue.example.json`.
`run-item.mjs` then only uploads and calls the webhook when the slot fires.

## 6. Record and report

- Add the title to `history.json` (dedup).
- Mark the source `posted` in the idea queue: `node scripts/queue-client.mjs posted <url>`.
- Clean per-run scratch files; keep `script.json`, `video.mp4`, `voice.mp3`, `script.txt`.
- Write `brain/<slug>/report.md`: what was made, the review verdict, where it went.

## Notes

- Rendering needs FFmpeg + Chrome + a local OmniVoice server, and **cannot run on GitHub
  Actions** — see `docs/06-scheduling.md`.
- The Make.com scenario is a Webhook → Router, one filtered route per platform. Payload
  contract: `docs/11-social-posting.md`.
