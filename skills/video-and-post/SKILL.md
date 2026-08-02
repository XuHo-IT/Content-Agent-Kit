---
name: video-and-post
description: Produce a short video and publish it to TikTok / YouTube Shorts / Facebook Reels / Instagram Reels through the Make.com webhook, for an agent built with content-agent-kit. Use when the user says "làm video rồi đăng", "make a video and post it", "đăng video lên các nền tảng", or a daily run reaches its video item. Runs create-video, the review gate, then queues or posts.
---

# Video and post

The end-to-end loop for one video item: content → `script.json` → render → review → publish.

> Antigravity / Gemini: same steps, run the commands directly.

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
  --title "…" --hashtags "#ai #coding" \
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
