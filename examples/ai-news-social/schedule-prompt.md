# Schedule prompt — AI News Social Agent

> Paste into your scheduled task (Antigravity daily task / GitHub Actions step /
> `/daily-run`). This is the daily trigger.

---

Read and execute **examples/ai-news-social/PLAYBOOK.md** for today.

- Pull ideas: `node scripts/queue-client.mjs pull` (skip if empty — pick 4 fresh AI topics).
- Fan out ≥4 subagents, one article each: original VN article (800–1500 words, diacritics,
  hidden Meta/Slug, outro "Thế bạn nghĩ sao về: …?") + engagement comment (≤5 hashtags,
  links only in comment) + a 16:9 image.
- **REVIEW gate is mandatory**: independent review subagent per article (facts, length,
  language, no source plagiarism, image ok). Fail → fix (2–3 rounds) → drop + log.
- Author = random pen-name, never "(AI)". Check `history.json` for duplicates.
- Build the social queue at random times: `node scripts/scheduler/build-queue.mjs items.json
  --windows 4 --gap 90 --out queue.json`, then dispatch via `run-item.mjs` / `register-tasks.mjs`
  / cron → each fires `make-post.mjs` ({mediaUrl,image_url,post,comment}).
- (Optional) also publish to web: `node scripts/publish.mjs <article>.json --image <png>`.
- Mark each used source: `node scripts/queue-client.mjs posted "<source_url>"`.
- Clean up scratch files. Report → `brain/<id>/daily_content_report.md`.

⚠️ No video/voice. No verbatim copy/translation. Never hardcode secrets (env-only).
